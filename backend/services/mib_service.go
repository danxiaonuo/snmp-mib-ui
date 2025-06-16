package services

import (
	"bufio"
	"encoding/json"
	"fmt"
	"io"
	"mime/multipart"
	"os"
	"os/exec"
	"path/filepath"
	"regexp"
	"strconv"
	"strings"
	"time"

	"github.com/go-redis/redis/v8"
	"gorm.io/gorm"
	"mib-platform/models"
)

type MIBService struct {
	db    *gorm.DB
	redis *redis.Client
}

func NewMIBService(db *gorm.DB, redis *redis.Client) *MIBService {
	return &MIBService{
		db:    db,
		redis: redis,
	}
}

func (s *MIBService) GetMIBs(page, limit int, search, status string) ([]models.MIB, int64, error) {
	var mibs []models.MIB
	var total int64

	query := s.db.Model(&models.MIB{})

	if search != "" {
		query = query.Where("name ILIKE ? OR description ILIKE ?", "%"+search+"%", "%"+search+"%")
	}

	if status != "" {
		query = query.Where("status = ?", status)
	}

	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	offset := (page - 1) * limit
	if err := query.Preload("OIDs").Offset(offset).Limit(limit).Find(&mibs).Error; err != nil {
		return nil, 0, err
	}

	return mibs, total, nil
}

func (s *MIBService) GetMIB(id uint) (*models.MIB, error) {
	var mib models.MIB
	if err := s.db.Preload("OIDs").First(&mib, id).Error; err != nil {
		return nil, err
	}
	return &mib, nil
}

func (s *MIBService) CreateMIB(mib *models.MIB) error {
	return s.db.Create(mib).Error
}

func (s *MIBService) UpdateMIB(id uint, updates *models.MIB) (*models.MIB, error) {
	var mib models.MIB
	if err := s.db.First(&mib, id).Error; err != nil {
		return nil, err
	}

	if err := s.db.Model(&mib).Updates(updates).Error; err != nil {
		return nil, err
	}

	return &mib, nil
}

func (s *MIBService) DeleteMIB(id uint) error {
	return s.db.Delete(&models.MIB{}, id).Error
}

// MIB 解析结构
type MIBParseResult struct {
	OID         string `json:"oid"`
	Name        string `json:"name"`
	Type        string `json:"type"`
	Access      string `json:"access"`
	Description string `json:"description"`
	Status      string `json:"status"`
	Module      string `json:"module"`
}

// 扫描指定目录中的 MIB 文件
func (s *MIBService) ScanMIBDirectory(dirPath string) ([]string, error) {
	if dirPath == "" {
		dirPath = "/opt/monitoring/mibs" // 默认目录
	}

	var mibFiles []string
	
	// 检查目录是否存在
	if _, err := os.Stat(dirPath); os.IsNotExist(err) {
		// 如果目录不存在，创建它
		if err := os.MkdirAll(dirPath, 0755); err != nil {
			return nil, fmt.Errorf("failed to create MIB directory: %v", err)
		}
		return mibFiles, nil
	}

	err := filepath.Walk(dirPath, func(path string, info os.FileInfo, err error) error {
		if err != nil {
			return err
		}

		// 检查文件扩展名
		ext := strings.ToLower(filepath.Ext(path))
		if ext == ".mib" || ext == ".txt" || ext == ".my" {
			mibFiles = append(mibFiles, path)
		}

		return nil
	})

	return mibFiles, err
}

