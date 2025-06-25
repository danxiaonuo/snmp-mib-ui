# 告警规则配置模块

## 概述

告警规则配置模块是 MIB Web 平台的核心功能之一，提供了完整的告警规则管理、设备监控、智能推荐等功能。该模块支持与 Prometheus/VictoriaMetrics 和 Alertmanager 的深度集成，为网络设备监控提供了强大的告警能力。

## 主要功能

### 1. PromQL 规则编辑器

- **语法高亮和自动补全**：支持 PromQL 语法高亮显示和智能自动补全
- **VictoriaMetrics 特有函数支持**：完整支持 VictoriaMetrics 扩展函数
- **实时语法校验**：实时检查 PromQL 语法错误并提供修正建议
- **查询预览**：支持实时查询预览和结果展示
- **快速插入**：提供常用交换机指标的快速插入功能

### 2. 规则模板库

#### 通用模板
- CPU 使用率监控
- 内存使用率监控
- 设备温度监控
- 端口状态监控
- 流量监控
- 错误包监控

#### 厂商分类模板
- **华为**：支持华为设备特有的 MIB 和指标
- **思科**：支持思科设备的专用监控指标
- **H3C**：支持 H3C 设备的特定监控项
- **其他厂商**：支持 Juniper、Arista 等主流厂商

#### 设备级别分类
- **核心设备**：高优先级告警，严格阈值
- **汇聚设备**：中等优先级告警
- **接入设备**：基础监控告警

### 3. 批量规则管理

- **批量创建**：选择设备组批量应用告警模板
- **批量修改**：批量调整告警阈值和参数
- **批量操作**：批量启用/禁用告警规则
- **搜索过滤**：支持多维度搜索和过滤功能

### 4. 设备分组管理

#### 设备标签系统
- **地理位置标签**：按机房、楼层、区域分类
- **业务标签**：按业务线、部门、项目分组
- **设备属性标签**：按设备类型、厂商、型号分类
- **重要性标签**：按设备重要性级别分组
- **多维度查询**：支持标签组合查询和筛选

#### 规则组织结构
- **分组规则创建**：按设备分组创建对应的告警规则组
- **继承机制**：支持规则组的继承和覆盖
- **批量操作**：支持规则组的批量管理

### 5. Alertmanager 配置管理

#### 路由规则配置
- **可视化编辑器**：图形化路由规则编辑界面
- **标签匹配**：基于标签的智能路由匹配
- **正则表达式**：支持正则表达式和精确匹配
- **路由测试**：提供路由规则测试功能

#### 告警分组和抑制
- **分组策略**：灵活的告警分组策略配置
- **抑制规则**：防止告警风暴的抑制规则设置
- **静默管理**：告警静默规则的管理

#### 通知渠道管理
- **多种接收器**：支持邮件、钉钉、企微、短信等通知方式
- **分级通知**：不同级别告警使用不同通知策略
- **模板自定义**：支持通知模板的自定义配置

### 6. 配置下发与同步

#### 配置生成引擎
- **格式转换**：UI 配置自动转换为 Prometheus rules 格式
- **配置生成**：自动生成 Alertmanager 配置文件
- **校验格式化**：配置文件的自动校验和格式化

#### 配置同步系统
- **API 推送**：支持 API 方式推送配置
- **文件同步**：支持文件方式同步配置
- **热重载**：支持配置的热重载
- **状态监控**：实时监控同步状态和异常

### 7. 设备自动发现

#### VictoriaMetrics 扫描
- **时序数据扫描**：定期扫描 VM 中的时序数据
- **设备标识提取**：从指标中提取设备标识信息
- **在线状态检测**：通过 up 指标识别设备在线状态
- **自动识别**：自动识别新上线和下线设备

#### 设备信息补全
- **SNMP 信息获取**：通过 SNMP 获取设备详细信息
- **自动分类**：根据设备信息自动分类
- **地理位置推断**：通过 IP 地址段推断设备位置
- **状态同步**：实时同步设备状态信息

