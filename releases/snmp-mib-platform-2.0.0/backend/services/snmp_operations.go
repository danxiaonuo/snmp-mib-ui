package services

import (
	"fmt"
	"net"
	"strconv"
	"time"

	"github.com/gosnmp/gosnmp"
)

// SNMPOperation 定义 SNMP 操作结构
type SNMPOperation struct {
	Type      string `json:"type"`      // get, walk, set
	Target    string `json:"target"`    // IP 地址
	Community string `json:"community"` // SNMP 社区字符串
	Version   string `json:"version"`   // SNMP 版本
	OID       string `json:"oid"`       // 目标 OID
	Value     string `json:"value"`     // SET 操作的值
	ValueType string `json:"valueType"` // 值类型
}

// executeSingleSNMPOperation 执行单个 SNMP 操作
func (s *SNMPService) executeSingleSNMPOperation(operation SNMPOperation) map[string]interface{} {
	result := map[string]interface{}{
		"success": false,
		"data":    nil,
		"error":   nil,
		"timing":  nil,
	}

	startTime := time.Now()
	defer func() {
		result["timing"] = time.Since(startTime).Milliseconds()
	}()

	// 创建 SNMP 连接
	conn := &gosnmp.GoSNMP{
		Target:    operation.Target,
		Port:      161,
		Community: operation.Community,
		Version:   s.parseVersion(operation.Version),
		Timeout:   time.Duration(5) * time.Second,
		Retries:   3,
	}

	err := conn.Connect()
	if err != nil {
		result["error"] = fmt.Sprintf("连接失败: %v", err)
		return result
	}
	defer conn.Conn.Close()

	switch operation.Type {
	case "get":
		return s.performSNMPGet(conn, operation.OID, result)
	case "walk":
		return s.performSNMPWalk(conn, operation.OID, result)
	case "set":
		return s.performSNMPSet(conn, operation.OID, operation.Value, operation.ValueType, result)
	default:
		result["error"] = fmt.Sprintf("不支持的操作类型: %s", operation.Type)
		return result
	}
}

// performSNMPGet 执行 SNMP GET 操作
func (s *SNMPService) performSNMPGet(conn *gosnmp.GoSNMP, oid string, result map[string]interface{}) map[string]interface{} {
	response, err := conn.Get([]string{oid})
	if err != nil {
		result["error"] = fmt.Sprintf("GET 操作失败: %v", err)
		return result
	}

	if len(response.Variables) == 0 {
		result["error"] = "没有返回数据"
		return result
	}

	variable := response.Variables[0]
	result["success"] = true
	result["data"] = map[string]interface{}{
		"oid":   variable.Name,
		"type":  variable.Type.String(),
		"value": s.formatSNMPValue(variable),
	}

	return result
}

// performSNMPWalk 执行 SNMP WALK 操作
func (s *SNMPService) performSNMPWalk(conn *gosnmp.GoSNMP, oid string, result map[string]interface{}) map[string]interface{} {
	var walkData []map[string]interface{}

	err := conn.Walk(oid, func(pdu gosnmp.SnmpPDU) error {
		walkData = append(walkData, map[string]interface{}{
			"oid":   pdu.Name,
			"type":  pdu.Type.String(),
			"value": s.formatSNMPValue(pdu),
		})
		return nil
	})

	if err != nil {
		result["error"] = fmt.Sprintf("WALK 操作失败: %v", err)
		return result
	}

	result["success"] = true
	result["data"] = walkData
	return result
}

// performSNMPSet 执行 SNMP SET 操作
func (s *SNMPService) performSNMPSet(conn *gosnmp.GoSNMP, oid, value, valueType string, result map[string]interface{}) map[string]interface{} {
	// 解析值类型和值
	var pdu gosnmp.SnmpPDU
	pdu.Name = oid

	switch valueType {
	case "integer":
		if intVal, err := strconv.Atoi(value); err == nil {
			pdu.Type = gosnmp.Integer
			pdu.Value = intVal
		} else {
			result["error"] = fmt.Sprintf("无效的整数值: %s", value)
			return result
		}
	case "string":
		pdu.Type = gosnmp.OctetString
		pdu.Value = value
	case "oid":
		pdu.Type = gosnmp.ObjectIdentifier
		pdu.Value = value
	default:
		result["error"] = fmt.Sprintf("不支持的值类型: %s", valueType)
		return result
	}

	response, err := conn.Set([]gosnmp.SnmpPDU{pdu})
	if err != nil {
		result["error"] = fmt.Sprintf("SET 操作失败: %v", err)
		return result
	}

	result["success"] = true
	result["data"] = map[string]interface{}{
		"oid":      oid,
		"setValue": value,
		"response": len(response.Variables) > 0,
	}

	return result
}