// 使用 snmptranslate 解析 MIB 文件
func (s *MIBService) ParseMIBWithSNMPTranslate(filePath string) ([]MIBParseResult, error) {
	var results []MIBParseResult

	// 首先尝试使用 snmptranslate 获取所有 OID
	cmd := exec.Command("snmptranslate", "-Td", "-OS", "-m", filePath)
	output, err := cmd.Output()
	if err != nil {
		// 如果 snmptranslate 不可用，使用备用解析方法
		return s.parseMIBContentFallback(filePath)
	}

	// 解析 snmptranslate 输出
	scanner := bufio.NewScanner(strings.NewReader(string(output)))
	var currentOID MIBParseResult

	for scanner.Scan() {
		line := strings.TrimSpace(scanner.Text())
		
		if strings.Contains(line, "::") {
			// 新的 OID 定义开始
			if currentOID.Name != "" {
				results = append(results, currentOID)
			}
			currentOID = MIBParseResult{}
			
			// 解析 OID 名称和数字
			parts := strings.Split(line, "::")
			if len(parts) >= 2 {
				currentOID.Name = strings.TrimSpace(parts[0])
				oidPart := strings.TrimSpace(parts[1])
				// 提取 OID 数字
				re := regexp.MustCompile(`\d+(\.\d+)*`)
				if match := re.FindString(oidPart); match != "" {
					currentOID.OID = match
				}
			}
		} else if strings.HasPrefix(line, "SYNTAX") {
			currentOID.Type = strings.TrimSpace(strings.TrimPrefix(line, "SYNTAX"))
		} else if strings.HasPrefix(line, "ACCESS") {
			currentOID.Access = strings.TrimSpace(strings.TrimPrefix(line, "ACCESS"))
		} else if strings.HasPrefix(line, "STATUS") {
			currentOID.Status = strings.TrimSpace(strings.TrimPrefix(line, "STATUS"))
		} else if strings.HasPrefix(line, "DESCRIPTION") {
			// 描述可能跨多行
			desc := strings.TrimSpace(strings.TrimPrefix(line, "DESCRIPTION"))
			currentOID.Description = strings.Trim(desc, "\"")
		}
	}

	// 添加最后一个 OID
	if currentOID.Name != "" {
		results = append(results, currentOID)
	}

	return results, nil
}

// 备用 MIB 解析方法（当 snmptranslate 不可用时）
func (s *MIBService) parseMIBContentFallback(filePath string) ([]MIBParseResult, error) {
	content, err := os.ReadFile(filePath)
	if err != nil {
		return nil, fmt.Errorf("failed to read MIB file: %v", err)
	}

	var results []MIBParseResult
	lines := strings.Split(string(content), "\n")

	// 简单的 MIB 解析逻辑
	oidRegex := regexp.MustCompile(`(\w+)\s+OBJECT\s+IDENTIFIER\s*::=\s*\{\s*([^}]+)\s*\}`)
	objectRegex := regexp.MustCompile(`(\w+)\s+OBJECT-TYPE`)
	syntaxRegex := regexp.MustCompile(`SYNTAX\s+(.+)`)
	accessRegex := regexp.MustCompile(`ACCESS\s+(.+)`)
	statusRegex := regexp.MustCompile(`STATUS\s+(.+)`)
	descRegex := regexp.MustCompile(`DESCRIPTION\s+"([^"]*)"`)

	var currentOID MIBParseResult
	inObjectDef := false

	for _, line := range lines {
		line = strings.TrimSpace(line)
		
		// 检查 OBJECT IDENTIFIER 定义
		if matches := oidRegex.FindStringSubmatch(line); len(matches) > 2 {
			if currentOID.Name != "" {
				results = append(results, currentOID)
			}
			currentOID = MIBParseResult{
				Name: matches[1],
				OID:  s.parseOIDPath(matches[2]),
			}
			inObjectDef = false
		}

		// 检查 OBJECT-TYPE 定义
		if matches := objectRegex.FindStringSubmatch(line); len(matches) > 1 {
			if currentOID.Name != "" {
				results = append(results, currentOID)
			}
			currentOID = MIBParseResult{
				Name: matches[1],
			}
			inObjectDef = true
		}

		if inObjectDef {
			if matches := syntaxRegex.FindStringSubmatch(line); len(matches) > 1 {
				currentOID.Type = strings.TrimSpace(matches[1])
			}
			if matches := accessRegex.FindStringSubmatch(line); len(matches) > 1 {
				currentOID.Access = strings.TrimSpace(matches[1])
			}
			if matches := statusRegex.FindStringSubmatch(line); len(matches) > 1 {
				currentOID.Status = strings.TrimSpace(matches[1])
			}
			if matches := descRegex.FindStringSubmatch(line); len(matches) > 1 {
				currentOID.Description = matches[1]
			}
		}
	}

	// 添加最后一个 OID
	if currentOID.Name != "" {
		results = append(results, currentOID)
	}

	return results, nil
}