### 8. 智能告警规则推荐

#### 基于设备类型推荐
- **新设备推荐**：为新发现的设备推荐合适的告警模板
- **指标匹配**：根据设备指标智能匹配告警规则
- **批量应用**：为同类型设备批量应用相同规则

#### 缺失规则检测
- **覆盖率分析**：分析设备监控覆盖率
- **缺失提醒**：提醒用户为设备配置监控
- **覆盖率报告**：生成监控覆盖率报告

### 9. 运维管理功能

#### 告警规则监控
- **执行状态**：实时显示规则执行状态
- **触发统计**：统计规则触发频率
- **性能分析**：识别慢查询规则并提供优化建议

#### 配置版本管理
- **变更历史**：记录所有配置变更历史
- **版本对比**：支持配置版本对比功能
- **一键回滚**：支持一键回滚到历史版本

#### 批量导入导出
- **Excel/CSV 导入**：支持批量导入告警规则
- **配置导出**：支持配置导出用于备份或迁移
- **Prometheus 导入**：从现有 Prometheus rules 文件导入

## 技术架构

### 前端架构

- **框架**：Next.js 14 + React 18
- **UI 组件**：Ant Design + 自定义组件
- **状态管理**：React Hooks + Context API
- **代码编辑器**：Monaco Editor (支持 PromQL 语法)
- **图表组件**：ECharts + React-ECharts

### 后端架构

- **框架**：Gin (Go)
- **数据库**：PostgreSQL
- **缓存**：Redis
- **外部集成**：Prometheus/VictoriaMetrics API、Alertmanager API
- **任务调度**：Cron 定时任务

### 数据库设计

#### 核心表结构

1. **alert_rule_groups** - 告警规则组
2. **alert_rules** - 告警规则
3. **device_groups** - 设备分组
4. **devices** - 设备信息
5. **alert_rule_templates** - 告警规则模板
6. **alertmanager_configs** - Alertmanager 配置
7. **sync_history** - 同步历史记录
8. **rule_recommendations** - 智能推荐
9. **discovered_devices** - 发现的设备

## API 接口

### 告警规则管理

```
GET    /api/alert-rules              # 获取告警规则列表
POST   /api/alert-rules              # 创建告警规则
GET    /api/alert-rules/:id          # 获取告警规则详情
PUT    /api/alert-rules/:id          # 更新告警规则
DELETE /api/alert-rules/:id          # 删除告警规则
POST   /api/alert-rules/batch        # 批量操作
POST   /api/alert-rules/import       # 导入规则
GET    /api/alert-rules/export       # 导出规则
```

### PromQL 相关

```
POST   /api/promql/validate          # 验证 PromQL 语法
POST   /api/promql/query             # 执行 PromQL 查询
GET    /api/promql/metrics           # 获取指标列表
GET    /api/promql/functions         # 获取函数列表
GET    /api/promql/templates         # 获取模板列表
```

### 设备管理

```
GET    /api/device-groups            # 获取设备分组
POST   /api/device-groups            # 创建设备分组
POST   /api/device-discovery/scan    # 扫描设备
GET    /api/device-discovery/status  # 获取扫描状态
```

### 智能推荐

```
GET    /api/recommendations          # 获取推荐列表
POST   /api/recommendations/generate # 生成新推荐
POST   /api/recommendations/apply    # 应用推荐
```

## 配置说明

### 环境变量配置

```bash
# Prometheus/VictoriaMetrics 配置
PROMETHEUS_URL=http://localhost:8428
PROMETHEUS_TIMEOUT=30s

# Alertmanager 配置
ALERTMANAGER_URL=http://localhost:9093
ALERTMANAGER_TIMEOUT=30s

# 告警规则配置
ALERT_RULES_ENABLED=true
ALERT_RULES_SYNC_INTERVAL=300
ALERT_RULES_BACKUP_ENABLED=true

# 设备发现配置
DEVICE_DISCOVERY_ENABLED=true
DEVICE_DISCOVERY_INTERVAL=3600

# 智能推荐配置
RECOMMENDATION_ENABLED=true
RECOMMENDATION_MIN_CONFIDENCE=0.7
```

