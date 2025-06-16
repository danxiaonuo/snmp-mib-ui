package services

import (
	"fmt"
	"time"

	"github.com/go-redis/redis/v8"
	"github.com/gosnmp/gosnmp"
	"gorm.io/gorm"

	"mib-platform/models"
)

type SNMPService struct {
	db    *gorm.DB
	redis *redis.Client
}

func NewSNMPService(db *gorm.DB, redis *redis.Client) *SNMPService {
	return &SNMPService{
		db:    db,
		redis: redis,
	}
}

func (s *SNMPService) SNMPGet(req *models.SNMPRequest) (*models.SNMPResponse, error) {
	start := time.Now()

	// Create SNMP connection
	snmp, err := s.createSNMPConnection(req)
	if err != nil {
		return nil, err
	}
	defer snmp.Conn.Close()

	// Perform SNMP Get
	result, err := snmp.Get([]string{req.OID})
	if err != nil {
		return &models.SNMPResponse{
			Success:   false,
			Message:   err.Error(),
			Timestamp: time.Now(),
			Duration:  time.Since(start).String(),
		}, nil
	}

	// Convert results
	var data []models.SNMPResult
	for _, variable := range result.Variables {
		data = append(data, models.SNMPResult{
			OID:   variable.Name,
			Type:  variable.Type.String(),
			Value: s.convertSNMPValue(variable),
		})
	}

	return &models.SNMPResponse{
		Success:   true,
		Message:   "SNMP Get successful",
		Data:      data,
		Timestamp: time.Now(),
		Duration:  time.Since(start).String(),
		Stats: map[string]interface{}{
			"variables_returned": len(data),
		},
	}, nil
}

func (s *SNMPService) SNMPWalk(req *models.SNMPRequest) (*models.SNMPResponse, error) {
	start := time.Now()

	// Create SNMP connection
	snmp, err := s.createSNMPConnection(req)
	if err != nil {
		return nil, err
	}
	defer snmp.Conn.Close()

	// Perform SNMP Walk
	var data []models.SNMPResult
	err = snmp.Walk(req.OID, func(pdu gosnmp.SnmpPDU) error {
		data = append(data, models.SNMPResult{
			OID:   pdu.Name,
			Type:  pdu.Type.String(),
			Value: s.convertSNMPValue(pdu),
		})
		return nil
	})

	if err != nil {
		return &models.SNMPResponse{
			Success:   false,
			Message:   err.Error(),
			Timestamp: time.Now(),
			Duration:  time.Since(start).String(),
		}, nil
	}

	return &models.SNMPResponse{
		Success:   true,
		Message:   "SNMP Walk successful",
		Data:      data,
		Timestamp: time.Now(),
		Duration:  time.Since(start).String(),
		Stats: map[string]interface{}{
			"variables_returned": len(data),
		},
	}, nil
}

func (s *SNMPService) SNMPSet(req *models.SNMPSetRequest) (*models.SNMPResponse, error) {
	start := time.Now()

	// Create SNMP connection
	snmp, err := s.createSNMPConnection(&req.SNMPRequest)
	if err != nil {
		return nil, err
	}
	defer snmp.Conn.Close()

	// Create PDU for Set operation
	pdu := gosnmp.SnmpPDU{
		Name:  req.OID,
		Type:  s.getSNMPType(req.Type),
		Value: req.Value,
	}

	// Perform SNMP Set
	result, err := snmp.Set([]gosnmp.SnmpPDU{pdu})
	if err != nil {
		return &models.SNMPResponse{
			Success:   false,
			Message:   err.Error(),
			Timestamp: time.Now(),
			Duration:  time.Since(start).String(),
		}, nil
	}

	// Convert results
	var data []models.SNMPResult
	for _, variable := range result.Variables {
		data = append(data, models.SNMPResult{
			OID:   variable.Name,
			Type:  variable.Type.String(),
			Value: s.convertSNMPValue(variable),
		})
	}

	return &models.SNMPResponse{
		Success:   true,
		Message:   "SNMP Set successful",
		Data:      data,
		Timestamp: time.Now(),
		Duration:  time.Since(start).String(),
	}, nil
}