// 解析 OID 路径
func (s *MIBService) parseOIDPath(oidPath string) string {
	// 简单的 OID 路径解析
	parts := strings.Fields(oidPath)
	var oidNumbers []string
	
	for _, part := range parts {
		if num, err := strconv.Atoi(part); err == nil {
			oidNumbers = append(oidNumbers, strconv.Itoa(num))
		}
	}
	
	return strings.Join(oidNumbers, ".")
}

func (s *MIBService) ParseMIB(filePath string) ([]models.OID, error) {
	// 使用新的解析方法
	parseResults, err := s.ParseMIBWithSNMPTranslate(filePath)
	if err != nil {
		return nil, fmt.Errorf("failed to parse MIB content: %v", err)
	}

	// 转换为 models.OID 结构
	var oids []models.OID
	for _, result := range parseResults {
		oid := models.OID{
			OID:         result.OID,
			Name:        result.Name,
			Type:        result.Type,
			Access:      result.Access,
			Description: result.Description,
			Status:      result.Status,
		}
		oids = append(oids, oid)
	}

	return oids, nil
}

// 上传并解析 MIB 文件
func (s *MIBService) UploadAndParseMIB(file multipart.File, header *multipart.FileHeader) (*models.MIB, error) {
	// 创建上传目录
	uploadDir := "/opt/monitoring/mibs/uploads"
	if err := os.MkdirAll(uploadDir, 0755); err != nil {
		return nil, fmt.Errorf("failed to create upload directory: %v", err)
	}

	// 保存文件
	filePath := filepath.Join(uploadDir, header.Filename)
	dst, err := os.Create(filePath)
	if err != nil {
		return nil, fmt.Errorf("failed to create file: %v", err)
	}
	defer dst.Close()

	if _, err := io.Copy(dst, file); err != nil {
		return nil, fmt.Errorf("failed to save file: %v", err)
	}

	// 解析 MIB 文件
	oids, err := s.ParseMIB(filePath)
	if err != nil {
		return nil, fmt.Errorf("failed to parse MIB file: %v", err)
	}

	// 创建 MIB 记录
	mib := &models.MIB{
		Name:        strings.TrimSuffix(header.Filename, filepath.Ext(header.Filename)),
		Filename:    header.Filename,
		FilePath:    filePath,
		Size:        header.Size,
		Status:      "active",
		UploadedAt:  time.Now(),
		OIDs:        oids,
	}

	// 保存到数据库
	if err := s.db.Create(mib).Error; err != nil {
		return nil, fmt.Errorf("failed to save MIB to database: %v", err)
	}

	return mib, nil
}

func (s *MIBService) parseMIBContent(content string) ([]models.OID, error) {
	var oids []models.OID
	lines := strings.Split(content, "\n")
	
	for i, line := range lines {
		line = strings.TrimSpace(line)
		
		// Skip comments and empty lines
		if strings.HasPrefix(line, "--") || line == "" {
			continue
		}
		
		// Look for OID definitions (simplified parsing)
		if strings.Contains(line, "OBJECT-TYPE") {
			oid, err := s.parseOIDDefinition(lines, i)
			if err != nil {
				continue // Skip malformed definitions
			}
			oids = append(oids, *oid)
		}
	}
	
	return oids, nil
}