## 部署指南

### 1. 数据库初始化

```bash
# 执行数据库迁移
psql -U mibweb -d mibweb -f backend/migrations/20241201_create_alert_rules_tables.sql
```

### 2. 配置文件

```bash
# 复制环境变量配置
cp .env.example .env

# 修改配置文件
vim .env
```

### 3. 启动服务

```bash
# 启动后端服务
cd backend
go run main.go

# 启动前端服务
cd frontend
npm run dev
```

## 使用指南

### 1. 创建设备分组

1. 进入「设备分组管理」页面
2. 点击「新建分组」
3. 填写分组信息和标签
4. 添加设备到分组

### 2. 配置告警规则

1. 进入「告警规则配置」页面
2. 选择设备分组
3. 选择或创建告警模板
4. 配置告警参数和阈值
5. 保存并同步配置

### 3. 设置通知渠道

1. 进入「Alertmanager 配置」页面
2. 配置接收器（邮件、钉钉等）
3. 设置路由规则
4. 配置通知模板

### 4. 监控告警状态

1. 查看告警规则执行状态
2. 监控告警触发情况
3. 分析告警趋势和统计

## 故障排除

### 常见问题

1. **PromQL 查询失败**
   - 检查 Prometheus/VictoriaMetrics 连接
   - 验证 PromQL 语法
   - 检查指标是否存在

2. **配置同步失败**
   - 检查 Alertmanager 连接
   - 验证配置文件格式
   - 查看同步日志

3. **设备发现异常**
   - 检查网络连通性
   - 验证 SNMP 配置
   - 查看发现日志

### 日志查看

```bash
# 查看后端日志
tail -f backend/logs/app.log

# 查看同步日志
tail -f backend/logs/sync.log

# 查看发现日志
tail -f backend/logs/discovery.log
```

## 性能优化

### 1. 数据库优化

- 为常用查询字段添加索引
- 定期清理历史数据
- 优化复杂查询语句

### 2. 缓存优化

- 缓存常用的设备信息
- 缓存告警规则模板
- 缓存 PromQL 查询结果

### 3. 查询优化

- 避免复杂的 PromQL 查询
- 合理设置查询时间范围
- 使用批量查询减少请求次数

## 扩展开发

### 1. 添加新的告警模板

```sql
INSERT INTO alert_rule_templates (
    name, description, category, vendor, device_type,
    promql_template, severity, for_duration, labels, annotations
) VALUES (
    '自定义模板', '模板描述', 'custom', 'generic', 'switch',
    'up{job="switch"} == 0', 'critical', '5m',
    '{"alertname": "设备离线"}',
    '{"summary": "设备 {{ $labels.instance }} 离线"}'
);
```

### 2. 扩展设备发现逻辑

```go
// 在 device_discovery.go 中添加新的发现方法
func (s *AlertRulesService) DiscoverCustomDevices() error {
    // 实现自定义设备发现逻辑
    return nil
}
```

### 3. 添加新的通知渠道

```go
// 在 alertmanager_config.go 中添加新的接收器类型
type CustomReceiver struct {
    Name string `json:"name"`
    URL  string `json:"url"`
    // 其他配置字段
}
```

## 版本历史

- **v1.0.0** (2025-06-09)
  - 初始版本发布
  - 基础告警规则管理功能
  - PromQL 编辑器
  - 设备分组管理
  - Alertmanager 配置管理
  - 设备自动发现
  - 智能推荐功能

## 贡献指南

1. Fork 项目
2. 创建功能分支
3. 提交代码变更
4. 创建 Pull Request
5. 等待代码审查

## 许可证

本项目采用 MIT 许可证，详见 LICENSE 文件。