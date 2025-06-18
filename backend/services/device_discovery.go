package services

import (
	"fmt"
	"net"
	"strings"
	"sync"
	"time"

	"github.com/gosnmp/gosnmp"
)

// DeviceDiscoveryService 设备发现服务
type DeviceDiscoveryService struct {
	maxConcurrency int
}

// NewDeviceDiscoveryService 创建设备发现服务
func NewDeviceDiscoveryService() *DeviceDiscoveryService {
	return &DeviceDiscoveryService{
		maxConcurrency: 50, // 最大并发数
	}
}

// DiscoveredDeviceInfo 发现的设备信息
type DiscoveredDeviceInfo struct {
	IP           string            `json:"ip"`
	Hostname     string            `json:"hostname"`
	SysDescr     string            `json:"sys_descr"`
	SysObjectID  string            `json:"sys_object_id"`
	SysName      string            `json:"sys_name"`
	SysContact   string            `json:"sys_contact"`
	SysLocation  string            `json:"sys_location"`
	Uptime       string            `json:"uptime"`
	Vendor       string            `json:"vendor"`
	Model        string            `json:"model"`
	DeviceVersion string           `json:"device_version"`
	Interfaces   []Interface       `json:"interfaces"`
	Community    string            `json:"community"`
	SNMPVersion  string            `json:"snmp_version"`
	ResponseTime int64             `json:"response_time_ms"`
	LastSeen     time.Time         `json:"last_seen"`
}

// Interface 接口信息
type Interface struct {
	Index       int    `json:"index"`
	Name        string `json:"name"`
	Description string `json:"description"`
	Type        string `json:"type"`
	Speed       uint64 `json:"speed"`
	AdminStatus int    `json:"admin_status"`
	OperStatus  int    `json:"oper_status"`
	PhysAddress string `json:"phys_address"`
}

// scanCIDRRange 扫描 CIDR 范围内的设备
func (s *DeviceDiscoveryService) scanCIDRRange(cidr, community, version string) []map[string]interface{} {
	var devices []map[string]interface{}
	
	_, ipNet, err := net.ParseCIDR(cidr)
	if err != nil {
		return devices
	}
	
	// 生成 IP 列表
	var ips []string
	for ip := ipNet.IP.Mask(ipNet.Mask); ipNet.Contains(ip); s.incrementIP(ip) {
		ips = append(ips, ip.String())
	}
	
	// 并发扫描
	devices = s.concurrentScan(ips, community, version)
	return devices
}

// scanIPRange 扫描 IP 范围内的设备
func (s *DeviceDiscoveryService) scanIPRange(ipRange, community, version string) []map[string]interface{} {
	var devices []map[string]interface{}
	
	parts := strings.Split(ipRange, "-")
	if len(parts) != 2 {
		return devices
	}
	
	startIP := net.ParseIP(strings.TrimSpace(parts[0]))
	endIP := net.ParseIP(strings.TrimSpace(parts[1]))
	
	if startIP == nil || endIP == nil {
		return devices
	}
	
	// 生成 IP 范围
	var ips []string
	for ip := startIP; !ip.Equal(endIP); s.incrementIP(ip) {
		ips = append(ips, ip.String())
	}
	ips = append(ips, endIP.String()) // 包含结束 IP
	
	// 并发扫描
	devices = s.concurrentScan(ips, community, version)
	return devices
}

// scanSingleIP 扫描单个 IP
func (s *DeviceDiscoveryService) scanSingleIP(ip, community, version string) map[string]interface{} {
	device := s.discoverDevice(ip, community, version)
	if device != nil {
		return map[string]interface{}{
			"ip":            device.IP,
			"hostname":      device.Hostname,
			"sys_descr":     device.SysDescr,
			"sys_name":      device.SysName,
			"vendor":        device.Vendor,
			"model":         device.Model,
			"version":       device.DeviceVersion,
			"community":     device.Community,
			"snmp_version":  device.SNMPVersion,
			"response_time": device.ResponseTime,
			"last_seen":     device.LastSeen,
			"interfaces":    device.Interfaces,
		}
	}
	return nil
}

