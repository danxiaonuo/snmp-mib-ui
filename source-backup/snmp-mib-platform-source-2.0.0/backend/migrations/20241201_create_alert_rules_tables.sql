-- 告警规则组表
CREATE TABLE IF NOT EXISTS alert_rule_groups (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    interval_seconds INTEGER DEFAULT 60,
    status VARCHAR(20) DEFAULT 'active',
    created_by VARCHAR(100),
    updated_by VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_status (status),
    INDEX idx_created_at (created_at)
);

-- 设备分组表
CREATE TABLE IF NOT EXISTS device_groups (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    tags JSON,
    selector JSON,
    device_count INTEGER DEFAULT 0,
    created_by VARCHAR(100),
    updated_by VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_name (name),
    INDEX idx_created_at (created_at)
);

-- 告警规则表
CREATE TABLE IF NOT EXISTS alert_rules (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    expression TEXT NOT NULL,
    duration VARCHAR(20) DEFAULT '5m',
    severity VARCHAR(20) DEFAULT 'warning',
    status VARCHAR(20) DEFAULT 'active',
    group_id VARCHAR(36),
    device_group_id VARCHAR(36),
    labels JSON,
    annotations JSON,
    last_evaluation TIMESTAMP NULL,
    evaluation_count INTEGER DEFAULT 0,
    alert_count INTEGER DEFAULT 0,
    created_by VARCHAR(100),
    updated_by VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (group_id) REFERENCES alert_rule_groups(id) ON DELETE SET NULL,
    FOREIGN KEY (device_group_id) REFERENCES device_groups(id) ON DELETE SET NULL,
    INDEX idx_group_id (group_id),
    INDEX idx_device_group_id (device_group_id),
    INDEX idx_status (status),
    INDEX idx_severity (severity),
    INDEX idx_created_at (created_at)
);

-- 告警规则模板表
CREATE TABLE IF NOT EXISTS alert_rule_templates (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100),
    vendor VARCHAR(100),
    device_type VARCHAR(100),
    expression TEXT NOT NULL,
    duration VARCHAR(20) DEFAULT '5m',
    severity VARCHAR(20) DEFAULT 'warning',
    labels JSON,
    annotations JSON,
    variables JSON,
    is_builtin BOOLEAN DEFAULT FALSE,
    usage_count INTEGER DEFAULT 0,
    created_by VARCHAR(100),
    updated_by VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_category (category),
    INDEX idx_vendor (vendor),
    INDEX idx_device_type (device_type),
    INDEX idx_usage_count (usage_count),
    INDEX idx_created_at (created_at)
);

-- 设备表（如果不存在）
CREATE TABLE IF NOT EXISTS devices (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    ip_address VARCHAR(45),
    device_type VARCHAR(100),
    vendor VARCHAR(100),
    model VARCHAR(100),
    location VARCHAR(255),
    status VARCHAR(20) DEFAULT 'unknown',
    tags JSON,
    last_seen TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_ip_address (ip_address),
    INDEX idx_device_type (device_type),
    INDEX idx_vendor (vendor),
    INDEX idx_status (status),
    INDEX idx_last_seen (last_seen)
);

-- 设备分组关联表
CREATE TABLE IF NOT EXISTS device_group_devices (
    device_group_id VARCHAR(36),
    device_id VARCHAR(36),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (device_group_id, device_id),
    FOREIGN KEY (device_group_id) REFERENCES device_groups(id) ON DELETE CASCADE,
    FOREIGN KEY (device_id) REFERENCES devices(id) ON DELETE CASCADE
);

-- Alertmanager配置表
CREATE TABLE IF NOT EXISTS alertmanager_configs (
    id VARCHAR(36) PRIMARY KEY,
    version INTEGER DEFAULT 1,
    global JSON,
    route JSON,
    receivers JSON,
    inhibit_rules JSON,
    templates JSON,
    status VARCHAR(20) DEFAULT 'active',
    config_hash VARCHAR(64),
    created_by VARCHAR(100),
    updated_by VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_version (version),
    INDEX idx_status (status),
    INDEX idx_created_at (created_at)
);

-- 配置同步历史表
CREATE TABLE IF NOT EXISTS sync_histories (
    id VARCHAR(36) PRIMARY KEY,
    type VARCHAR(50) NOT NULL,
    target VARCHAR(255) NOT NULL,
    config_type VARCHAR(50),
    status VARCHAR(20) NOT NULL,
    message TEXT,
    config_hash VARCHAR(64),
    duration INTEGER,
    triggered_by VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_type (type),
    INDEX idx_status (status),
    INDEX idx_created_at (created_at)
);

-- 智能推荐表
CREATE TABLE IF NOT EXISTS rule_recommendations (
    id VARCHAR(36) PRIMARY KEY,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    priority VARCHAR(20) DEFAULT 'medium',
    confidence DECIMAL(3,2) DEFAULT 0.5,
    status VARCHAR(20) DEFAULT 'pending',
    rule_config JSON,
    analysis_data JSON,
    applied_at TIMESTAMP NULL,
    rejected_at TIMESTAMP NULL,
    rejection_reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_type (type),
    INDEX idx_priority (priority),
    INDEX idx_status (status),
    INDEX idx_confidence (confidence),
    INDEX idx_created_at (created_at)
);