func (s *SNMPService) TestConnection(req *models.SNMPRequest) (map[string]interface{}, error) {
	// Create SNMP connection
	snmp, err := s.createSNMPConnection(req)
	if err != nil {
		return map[string]interface{}{
			"success": false,
			"error":   err.Error(),
		}, nil
	}
	defer snmp.Conn.Close()

	// Test with system uptime OID
	start := time.Now()
	result, err := snmp.Get([]string{"1.3.6.1.2.1.1.3.0"})
	duration := time.Since(start)

	if err != nil {
		return map[string]interface{}{
			"success":      false,
			"error":        err.Error(),
			"response_time": duration.Milliseconds(),
		}, nil
	}

	return map[string]interface{}{
		"success":       true,
		"response_time": duration.Milliseconds(),
		"variables":     len(result.Variables),
		"version":       req.Version,
	}, nil
}

func (s *SNMPService) StartBulkOperation(operationType string, requests []models.SNMPRequest) (*models.BulkOperation, error) {
	// 实现批量操作，使用 goroutines 和进度跟踪
	operationID := fmt.Sprintf("bulk_%d", time.Now().Unix())
	
	// 保存操作状态到 Redis
	status := map[string]interface{}{
		"id":         operationID,
		"total":      len(req.Operations),
		"completed":  0,
		"failed":     0,
		"status":     "running",
		"started_at": time.Now(),
		"results":    []map[string]interface{}{},
	}
	
	statusKey := fmt.Sprintf("bulk_operation:%s", operationID)
	s.redis.Set(context.Background(), statusKey, status, 24*time.Hour)
	
	// 异步执行批量操作
	go func() {
		defer func() {
			status["status"] = "completed"
			status["completed_at"] = time.Now()
			s.redis.Set(context.Background(), statusKey, status, 24*time.Hour)
		}()
		
		// 使用 worker pool 控制并发数
		const maxWorkers = 10
		semaphore := make(chan struct{}, maxWorkers)
		var wg sync.WaitGroup
		var mu sync.Mutex
		
		results := make([]map[string]interface{}, 0, len(req.Operations))
		
		for i, op := range req.Operations {
			wg.Add(1)
			go func(index int, operation SNMPOperation) {
				defer wg.Done()
				semaphore <- struct{}{} // 获取信号量
				defer func() { <-semaphore }() // 释放信号量
				
				// 执行单个 SNMP 操作
				result := s.executeSingleSNMPOperation(operation)
				
				// 更新进度
				mu.Lock()
				results = append(results, map[string]interface{}{
					"index":     index,
					"operation": operation,
					"result":    result,
					"timestamp": time.Now(),
				})
				
				// 更新 Redis 中的状态
				currentStatus := status
				currentStatus["completed"] = len(results)
				if result["error"] != nil {
					currentStatus["failed"] = currentStatus["failed"].(int) + 1
				}
				currentStatus["results"] = results
				s.redis.Set(context.Background(), statusKey, currentStatus, 24*time.Hour)
				mu.Unlock()
				
			}(i, op)
		}
		
		wg.Wait()
	}()
	operation := &models.BulkOperation{
		ID:        fmt.Sprintf("bulk_%d", time.Now().Unix()),
		Type:      operationType,
		Status:    "running",
		Progress:  0,
		Total:     len(requests),
		StartTime: time.Now(),
	}

	// Start background processing
	go s.processBulkOperation(operation, requests)

	return operation, nil
}

func (s *SNMPService) GetBulkOperation(id string) (*models.BulkOperation, error) {
	// 从 Redis 获取操作状态
	statusKey := fmt.Sprintf("bulk_operation:%s", operationID)
	statusData, err := s.redis.Get(context.Background(), statusKey).Result()
	if err != nil {
		return nil, fmt.Errorf("operation not found: %v", err)
	}
	
	var status map[string]interface{}
	if err := json.Unmarshal([]byte(statusData), &status); err != nil {
		return nil, fmt.Errorf("failed to parse operation status: %v", err)
	}
	return &models.BulkOperation{
		ID:       id,
		Status:   "completed",
		Progress: 100,
		Total:    10,
	}, nil
}