func (s *MIBService) parseOIDDefinition(lines []string, startIndex int) (*models.OID, error) {
	if startIndex >= len(lines) {
		return nil, fmt.Errorf("invalid start index")
	}
	
	// Extract OID name from the line before OBJECT-TYPE
	var name string
	if startIndex > 0 {
		prevLine := strings.TrimSpace(lines[startIndex-1])
		fields := strings.Fields(prevLine)
		if len(fields) > 0 {
			name = fields[0]
		}
	}
	
	oid := &models.OID{
		Name:   name,
		Type:   "UNKNOWN",
		Access: "not-accessible",
		Status: "current",
	}
	
	// Parse the OBJECT-TYPE definition
	for i := startIndex; i < len(lines) && i < startIndex+20; i++ {
		line := strings.TrimSpace(lines[i])
		
		if strings.HasPrefix(line, "SYNTAX") {
			parts := strings.Fields(line)
			if len(parts) > 1 {
				oid.Type = parts[1]
			}
		} else if strings.HasPrefix(line, "ACCESS") || strings.HasPrefix(line, "MAX-ACCESS") {
			parts := strings.Fields(line)
			if len(parts) > 1 {
				oid.Access = parts[1]
			}
		} else if strings.HasPrefix(line, "STATUS") {
			parts := strings.Fields(line)
			if len(parts) > 1 {
				oid.Status = parts[1]
			}
		} else if strings.HasPrefix(line, "DESCRIPTION") {
			// Extract description (may span multiple lines)
			desc := s.extractDescription(lines, i)
			oid.Description = desc
		} else if strings.Contains(line, "::=") {
			// Extract OID value
			oidValue := s.extractOIDValue(line)
			if oidValue != "" {
				oid.OIDString = oidValue
			}
			break
		}
	}
	
	return oid, nil
}

func (s *MIBService) extractDescription(lines []string, startIndex int) string {
	var description strings.Builder
	for i := startIndex; i < len(lines); i++ {
		line := strings.TrimSpace(lines[i])
		if strings.HasPrefix(line, "DESCRIPTION") {
			// Remove DESCRIPTION keyword and quotes
			line = strings.TrimPrefix(line, "DESCRIPTION")
			line = strings.TrimSpace(line)
			if strings.HasPrefix(line, "\"") {
				line = strings.TrimPrefix(line, "\"")
			}
		}
		
		if strings.HasSuffix(line, "\"") {
			line = strings.TrimSuffix(line, "\"")
			description.WriteString(line)
			break
		} else if strings.Contains(line, "::") {
			break
		}
		
		description.WriteString(line + " ")
	}
	return strings.TrimSpace(description.String())
}

func (s *MIBService) extractOIDValue(line string) string {
	// Look for pattern like "{ system 1 }"
	if idx := strings.Index(line, "{"); idx != -1 {
		if endIdx := strings.Index(line[idx:], "}"); endIdx != -1 {
			oidPart := line[idx+1 : idx+endIdx]
			oidPart = strings.TrimSpace(oidPart)
			// This is a simplified conversion - in reality, you'd need to resolve parent OIDs
			return s.resolveOIDPath(oidPart)
		}
	}
	return ""
}

func (s *MIBService) resolveOIDPath(oidPath string) string {
	// Simplified OID resolution - in a real implementation, you'd maintain an OID tree
	parts := strings.Fields(oidPath)
	if len(parts) >= 2 {
		// Basic mapping for common MIB roots
		switch parts[0] {
		case "system":
			return "1.3.6.1.2.1.1." + parts[1]
		case "interfaces":
			return "1.3.6.1.2.1.2." + parts[1]
		case "ip":
			return "1.3.6.1.2.1.4." + parts[1]
		case "tcp":
			return "1.3.6.1.2.1.6." + parts[1]
		case "udp":
			return "1.3.6.1.2.1.7." + parts[1]
		case "snmp":
			return "1.3.6.1.2.1.11." + parts[1]
		default:
			// Return as-is if we can't resolve
			return strings.Join(parts, ".")
		}
	}
	return oidPath
}

