-- 初始化数据脚本
-- 在数据库创建后自动执行

-- 插入默认系统配置
INSERT INTO settings (key, value, description) VALUES
('system.initialized', 'true', 'System initialization flag'),
('system.version', '1.0.0', 'System version'),
('system.install_date', NOW()::text, 'System installation date'),
('snmp.default_community', 'public', 'Default SNMP community string'),
('snmp.default_version', '2c', 'Default SNMP version'),
('snmp.timeout', '5', 'Default SNMP timeout in seconds'),
('snmp.retries', '3', 'Default SNMP retry count'),
('monitoring.data_retention_days', '30', 'Data retention period in days'),
('monitoring.scrape_interval', '30', 'Default scrape interval in seconds'),
('alerts.default_severity', 'warning', 'Default alert severity'),
('alerts.notification_enabled', 'true', 'Enable alert notifications')
ON CONFLICT (key) DO NOTHING;

-- 插入默认用户（如果不存在）
INSERT INTO users (username, email, password_hash, role, created_at) VALUES
('admin', 'admin@localhost', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin', NOW()),
('operator', 'operator@localhost', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'operator', NOW()),
('viewer', 'viewer@localhost', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'viewer', NOW())
ON CONFLICT (username) DO NOTHING;

-- 插入默认设备模板
INSERT INTO device_templates (name, type, vendor, snmp_version, community, description, created_at) VALUES
('Cisco Switch Template', 'switch', 'Cisco', '2c', 'public', 'Default template for Cisco switches', NOW()),
('Huawei Router Template', 'router', 'Huawei', '2c', 'public', 'Default template for Huawei routers', NOW()),
('H3C Switch Template', 'switch', 'H3C', '2c', 'public', 'Default template for H3C switches', NOW()),
('Generic SNMP Device', 'other', 'Generic', '2c', 'public', 'Generic SNMP device template', NOW())
ON CONFLICT (name) DO NOTHING;

-- 插入默认告警规则模板
INSERT INTO alert_rule_templates (name, description, category, vendor, device_type, expression, duration, severity, is_builtin, created_at) VALUES
('High CPU Usage', 'Alert when CPU usage exceeds threshold', 'performance', 'generic', 'any', 'cpu_usage_percent > 80', '5m', 'warning', true, NOW()),
('High Memory Usage', 'Alert when memory usage exceeds threshold', 'performance', 'generic', 'any', 'memory_usage_percent > 85', '5m', 'warning', true, NOW()),
('Device Unreachable', 'Alert when device is unreachable', 'connectivity', 'generic', 'any', 'up == 0', '1m', 'critical', true, NOW()),
('Interface Down', 'Alert when network interface is down', 'connectivity', 'generic', 'switch', 'ifOperStatus != ifAdminStatus', '2m', 'warning', true, NOW()),
('High Disk Usage', 'Alert when disk usage exceeds threshold', 'storage', 'generic', 'any', 'disk_usage_percent > 90', '10m', 'critical', true, NOW())
ON CONFLICT (name) DO NOTHING;

-- 插入默认MIB信息
INSERT INTO mibs (name, filename, description, status, created_at) VALUES
('SNMPv2-MIB', 'SNMPv2-MIB.mib', 'Standard SNMPv2 MIB', 'validated', NOW()),
('IF-MIB', 'IF-MIB.mib', 'Interface MIB for network interfaces', 'validated', NOW()),
('HOST-RESOURCES-MIB', 'HOST-RESOURCES-MIB.mib', 'Host resources MIB for system monitoring', 'validated', NOW()),
('IP-MIB', 'IP-MIB.mib', 'IP protocol MIB', 'validated', NOW())
ON CONFLICT (name) DO NOTHING;

-- 创建默认设备分组
INSERT INTO device_groups (name, description, created_at) VALUES
('All Devices', 'Default group containing all devices', NOW()),
('Switches', 'Network switches', NOW()),
('Routers', 'Network routers', NOW()),
('Servers', 'Server devices', NOW()),
('Critical Infrastructure', 'Mission critical devices', NOW())
ON CONFLICT (name) DO NOTHING;

-- 插入系统日志
INSERT INTO system_logs (level, message, component, created_at) VALUES
('info', 'Database initialization completed', 'system', NOW()),
('info', 'Default data inserted successfully', 'database', NOW());

COMMIT;