// concurrentScan 并发扫描多个 IP
func (s *DeviceDiscoveryService) concurrentScan(ips []string, community, version string) []map[string]interface{} {
	var devices []map[string]interface{}
	var mu sync.Mutex
	var wg sync.WaitGroup
	
	// 使用信号量控制并发数
	semaphore := make(chan struct{}, 50)
	
	for _, ip := range ips {
		wg.Add(1)
		go func(targetIP string) {
			defer wg.Done()
			semaphore <- struct{}{} // 获取信号量
			defer func() { <-semaphore }() // 释放信号量
			
			device := s.discoverDevice(targetIP, community, version)
			if device != nil {
				mu.Lock()
				devices = append(devices, map[string]interface{}{
					"ip":            device.IP,
					"hostname":      device.Hostname,
					"sys_descr":     device.SysDescr,
					"sys_name":      device.SysName,
					"vendor":        device.Vendor,
					"model":         device.Model,
					"version":       device.DeviceVersion,
					"community":     device.Community,
					"snmp_version":  device.SNMPVersion,
					"response_time": device.ResponseTime,
					"last_seen":     device.LastSeen,
					"interfaces":    device.Interfaces,
				})
				mu.Unlock()
			}
		}(ip)
	}
	
	wg.Wait()
	return devices
}

// discoverDevice 发现单个设备的详细信息
func (s *DeviceDiscoveryService) discoverDevice(ip, community, version string) *DiscoveredDeviceInfo {
	startTime := time.Now()
	
	// 创建 SNMP 连接
	conn := &gosnmp.GoSNMP{
		Target:    ip,
		Port:      161,
		Community: community,
		Version:   s.parseVersion(version),
		Timeout:   time.Duration(3) * time.Second,
		Retries:   2,
	}
	
	err := conn.Connect()
	if err != nil {
		return nil
	}
	defer conn.Conn.Close()
	
	// 获取系统信息
	systemOIDs := []string{
		"1.3.6.1.2.1.1.1.0", // sysDescr
		"1.3.6.1.2.1.1.2.0", // sysObjectID
		"1.3.6.1.2.1.1.3.0", // sysUpTime
		"1.3.6.1.2.1.1.4.0", // sysContact
		"1.3.6.1.2.1.1.5.0", // sysName
		"1.3.6.1.2.1.1.6.0", // sysLocation
	}
	
	response, err := conn.Get(systemOIDs)
	if err != nil {
		return nil
	}
	
	device := &DiscoveredDeviceInfo{
		IP:           ip,
		Community:    community,
		SNMPVersion:  version,
		ResponseTime: time.Since(startTime).Milliseconds(),
		LastSeen:     time.Now(),
	}
	
	// 解析系统信息
	if len(response.Variables) >= 6 {
		device.SysDescr = s.formatSNMPValue(response.Variables[0])
		device.SysObjectID = s.formatSNMPValue(response.Variables[1])
		device.Uptime = s.formatSNMPValue(response.Variables[2])
		device.SysContact = s.formatSNMPValue(response.Variables[3])
		device.SysName = s.formatSNMPValue(response.Variables[4])
		device.SysLocation = s.formatSNMPValue(response.Variables[5])
		device.Hostname = device.SysName
	}
	
	// 解析厂商和型号信息
	device.Vendor, device.Model, device.DeviceVersion = s.parseDeviceInfo(device.SysDescr, device.SysObjectID)
	
	// 获取接口信息
	device.Interfaces = s.getInterfaceInfo(conn)
	
	return device
}

