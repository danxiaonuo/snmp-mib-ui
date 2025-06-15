-- MIB 监控平台数据库完整初始化脚本
-- 创建时间: 2025-06-09
-- 版本: 1.0.0

-- 设置数据库编码
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

-- 创建扩展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- 创建枚举类型
CREATE TYPE component_status AS ENUM ('pending', 'installing', 'running', 'stopped', 'failed', 'updating');
CREATE TYPE component_category AS ENUM ('exporter', 'agent', 'storage', 'visualization', 'alerting', 'proxy');
CREATE TYPE installation_type AS ENUM ('docker', 'binary', 'systemd');
CREATE TYPE alert_severity AS ENUM ('info', 'warning', 'critical');

-- ============================================================================
-- 核心表结构
-- ============================================================================

-- 监控组件表
CREATE TABLE monitoring_components (
    id SERIAL PRIMARY KEY,
    uuid UUID DEFAULT uuid_generate_v4() UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL UNIQUE,
    display_name VARCHAR(200) NOT NULL,
    description TEXT,
    category component_category NOT NULL,
    default_port INTEGER,
    config_template JSONB DEFAULT '{}',
    dependencies TEXT[] DEFAULT '{}',
    supported_platforms TEXT[] DEFAULT '{"linux", "darwin", "windows"}',
    documentation_url VARCHAR(500),
    repository_url VARCHAR(500),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 组件版本表
CREATE TABLE component_versions (
    id SERIAL PRIMARY KEY,
    uuid UUID DEFAULT uuid_generate_v4() UNIQUE NOT NULL,
    component_id INTEGER REFERENCES monitoring_components(id) ON DELETE CASCADE,
    version VARCHAR(50) NOT NULL,
    docker_image VARCHAR(200),
    binary_url VARCHAR(500),
    checksum VARCHAR(128),
    is_stable BOOLEAN DEFAULT false,
    is_latest BOOLEAN DEFAULT false,
    release_notes TEXT,
    config_schema JSONB DEFAULT '{}',
    minimum_requirements JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(component_id, version)
);

-- 安装记录表
CREATE TABLE installations (
    id SERIAL PRIMARY KEY,
    uuid UUID DEFAULT uuid_generate_v4() UNIQUE NOT NULL,
    component_id INTEGER REFERENCES monitoring_components(id) ON DELETE CASCADE,
    version_id INTEGER REFERENCES component_versions(id) ON DELETE CASCADE,
    name VARCHAR(200) NOT NULL,
    config JSONB NOT NULL DEFAULT '{}',
    status component_status DEFAULT 'pending',
    installation_type installation_type DEFAULT 'docker',
    container_id VARCHAR(100),
    process_id INTEGER,
    ports JSONB DEFAULT '{}',
    volumes JSONB DEFAULT '{}',
    environment JSONB DEFAULT '{}',
    health_check_url VARCHAR(500),
    last_health_check TIMESTAMP WITH TIME ZONE,
    health_status BOOLEAN,
    error_message TEXT,
    install_path VARCHAR(500),
    log_path VARCHAR(500),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    started_at TIMESTAMP WITH TIME ZONE,
    stopped_at TIMESTAMP WITH TIME ZONE
);

-- 系统配置表
CREATE TABLE system_config (
    id SERIAL PRIMARY KEY,
    key VARCHAR(100) NOT NULL UNIQUE,
    value JSONB NOT NULL,
    description TEXT,
    is_encrypted BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 用户表
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    uuid UUID DEFAULT uuid_generate_v4() UNIQUE NOT NULL,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(200) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(200),
    role VARCHAR(20) DEFAULT 'user',
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 操作日志表
CREATE TABLE operation_logs (
    id SERIAL PRIMARY KEY,
    uuid UUID DEFAULT uuid_generate_v4() UNIQUE NOT NULL,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    operation VARCHAR(100) NOT NULL,
    resource_type VARCHAR(50) NOT NULL,
    resource_id VARCHAR(100),
    details JSONB DEFAULT '{}',
    ip_address INET,
    user_agent TEXT,
    success BOOLEAN NOT NULL,
    error_message TEXT,
    duration_ms INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 告警规则表
CREATE TABLE alert_rules (
    id SERIAL PRIMARY KEY,
    uuid UUID DEFAULT uuid_generate_v4() UNIQUE NOT NULL,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    query TEXT NOT NULL,
    severity alert_severity DEFAULT 'warning',
    threshold_value DECIMAL,
    threshold_operator VARCHAR(10),
    evaluation_interval INTEGER DEFAULT 60,
    for_duration INTEGER DEFAULT 300,
    labels JSONB DEFAULT '{}',
    annotations JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 告警历史表
CREATE TABLE alert_history (
    id SERIAL PRIMARY KEY,
    uuid UUID DEFAULT uuid_generate_v4() UNIQUE NOT NULL,
    rule_id INTEGER REFERENCES alert_rules(id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL, -- firing, resolved
    value DECIMAL,
    labels JSONB DEFAULT '{}',
    annotations JSONB DEFAULT '{}',
    started_at TIMESTAMP WITH TIME ZONE NOT NULL,
    resolved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 监控目标表
CREATE TABLE monitoring_targets (
    id SERIAL PRIMARY KEY,
    uuid UUID DEFAULT uuid_generate_v4() UNIQUE NOT NULL,
    name VARCHAR(200) NOT NULL,
    type VARCHAR(50) NOT NULL, -- host, service, container, etc.
    address VARCHAR(500) NOT NULL,
    port INTEGER,
    labels JSONB DEFAULT '{}',
    scrape_interval INTEGER DEFAULT 30,
    scrape_timeout INTEGER DEFAULT 10,
    metrics_path VARCHAR(200) DEFAULT '/metrics',
    scheme VARCHAR(10) DEFAULT 'http',
    is_active BOOLEAN DEFAULT true,
    last_scrape TIMESTAMP WITH TIME ZONE,
    scrape_status BOOLEAN,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 仪表板表
CREATE TABLE dashboards (
    id SERIAL PRIMARY KEY,
    uuid UUID DEFAULT uuid_generate_v4() UNIQUE NOT NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    tags TEXT[] DEFAULT '{}',
    dashboard_json JSONB NOT NULL,
    is_public BOOLEAN DEFAULT false,
    created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- 索引创建
-- ============================================================================

-- 监控组件索引
CREATE INDEX idx_monitoring_components_category ON monitoring_components(category);
CREATE INDEX idx_monitoring_components_active ON monitoring_components(is_active);
CREATE INDEX idx_monitoring_components_name_trgm ON monitoring_components USING gin(name gin_trgm_ops);

-- 组件版本索引
CREATE INDEX idx_component_versions_component_id ON component_versions(component_id);
CREATE INDEX idx_component_versions_stable ON component_versions(is_stable);
CREATE INDEX idx_component_versions_latest ON component_versions(is_latest);

-- 安装记录索引
CREATE INDEX idx_installations_component_id ON installations(component_id);
CREATE INDEX idx_installations_status ON installations(status);
CREATE INDEX idx_installations_created_at ON installations(created_at);
CREATE INDEX idx_installations_health_check ON installations(last_health_check);

-- 操作日志索引
CREATE INDEX idx_operation_logs_user_id ON operation_logs(user_id);
CREATE INDEX idx_operation_logs_operation ON operation_logs(operation);
CREATE INDEX idx_operation_logs_created_at ON operation_logs(created_at);
CREATE INDEX idx_operation_logs_resource ON operation_logs(resource_type, resource_id);

-- 告警相关索引
CREATE INDEX idx_alert_rules_active ON alert_rules(is_active);
CREATE INDEX idx_alert_history_rule_id ON alert_history(rule_id);
CREATE INDEX idx_alert_history_status ON alert_history(status);
CREATE INDEX idx_alert_history_started_at ON alert_history(started_at);

-- 监控目标索引
CREATE INDEX idx_monitoring_targets_type ON monitoring_targets(type);
CREATE INDEX idx_monitoring_targets_active ON monitoring_targets(is_active);
CREATE INDEX idx_monitoring_targets_last_scrape ON monitoring_targets(last_scrape);

-- ============================================================================
-- 触发器函数
-- ============================================================================

-- 更新时间戳触发器函数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 创建更新时间戳触发器
CREATE TRIGGER update_monitoring_components_updated_at BEFORE UPDATE ON monitoring_components FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_installations_updated_at BEFORE UPDATE ON installations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_system_config_updated_at BEFORE UPDATE ON system_config FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_alert_rules_updated_at BEFORE UPDATE ON alert_rules FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_monitoring_targets_updated_at BEFORE UPDATE ON monitoring_targets FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_dashboards_updated_at BEFORE UPDATE ON dashboards FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 初始数据插入
-- ============================================================================

-- 插入默认监控组件
INSERT INTO monitoring_components (name, display_name, description, category, default_port, config_template, dependencies, documentation_url, repository_url) VALUES
('node-exporter', 'Node Exporter', '系统指标收集器，收集主机的硬件和操作系统指标', 'exporter', 9100, 
 '{
   "path.rootfs": "/host",
   "collector.filesystem.ignored-mount-points": "^/(sys|proc|dev|host|etc|rootfs/var/lib/docker/containers|rootfs/var/lib/docker/overlay2|rootfs/run/docker/netns|rootfs/var/lib/docker/aufs)($$|/)",
   "collector.filesystem.ignored-fs-types": "^(autofs|binfmt_misc|bpf|cgroup2?|configfs|debugfs|devpts|devtmpfs|fusectl|hugetlbfs|iso9660|mqueue|nsfs|overlay|proc|procfs|pstore|rpc_pipefs|securityfs|selinuxfs|squashfs|sysfs|tracefs)$$"
 }', 
 '{}', 'https://prometheus.io/docs/guides/node-exporter/', 'https://github.com/prometheus/node_exporter'),

('categraf', 'Categraf', '多功能监控采集器，支持多种数据源和输出格式', 'agent', 9100,
 '{
   "interval": "10s",
   "precision": "ms",
   "hostname": "",
   "omit_hostname": false,
   "round_interval": true,
   "metric_batch_size": 1000,
   "metric_buffer_limit": 10000,
   "collection_jitter": "0s",
   "flush_interval": "10s",
   "flush_jitter": "0s"
 }',
 '{}', 'https://flashcat.cloud/docs/categraf/', 'https://github.com/flashcatcloud/categraf'),

('vmagent', 'VMAgent', 'VictoriaMetrics 代理，用于收集和转发指标数据', 'agent', 8429,
 '{
   "remoteWrite.url": "http://victoriametrics:8428/api/v1/write",
   "remoteWrite.maxDiskUsagePerURL": "1GB",
   "memory.allowedPercent": "60",
   "promscrape.config": "/etc/vmagent/prometheus.yml"
 }',
 '["victoriametrics"]', 'https://docs.victoriametrics.com/vmagent.html', 'https://github.com/VictoriaMetrics/VictoriaMetrics'),

('victoriametrics', 'VictoriaMetrics', '高性能时序数据库，兼容 Prometheus', 'storage', 8428,
 '{
   "storageDataPath": "/victoria-metrics-data",
   "retentionPeriod": "12",
   "httpListenAddr": ":8428",
   "maxConcurrentInserts": "16",
   "search.maxQueryDuration": "30s",
   "search.maxConcurrentRequests": "16"
 }',
 '{}', 'https://docs.victoriametrics.com/', 'https://github.com/VictoriaMetrics/VictoriaMetrics'),

('grafana', 'Grafana', '数据可视化和监控平台', 'visualization', 3000,
 '{
   "admin.password": "admin",
   "users.allow_sign_up": "false",
   "auth.anonymous.enabled": "false",
   "server.root_url": "http://localhost:3000",
   "database.type": "sqlite3",
   "database.path": "/var/lib/grafana/grafana.db"
 }',
 '{}', 'https://grafana.com/docs/', 'https://github.com/grafana/grafana'),

('snmp-exporter', 'SNMP Exporter', 'SNMP 监控导出器，用于监控网络设备', 'exporter', 9116,
 '{
   "config.file": "/etc/snmp_exporter/snmp.yml",
   "log.level": "info",
   "web.listen-address": ":9116"
 }',
 '{}', 'https://prometheus.io/docs/guides/snmp-exporter/', 'https://github.com/prometheus/snmp_exporter'),

('alertmanager', 'Alertmanager', '告警管理器，处理和路由告警', 'alerting', 9093,
 '{
   "config.file": "/etc/alertmanager/alertmanager.yml",
   "storage.path": "/alertmanager",
   "web.listen-address": ":9093",
   "cluster.listen-address": "0.0.0.0:9094"
 }',
 '{}', 'https://prometheus.io/docs/alerting/latest/alertmanager/', 'https://github.com/prometheus/alertmanager');

-- 插入组件版本信息
INSERT INTO component_versions (component_id, version, docker_image, is_stable, is_latest, release_notes) VALUES
-- Node Exporter 版本
((SELECT id FROM monitoring_components WHERE name = 'node-exporter'), '1.7.0', 'prom/node-exporter:v1.7.0', true, true, '最新稳定版本，支持更多收集器'),
((SELECT id FROM monitoring_components WHERE name = 'node-exporter'), '1.6.1', 'prom/node-exporter:v1.6.1', true, false, '稳定版本'),

-- Categraf 版本
((SELECT id FROM monitoring_components WHERE name = 'categraf'), '0.3.60', 'flashcatcloud/categraf:v0.3.60', true, true, '最新版本，修复多个 bug'),
((SELECT id FROM monitoring_components WHERE name = 'categraf'), '0.3.50', 'flashcatcloud/categraf:v0.3.50', true, false, '稳定版本'),

-- VMAgent 版本
((SELECT id FROM monitoring_components WHERE name = 'vmagent'), '1.96.0', 'victoriametrics/vmagent:v1.96.0', true, true, '最新版本，性能优化'),
((SELECT id FROM monitoring_components WHERE name = 'vmagent'), '1.95.1', 'victoriametrics/vmagent:v1.95.1', true, false, '稳定版本'),

-- VictoriaMetrics 版本
((SELECT id FROM monitoring_components WHERE name = 'victoriametrics'), '1.96.0', 'victoriametrics/victoria-metrics:v1.96.0', true, true, '最新版本，查询性能提升'),
((SELECT id FROM monitoring_components WHERE name = 'victoriametrics'), '1.95.1', 'victoriametrics/victoria-metrics:v1.95.1', true, false, '稳定版本'),

-- Grafana 版本
((SELECT id FROM monitoring_components WHERE name = 'grafana'), '10.2.3', 'grafana/grafana:10.2.3', true, true, '最新稳定版本'),
((SELECT id FROM monitoring_components WHERE name = 'grafana'), '10.1.5', 'grafana/grafana:10.1.5', true, false, '长期支持版本'),

-- SNMP Exporter 版本
((SELECT id FROM monitoring_components WHERE name = 'snmp-exporter'), '0.24.1', 'prom/snmp-exporter:v0.24.1', true, true, '最新版本'),
((SELECT id FROM monitoring_components WHERE name = 'snmp-exporter'), '0.23.0', 'prom/snmp-exporter:v0.23.0', true, false, '稳定版本'),

-- Alertmanager 版本
((SELECT id FROM monitoring_components WHERE name = 'alertmanager'), '0.26.0', 'prom/alertmanager:v0.26.0', true, true, '最新版本'),
((SELECT id FROM monitoring_components WHERE name = 'alertmanager'), '0.25.0', 'prom/alertmanager:v0.25.0', true, false, '稳定版本');

-- 插入系统配置
INSERT INTO system_config (key, value, description) VALUES
('platform.name', '"MIB 监控平台"', '平台名称'),
('platform.version', '"1.0.0"', '平台版本'),
('platform.description', '"企业级监控组件安装和管理平台"', '平台描述'),
('docker.registry', '"docker.io"', 'Docker 镜像仓库地址'),
('docker.network', '"mib-network"', 'Docker 网络名称'),
('monitoring.data_retention', '"30d"', '监控数据保留时间'),
('monitoring.scrape_interval', '"15s"', '默认采集间隔'),
('alerting.smtp_server', '"localhost:587"', 'SMTP 服务器地址'),
('alerting.from_email', '"noreply@mib-platform.local"', '告警发送邮箱'),
('security.session_timeout', '"24h"', '会话超时时间'),
('security.password_min_length', '8', '密码最小长度'),
('backup.enabled', 'true', '是否启用自动备份'),
('backup.interval', '"24h"', '备份间隔'),
('backup.retention', '"7d"', '备份保留时间');

-- 创建默认管理员用户 (密码: admin123)
INSERT INTO users (username, email, password_hash, full_name, role) VALUES
('admin', 'admin@mib-platform.local', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '系统管理员', 'admin');

-- 插入默认告警规则
INSERT INTO alert_rules (name, description, query, severity, threshold_value, threshold_operator, evaluation_interval, for_duration, labels, annotations, created_by) VALUES
('高 CPU 使用率', '当 CPU 使用率超过 80% 持续 5 分钟时触发告警', 
 'avg(100 - (avg by (instance) (irate(node_cpu_seconds_total{mode="idle"}[5m])) * 100))', 
 'warning', 80, '>', 60, 300,
 '{"severity": "warning", "team": "infrastructure"}',
 '{"summary": "实例 {{ $labels.instance }} CPU 使用率过高", "description": "CPU 使用率已达到 {{ $value }}%"}',
 (SELECT id FROM users WHERE username = 'admin')),

('高内存使用率', '当内存使用率超过 85% 持续 5 分钟时触发告警',
 'avg((1 - (node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes)) * 100)',
 'warning', 85, '>', 60, 300,
 '{"severity": "warning", "team": "infrastructure"}',
 '{"summary": "实例 {{ $labels.instance }} 内存使用率过高", "description": "内存使用率已达到 {{ $value }}%"}',
 (SELECT id FROM users WHERE username = 'admin')),

('磁盘空间不足', '当磁盘使用率超过 90% 时触发告警',
 'avg((1 - (node_filesystem_avail_bytes / node_filesystem_size_bytes)) * 100)',
 'critical', 90, '>', 60, 180,
 '{"severity": "critical", "team": "infrastructure"}',
 '{"summary": "实例 {{ $labels.instance }} 磁盘空间不足", "description": "磁盘 {{ $labels.mountpoint }} 使用率已达到 {{ $value }}%"}',
 (SELECT id FROM users WHERE username = 'admin')),

('服务不可用', '当服务停止响应时触发告警',
 'up == 0',
 'critical', 0, '==', 30, 60,
 '{"severity": "critical", "team": "infrastructure"}',
 '{"summary": "服务 {{ $labels.instance }} 不可用", "description": "服务已停止响应超过 1 分钟"}',
 (SELECT id FROM users WHERE username = 'admin'));

-- ============================================================================
-- 视图创建
-- ============================================================================

-- 组件安装状态视图
CREATE VIEW v_component_status AS
SELECT 
    mc.id as component_id,
    mc.name as component_name,
    mc.display_name,
    mc.category,
    COUNT(i.id) as total_installations,
    COUNT(CASE WHEN i.status = 'running' THEN 1 END) as running_count,
    COUNT(CASE WHEN i.status = 'failed' THEN 1 END) as failed_count,
    MAX(i.created_at) as last_installation
FROM monitoring_components mc
LEFT JOIN installations i ON mc.id = i.component_id
WHERE mc.is_active = true
GROUP BY mc.id, mc.name, mc.display_name, mc.category;

-- 系统健康状态视图
CREATE VIEW v_system_health AS
SELECT 
    COUNT(*) as total_components,
    COUNT(CASE WHEN status = 'running' THEN 1 END) as healthy_components,
    COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_components,
    COUNT(CASE WHEN last_health_check < NOW() - INTERVAL '5 minutes' THEN 1 END) as stale_components,
    ROUND(AVG(CASE WHEN health_status THEN 1 ELSE 0 END) * 100, 2) as overall_health_percentage
FROM installations
WHERE status IN ('running', 'failed');

-- 告警统计视图
CREATE VIEW v_alert_stats AS
SELECT 
    COUNT(*) as total_rules,
    COUNT(CASE WHEN is_active THEN 1 END) as active_rules,
    COUNT(CASE WHEN severity = 'critical' THEN 1 END) as critical_rules,
    COUNT(CASE WHEN severity = 'warning' THEN 1 END) as warning_rules,
    COUNT(CASE WHEN severity = 'info' THEN 1 END) as info_rules
FROM alert_rules;

-- ============================================================================
-- 存储过程
-- ============================================================================

-- 获取组件详细信息的存储过程
CREATE OR REPLACE FUNCTION get_component_details(component_name_param VARCHAR)
RETURNS TABLE(
    component_id INTEGER,
    name VARCHAR,
    display_name VARCHAR,
    description TEXT,
    category component_category,
    default_port INTEGER,
    config_template JSONB,
    latest_version VARCHAR,
    stable_version VARCHAR,
    installation_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        mc.id,
        mc.name,
        mc.display_name,
        mc.description,
        mc.category,
        mc.default_port,
        mc.config_template,
        (SELECT cv1.version FROM component_versions cv1 WHERE cv1.component_id = mc.id AND cv1.is_latest = true LIMIT 1) as latest_version,
        (SELECT cv2.version FROM component_versions cv2 WHERE cv2.component_id = mc.id AND cv2.is_stable = true ORDER BY cv2.created_at DESC LIMIT 1) as stable_version,
        (SELECT COUNT(*) FROM installations i WHERE i.component_id = mc.id) as installation_count
    FROM monitoring_components mc
    WHERE mc.name = component_name_param AND mc.is_active = true;
END;
$$ LANGUAGE plpgsql;

-- 清理过期数据的存储过程
CREATE OR REPLACE FUNCTION cleanup_expired_data()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER := 0;
BEGIN
    -- 清理 30 天前的操作日志
    DELETE FROM operation_logs WHERE created_at < NOW() - INTERVAL '30 days';
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    -- 清理 90 天前的告警历史
    DELETE FROM alert_history WHERE created_at < NOW() - INTERVAL '90 days';
    GET DIAGNOSTICS deleted_count = deleted_count + ROW_COUNT;
    
    -- 清理已停止超过 7 天的安装记录的详细日志
    UPDATE installations 
    SET error_message = NULL 
    WHERE status = 'stopped' 
    AND stopped_at < NOW() - INTERVAL '7 days'
    AND error_message IS NOT NULL;
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 权限设置
-- ============================================================================

-- 创建只读用户角色
CREATE ROLE mib_readonly;
GRANT CONNECT ON DATABASE mib_platform TO mib_readonly;
GRANT USAGE ON SCHEMA public TO mib_readonly;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO mib_readonly;
GRANT SELECT ON ALL SEQUENCES IN SCHEMA public TO mib_readonly;

-- 创建应用用户角色
CREATE ROLE mib_app;
GRANT CONNECT ON DATABASE mib_platform TO mib_app;
GRANT USAGE ON SCHEMA public TO mib_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO mib_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO mib_app;

-- 为未来创建的表设置默认权限
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO mib_readonly;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO mib_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO mib_app;

-- ============================================================================
-- 完成信息
-- ============================================================================

-- 插入初始化完成标记
INSERT INTO system_config (key, value, description) VALUES
('database.initialized', 'true', '数据库初始化完成标记'),
('database.version', '"1.0.0"', '数据库版本'),
('database.initialized_at', concat('"', CURRENT_TIMESTAMP, '"'), '数据库初始化时间');

-- 显示初始化完成信息
DO $$
BEGIN
    RAISE NOTICE '============================================================================';
    RAISE NOTICE 'MIB 监控平台数据库初始化完成！';
    RAISE NOTICE '============================================================================';
    RAISE NOTICE '数据库版本: 1.0.0';
    RAISE NOTICE '初始化时间: %', CURRENT_TIMESTAMP;
    RAISE NOTICE '默认管理员: admin / admin123';
    RAISE NOTICE '包含组件: % 个', (SELECT COUNT(*) FROM monitoring_components);
    RAISE NOTICE '包含版本: % 个', (SELECT COUNT(*) FROM component_versions);
    RAISE NOTICE '告警规则: % 个', (SELECT COUNT(*) FROM alert_rules);
    RAISE NOTICE '============================================================================';
END $$;