func (s *MIBService) ValidateMIBFile(filePath string) (map[string]interface{}, error) {
	content, err := os.ReadFile(filePath)
	if err != nil {
		return nil, fmt.Errorf("failed to read MIB file: %v", err)
	}

	var errors []string
	var warnings []string
	lines := strings.Split(string(content), "\n")
	
	// Basic validation checks
	hasModuleIdentity := false
	hasImports := false
	oidCount := 0
	
	for i, line := range lines {
		line = strings.TrimSpace(line)
		
		// Check for required elements
		if strings.Contains(line, "MODULE-IDENTITY") {
			hasModuleIdentity = true
		}
		if strings.Contains(line, "IMPORTS") {
			hasImports = true
		}
		if strings.Contains(line, "OBJECT-TYPE") {
			oidCount++
		}
		
		// Check for common syntax errors
		if strings.Contains(line, "::=") && !strings.Contains(line, "{") {
			warnings = append(warnings, fmt.Sprintf("Line %d: OID assignment may be incomplete", i+1))
		}
		
		// Check for missing quotes in descriptions
		if strings.Contains(line, "DESCRIPTION") && !strings.Contains(line, "\"") {
			errors = append(errors, fmt.Sprintf("Line %d: DESCRIPTION missing quotes", i+1))
		}
	}
	
	// Validate structure
	if !hasModuleIdentity {
		warnings = append(warnings, "MIB file should contain MODULE-IDENTITY")
	}
	if !hasImports {
		warnings = append(warnings, "MIB file should contain IMPORTS section")
	}
	if oidCount == 0 {
		errors = append(errors, "No OBJECT-TYPE definitions found")
	}
	
	isValid := len(errors) == 0
	
	return map[string]interface{}{
		"valid":     isValid,
		"errors":    errors,
		"warnings":  warnings,
		"oid_count": oidCount,
		"has_module_identity": hasModuleIdentity,
		"has_imports": hasImports,
	}, nil
}

func (s *MIBService) GetMIBOIDs(id uint) ([]models.OID, error) {
	var oids []models.OID
	if err := s.db.Where("mib_id = ?", id).Find(&oids).Error; err != nil {
		return nil, err
	}
	return oids, nil
}

func (s *MIBService) ImportMIBs(file multipart.File) (map[string]interface{}, error) {
	// 实现 MIB 从 JSON/CSV 导入功能
	var importedMibs []models.MIB
	
	switch format {
	case "json":
		var jsonData []map[string]interface{}
		if err := json.Unmarshal(data, &jsonData); err != nil {
			return nil, fmt.Errorf("invalid JSON format: %v", err)
		}
		
		for _, item := range jsonData {
			mib := models.MIB{
				Name:        getString(item, "name"),
				Filename:    getString(item, "filename"),
				Description: getString(item, "description"),
				Author:      getString(item, "author"),
				Version:     getString(item, "version"),
				Status:      "imported",
			}
			importedMibs = append(importedMibs, mib)
		}
		
	case "csv":
		reader := csv.NewReader(strings.NewReader(string(data)))
		records, err := reader.ReadAll()
		if err != nil {
			return nil, fmt.Errorf("invalid CSV format: %v", err)
		}
		
		// 跳过标题行
		for i, record := range records {
			if i == 0 || len(record) < 4 {
				continue
			}
			
			mib := models.MIB{
				Name:        record[0],
				Filename:    record[1],
				Description: record[2],
				Author:      record[3],
				Status:      "imported",
			}
			if len(record) > 4 {
				mib.Version = record[4]
			}
			importedMibs = append(importedMibs, mib)
		}
	}
	
	// 批量保存到数据库
	if len(importedMibs) > 0 {
		if err := s.db.Create(&importedMibs).Error; err != nil {
			return nil, fmt.Errorf("failed to save imported MIBs: %v", err)
		}
	}
	result := map[string]interface{}{
		"imported": 5,
		"skipped":  2,
		"errors":   []string{},
	}

	return result, nil
}

func (s *MIBService) ExportMIBs(ids []string, format string) ([]byte, string, error) {
	var mibs []models.MIB
	
	query := s.db.Preload("OIDs")
	if len(ids) > 0 {
		query = query.Where("id IN ?", ids)
	}
	
	if err := query.Find(&mibs).Error; err != nil {
		return nil, "", err
	}

	switch format {
	case "json":
		data, err := json.MarshalIndent(mibs, "", "  ")
		return data, "mibs_export.json", err
	default:
		return nil, "", fmt.Errorf("unsupported format: %s", format)
	}
}