-- 发现的设备表
CREATE TABLE IF NOT EXISTS discovered_devices (
    id VARCHAR(36) PRIMARY KEY,
    instance VARCHAR(255) NOT NULL,
    job VARCHAR(100),
    device_type VARCHAR(100),
    vendor VARCHAR(100),
    model VARCHAR(100),
    location VARCHAR(255),
    status VARCHAR(20) DEFAULT 'online',
    metrics JSON,
    last_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    first_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_monitored BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_instance (instance),
    INDEX idx_job (job),
    INDEX idx_device_type (device_type),
    INDEX idx_status (status),
    INDEX idx_last_seen (last_seen),
    INDEX idx_is_monitored (is_monitored)
);

-- 插入默认的告警规则模板
INSERT INTO alert_rule_templates (id, name, description, category, vendor, device_type, expression, duration, severity, labels, annotations, variables, is_builtin, created_by, updated_by) VALUES
('tpl-001', 'CPU使用率过高', '监控设备CPU使用率，超过阈值时告警', 'performance', 'generic', 'switch', 'cpu_usage{instance="{{instance}}"} > {{threshold}}', '5m', 'warning', 
 JSON_OBJECT('alertname', 'HighCPUUsage', 'component', 'cpu'), 
 JSON_OBJECT('summary', 'CPU使用率过高', 'description', '设备 {{$labels.instance}} CPU使用率为 {{$value}}%，超过阈值 {{threshold}}%'), 
 JSON_OBJECT('threshold', JSON_OBJECT('type', 'number', 'default', 80, 'description', 'CPU使用率阈值(%)')), 
 TRUE, 'system', 'system'),

('tpl-002', '内存使用率过高', '监控设备内存使用率，超过阈值时告警', 'performance', 'generic', 'switch', 'memory_usage{instance="{{instance}}"} > {{threshold}}', '5m', 'warning',
 JSON_OBJECT('alertname', 'HighMemoryUsage', 'component', 'memory'),
 JSON_OBJECT('summary', '内存使用率过高', 'description', '设备 {{$labels.instance}} 内存使用率为 {{$value}}%，超过阈值 {{threshold}}%'),
 JSON_OBJECT('threshold', JSON_OBJECT('type', 'number', 'default', 85, 'description', '内存使用率阈值(%)')),
 TRUE, 'system', 'system'),

('tpl-003', '设备温度过高', '监控设备温度，超过阈值时告警', 'environment', 'generic', 'switch', 'device_temperature{instance="{{instance}}"} > {{threshold}}', '3m', 'critical',
 JSON_OBJECT('alertname', 'HighTemperature', 'component', 'temperature'),
 JSON_OBJECT('summary', '设备温度过高', 'description', '设备 {{$labels.instance}} 温度为 {{$value}}°C，超过阈值 {{threshold}}°C'),
 JSON_OBJECT('threshold', JSON_OBJECT('type', 'number', 'default', 70, 'description', '温度阈值(°C)')),
 TRUE, 'system', 'system'),

('tpl-004', '端口状态异常', '监控交换机端口状态，检测端口down', 'connectivity', 'generic', 'switch', 'port_status{instance="{{instance}}", port="{{port}}"} == 0', '1m', 'warning',
 JSON_OBJECT('alertname', 'PortDown', 'component', 'port'),
 JSON_OBJECT('summary', '端口状态异常', 'description', '设备 {{$labels.instance}} 端口 {{$labels.port}} 状态为 down'),
 JSON_OBJECT('port', JSON_OBJECT('type', 'string', 'default', '*', 'description', '端口名称或通配符')),
 TRUE, 'system', 'system'),

('tpl-005', '设备离线', '监控设备在线状态，检测设备离线', 'connectivity', 'generic', 'switch', 'up{instance="{{instance}}"} == 0', '1m', 'critical',
 JSON_OBJECT('alertname', 'DeviceDown', 'component', 'device'),
 JSON_OBJECT('summary', '设备离线', 'description', '设备 {{$labels.instance}} 已离线'),
 JSON_OBJECT(),
 TRUE, 'system', 'system');

-- 插入默认的设备分组
INSERT INTO device_groups (id, name, description, tags, selector, created_by, updated_by) VALUES
('group-001', '核心交换机', '网络核心层交换机设备', 
 JSON_OBJECT('level', 'core', 'importance', 'high'), 
 JSON_OBJECT('device_type', 'switch', 'level', 'core'), 
 'system', 'system'),

('group-002', '汇聚交换机', '网络汇聚层交换机设备',
 JSON_OBJECT('level', 'aggregation', 'importance', 'medium'),
 JSON_OBJECT('device_type', 'switch', 'level', 'aggregation'),
 'system', 'system'),

('group-003', '接入交换机', '网络接入层交换机设备',
 JSON_OBJECT('level', 'access', 'importance', 'low'),
 JSON_OBJECT('device_type', 'switch', 'level', 'access'),
 'system', 'system');

-- 插入默认的告警规则组
INSERT INTO alert_rule_groups (id, name, description, interval_seconds, created_by, updated_by) VALUES
('rgroup-001', '基础监控规则', '设备基础性能和状态监控规则', 60, 'system', 'system'),
('rgroup-002', '网络连通性规则', '网络连通性和端口状态监控规则', 30, 'system', 'system'),
('rgroup-003', '环境监控规则', '设备环境参数监控规则', 120, 'system', 'system');