// parseDeviceInfo 解析设备信息
func (s *DeviceDiscoveryService) parseDeviceInfo(sysDescr, sysObjectID string) (vendor, model, version string) {
	sysDescr = strings.ToLower(sysDescr)
	
	// 厂商识别
	if strings.Contains(sysDescr, "cisco") {
		vendor = "Cisco"
	} else if strings.Contains(sysDescr, "huawei") {
		vendor = "Huawei"
	} else if strings.Contains(sysDescr, "h3c") {
		vendor = "H3C"
	} else if strings.Contains(sysDescr, "juniper") {
		vendor = "Juniper"
	} else if strings.Contains(sysDescr, "arista") {
		vendor = "Arista"
	} else if strings.Contains(sysDescr, "hp") || strings.Contains(sysDescr, "hewlett") {
		vendor = "HP"
	} else {
		vendor = "Unknown"
	}
	
	// 型号和版本解析（简化版本）
	if vendor == "Cisco" {
		// Cisco 设备型号解析
		if strings.Contains(sysDescr, "catalyst") {
			model = "Catalyst Switch"
		} else if strings.Contains(sysDescr, "nexus") {
			model = "Nexus Switch"
		} else if strings.Contains(sysDescr, "asr") {
			model = "ASR Router"
		} else {
			model = "Cisco Device"
		}
	} else if vendor == "Huawei" {
		// 华为设备型号解析
		if strings.Contains(sysDescr, "s5700") {
			model = "S5700 Switch"
		} else if strings.Contains(sysDescr, "s6700") {
			model = "S6700 Switch"
		} else {
			model = "Huawei Device"
		}
	}
	
	// 版本信息提取（简化）
	if strings.Contains(sysDescr, "version") {
		parts := strings.Split(sysDescr, "version")
		if len(parts) > 1 {
			versionPart := strings.TrimSpace(parts[1])
			versionFields := strings.Fields(versionPart)
			if len(versionFields) > 0 {
				version = versionFields[0]
			}
		}
	}
	
	return vendor, model, version
}

// getInterfaceInfo 获取接口信息
func (s *DeviceDiscoveryService) getInterfaceInfo(conn *gosnmp.GoSNMP) []Interface {
	var interfaces []Interface
	
	// 获取接口基本信息
	interfaceOIDs := []string{
		"1.3.6.1.2.1.2.2.1.1", // ifIndex
		"1.3.6.1.2.1.2.2.1.2", // ifDescr
		"1.3.6.1.2.1.2.2.1.3", // ifType
		"1.3.6.1.2.1.2.2.1.5", // ifSpeed
		"1.3.6.1.2.1.2.2.1.7", // ifAdminStatus
		"1.3.6.1.2.1.2.2.1.8", // ifOperStatus
	}
	
	for _, oid := range interfaceOIDs {
		err := conn.Walk(oid, func(pdu gosnmp.SnmpPDU) error {
			// 解析接口信息
			// 这里简化处理，实际应该按接口索引组织数据
			return nil
		})
		if err != nil {
			continue
		}
	}
	
	return interfaces
}

// incrementIP IP 地址递增
func (s *DeviceDiscoveryService) incrementIP(ip net.IP) {
	for j := len(ip) - 1; j >= 0; j-- {
		ip[j]++
		if ip[j] > 0 {
			break
		}
	}
}

// parseVersion 解析 SNMP 版本
func (s *DeviceDiscoveryService) parseVersion(version string) gosnmp.SnmpVersion {
	switch version {
	case "1":
		return gosnmp.Version1
	case "2c":
		return gosnmp.Version2c
	case "3":
		return gosnmp.Version3
	default:
		return gosnmp.Version2c
	}
}

// formatSNMPValue 格式化 SNMP 值
func (s *DeviceDiscoveryService) formatSNMPValue(pdu gosnmp.SnmpPDU) string {
	switch pdu.Type {
	case gosnmp.OctetString:
		if bytes, ok := pdu.Value.([]byte); ok {
			return string(bytes)
		}
		return fmt.Sprintf("%v", pdu.Value)
	case gosnmp.Integer, gosnmp.Counter32, gosnmp.Counter64, gosnmp.Gauge32:
		return fmt.Sprintf("%v", pdu.Value)
	case gosnmp.IPAddress:
		if bytes, ok := pdu.Value.([]byte); ok && len(bytes) == 4 {
			return net.IPv4(bytes[0], bytes[1], bytes[2], bytes[3]).String()
		}
		return fmt.Sprintf("%v", pdu.Value)
	case gosnmp.TimeTicks:
		if ticks, ok := pdu.Value.(uint32); ok {
			days := ticks / (24 * 60 * 60 * 100)
			hours := (ticks % (24 * 60 * 60 * 100)) / (60 * 60 * 100)
			minutes := (ticks % (60 * 60 * 100)) / (60 * 100)
			seconds := (ticks % (60 * 100)) / 100
			return fmt.Sprintf("%dd %dh %dm %ds", days, hours, minutes, seconds)
		}
		return fmt.Sprintf("%v", pdu.Value)
	default:
		return fmt.Sprintf("%v", pdu.Value)
	}
}