func (s *SNMPService) createSNMPConnection(req *models.SNMPRequest) (*gosnmp.GoSNMP, error) {
	snmp := &gosnmp.GoSNMP{
		Target:    req.Target,
		Port:      uint16(req.Port),
		Transport: "udp",
		Timeout:   time.Duration(req.Timeout) * time.Second,
		Retries:   req.Retries,
	}

	// Set default values
	if snmp.Port == 0 {
		snmp.Port = 161
	}
	if snmp.Timeout == 0 {
		snmp.Timeout = 5 * time.Second
	}
	if snmp.Retries == 0 {
		snmp.Retries = 3
	}

	// Configure version and authentication
	switch req.Version {
	case "v1":
		snmp.Version = gosnmp.Version1
		snmp.Community = req.Community
	case "v2c":
		snmp.Version = gosnmp.Version2c
		snmp.Community = req.Community
	case "v3":
		snmp.Version = gosnmp.Version3
		snmp.SecurityModel = gosnmp.UserSecurityModel
		snmp.MsgFlags = gosnmp.AuthNoPriv
		snmp.SecurityParameters = &gosnmp.UsmSecurityParameters{
			UserName:                 req.Username,
			AuthenticationProtocol:   gosnmp.MD5,
			AuthenticationPassphrase: req.AuthKey,
		}
		
		if req.PrivKey != "" {
			snmp.MsgFlags = gosnmp.AuthPriv
			snmp.SecurityParameters.(*gosnmp.UsmSecurityParameters).PrivacyProtocol = gosnmp.DES
			snmp.SecurityParameters.(*gosnmp.UsmSecurityParameters).PrivacyPassphrase = req.PrivKey
		}
	default:
		return nil, fmt.Errorf("unsupported SNMP version: %s", req.Version)
	}

	// Connect
	err := snmp.Connect()
	if err != nil {
		return nil, fmt.Errorf("failed to connect: %v", err)
	}

	return snmp, nil
}

func (s *SNMPService) convertSNMPValue(pdu gosnmp.SnmpPDU) interface{} {
	switch pdu.Type {
	case gosnmp.OctetString:
		return string(pdu.Value.([]byte))
	case gosnmp.Integer:
		return pdu.Value
	case gosnmp.Counter32, gosnmp.Counter64, gosnmp.Gauge32:
		return pdu.Value
	case gosnmp.TimeTicks:
		return pdu.Value
	case gosnmp.IPAddress:
		return pdu.Value.(string)
	default:
		return pdu.Value
	}
}

func (s *SNMPService) getSNMPType(typeStr string) gosnmp.Asn1BER {
	switch typeStr {
	case "integer":
		return gosnmp.Integer
	case "string":
		return gosnmp.OctetString
	case "counter32":
		return gosnmp.Counter32
	case "counter64":
		return gosnmp.Counter64
	case "gauge32":
		return gosnmp.Gauge32
	case "timeticks":
		return gosnmp.TimeTicks
	case "ipaddress":
		return gosnmp.IPAddress
	default:
		return gosnmp.OctetString
	}
}

func (s *SNMPService) processBulkOperation(operation *models.BulkOperation, requests []models.SNMPRequest) {
	// 实现后台批量处理
	go func() {
		defer func() {
			if r := recover(); r != nil {
				s.logger.Error("批量SNMP操作异常", "error", r)
			}
		}()
		
		for i, target := range req.Targets {
			// 更新进度
			progress := float64(i) / float64(len(req.Targets)) * 100
			s.updateBulkProgress(req.BatchID, progress, fmt.Sprintf("处理目标 %d/%d", i+1, len(req.Targets)))
			
			// 执行SNMP操作
			result, err := s.performSNMPOperation(target, req.Operation, req.OID, req.Value)
			if err != nil {
				s.logger.Error("SNMP操作失败", "target", target, "error", err)
				continue
			}
			
			// 存储结果
			s.storeBulkResult(req.BatchID, target, result)
		}
		
		// 完成处理
		s.updateBulkProgress(req.BatchID, 100, "批量操作完成")
	}()
}