// formatSNMPValue 格式化 SNMP 值
func (s *SNMPService) formatSNMPValue(pdu gosnmp.SnmpPDU) interface{} {
	switch pdu.Type {
	case gosnmp.OctetString:
		if bytes, ok := pdu.Value.([]byte); ok {
			return string(bytes)
		}
		return pdu.Value
	case gosnmp.Integer, gosnmp.Counter32, gosnmp.Counter64, gosnmp.Gauge32:
		return pdu.Value
	case gosnmp.IPAddress:
		if bytes, ok := pdu.Value.([]byte); ok && len(bytes) == 4 {
			return net.IPv4(bytes[0], bytes[1], bytes[2], bytes[3]).String()
		}
		return pdu.Value
	case gosnmp.TimeTicks:
		if ticks, ok := pdu.Value.(uint32); ok {
			return fmt.Sprintf("%d ticks (%.2f seconds)", ticks, float64(ticks)/100.0)
		}
		return pdu.Value
	default:
		return pdu.Value
	}
}

// parseVersion 解析 SNMP 版本
func (s *SNMPService) parseVersion(version string) gosnmp.SnmpVersion {
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

// TestSNMPConnection 测试 SNMP 连接
func (s *SNMPService) TestSNMPConnection(target, community, version string) map[string]interface{} {
	result := map[string]interface{}{
		"success":     false,
		"reachable":   false,
		"snmp_works":  false,
		"system_info": nil,
		"error":       nil,
		"timing":      nil,
	}

	startTime := time.Now()
	defer func() {
		result["timing"] = time.Since(startTime).Milliseconds()
	}()

	// 首先测试网络连通性
	conn, err := net.DialTimeout("udp", fmt.Sprintf("%s:161", target), 5*time.Second)
	if err != nil {
		result["error"] = fmt.Sprintf("网络不可达: %v", err)
		return result
	}
	conn.Close()
	result["reachable"] = true

	// 测试 SNMP 连接
	snmpConn := &gosnmp.GoSNMP{
		Target:    target,
		Port:      161,
		Community: community,
		Version:   s.parseVersion(version),
		Timeout:   time.Duration(5) * time.Second,
		Retries:   2,
	}

	err = snmpConn.Connect()
	if err != nil {
		result["error"] = fmt.Sprintf("SNMP 连接失败: %v", err)
		return result
	}
	defer snmpConn.Conn.Close()

	result["snmp_works"] = true

	// 获取系统信息
	systemOIDs := []string{
		"1.3.6.1.2.1.1.1.0", // sysDescr
		"1.3.6.1.2.1.1.2.0", // sysObjectID
		"1.3.6.1.2.1.1.3.0", // sysUpTime
		"1.3.6.1.2.1.1.4.0", // sysContact
		"1.3.6.1.2.1.1.5.0", // sysName
		"1.3.6.1.2.1.1.6.0", // sysLocation
	}

	response, err := snmpConn.Get(systemOIDs)
	if err != nil {
		result["error"] = fmt.Sprintf("获取系统信息失败: %v", err)
		return result
	}

	systemInfo := make(map[string]interface{})
	oidNames := []string{"sysDescr", "sysObjectID", "sysUpTime", "sysContact", "sysName", "sysLocation"}

	for i, variable := range response.Variables {
		if i < len(oidNames) {
			systemInfo[oidNames[i]] = s.formatSNMPValue(variable)
		}
	}

	result["success"] = true
	result["system_info"] = systemInfo
	return result
}