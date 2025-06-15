-- MIB Web Platform Database Initialization Script
-- This script sets up the initial database structure and data

-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "btree_gin";

-- Create custom types
DO $$ BEGIN
    CREATE TYPE snmp_version AS ENUM ('v1', 'v2c', 'v3');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE device_status AS ENUM ('online', 'offline', 'unknown', 'maintenance');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE config_status AS ENUM ('active', 'inactive', 'draft', 'archived');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create indexes for better performance
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_mibs_name_trgm ON mibs USING gin (name gin_trgm_ops);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_mibs_description_trgm ON mibs USING gin (description gin_trgm_ops);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_oids_oid ON oids (oid);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_oids_name_trgm ON oids USING gin (name gin_trgm_ops);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_devices_ip_address ON devices (ip_address);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_devices_status ON devices (status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_devices_name_trgm ON devices USING gin (name gin_trgm_ops);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_configs_type ON configs (type);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_configs_status ON configs (status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_configs_device_id ON configs (device_id);

-- Insert default MIB files (common standard MIBs)
INSERT INTO mibs (name, description, file_path, version, organization, created_at, updated_at) VALUES
('SNMPv2-MIB', 'Standard SNMPv2 MIB definitions', '/app/mibs/standard/SNMPv2-MIB.txt', '1.0', 'IETF', NOW(), NOW()),
('SNMPv2-SMI', 'Structure of Management Information for SNMPv2', '/app/mibs/standard/SNMPv2-SMI.txt', '1.0', 'IETF', NOW(), NOW()),
('SNMPv2-TC', 'Textual Conventions for SNMPv2', '/app/mibs/standard/SNMPv2-TC.txt', '1.0', 'IETF', NOW(), NOW()),
('IF-MIB', 'Interface MIB', '/app/mibs/standard/IF-MIB.txt', '1.0', 'IETF', NOW(), NOW()),
('IP-MIB', 'Internet Protocol MIB', '/app/mibs/standard/IP-MIB.txt', '1.0', 'IETF', NOW(), NOW()),
('TCP-MIB', 'Transmission Control Protocol MIB', '/app/mibs/standard/TCP-MIB.txt', '1.0', 'IETF', NOW(), NOW()),
('UDP-MIB', 'User Datagram Protocol MIB', '/app/mibs/standard/UDP-MIB.txt', '1.0', 'IETF', NOW(), NOW()),
('HOST-RESOURCES-MIB', 'Host Resources MIB', '/app/mibs/standard/HOST-RESOURCES-MIB.txt', '1.0', 'IETF', NOW(), NOW())
ON CONFLICT (name) DO NOTHING;

-- Insert common OIDs
INSERT INTO oids (oid, name, description, type, access, status, mib_id, created_at, updated_at) VALUES
('1.3.6.1.2.1.1.1.0', 'sysDescr', 'System Description', 'DisplayString', 'read-only', 'current', 1, NOW(), NOW()),
('1.3.6.1.2.1.1.2.0', 'sysObjectID', 'System Object Identifier', 'OBJECT IDENTIFIER', 'read-only', 'current', 1, NOW(), NOW()),
('1.3.6.1.2.1.1.3.0', 'sysUpTime', 'System Up Time', 'TimeTicks', 'read-only', 'current', 1, NOW(), NOW()),
('1.3.6.1.2.1.1.4.0', 'sysContact', 'System Contact', 'DisplayString', 'read-write', 'current', 1, NOW(), NOW()),
('1.3.6.1.2.1.1.5.0', 'sysName', 'System Name', 'DisplayString', 'read-write', 'current', 1, NOW(), NOW()),
('1.3.6.1.2.1.1.6.0', 'sysLocation', 'System Location', 'DisplayString', 'read-write', 'current', 1, NOW(), NOW()),
('1.3.6.1.2.1.1.7.0', 'sysServices', 'System Services', 'INTEGER', 'read-only', 'current', 1, NOW(), NOW()),
('1.3.6.1.2.1.2.1.0', 'ifNumber', 'Number of Interfaces', 'INTEGER', 'read-only', 'current', 4, NOW(), NOW()),
('1.3.6.1.2.1.2.2.1.1', 'ifIndex', 'Interface Index', 'INTEGER', 'read-only', 'current', 4, NOW(), NOW()),
('1.3.6.1.2.1.2.2.1.2', 'ifDescr', 'Interface Description', 'DisplayString', 'read-only', 'current', 4, NOW(), NOW()),
('1.3.6.1.2.1.2.2.1.3', 'ifType', 'Interface Type', 'IANAifType', 'read-only', 'current', 4, NOW(), NOW()),
('1.3.6.1.2.1.2.2.1.5', 'ifSpeed', 'Interface Speed', 'Gauge32', 'read-only', 'current', 4, NOW(), NOW()),
('1.3.6.1.2.1.2.2.1.8', 'ifOperStatus', 'Interface Operational Status', 'INTEGER', 'read-only', 'current', 4, NOW(), NOW()),
('1.3.6.1.2.1.2.2.1.10', 'ifInOctets', 'Interface Input Octets', 'Counter32', 'read-only', 'current', 4, NOW(), NOW()),
('1.3.6.1.2.1.2.2.1.16', 'ifOutOctets', 'Interface Output Octets', 'Counter32', 'read-only', 'current', 4, NOW(), NOW())
ON CONFLICT (oid) DO NOTHING;

-- Insert default device templates
INSERT INTO device_templates (name, type, vendor, description, created_at, updated_at) VALUES
('Generic SNMP Device', 'generic', 'Generic', 'Basic SNMP device template with standard MIBs', NOW(), NOW()),
('Cisco Router', 'router', 'Cisco', 'Cisco router template with Cisco-specific MIBs', NOW(), NOW()),
('Cisco Switch', 'switch', 'Cisco', 'Cisco switch template with switching MIBs', NOW(), NOW()),
('Linux Server', 'server', 'Linux', 'Linux server template with HOST-RESOURCES-MIB', NOW(), NOW()),
('Windows Server', 'server', 'Microsoft', 'Windows server template with Windows-specific MIBs', NOW(), NOW()),
('Network Printer', 'printer', 'Generic', 'Network printer template with Printer MIB', NOW(), NOW())
ON CONFLICT (name) DO NOTHING;

-- Insert default configuration templates
INSERT INTO config_templates (name, type, description, template_content, variables, created_at, updated_at) VALUES
('Basic SNMP Monitoring', 'snmp', 'Basic SNMP monitoring configuration', 
'# SNMP Configuration for {{device_name}}
# Generated on {{timestamp}}

device:
  name: "{{device_name}}"
  ip_address: "{{device_ip}}"
  port: {{device_port}}
  
snmp:
  version: "{{snmp_version}}"
  community: "{{snmp_community}}"
  timeout: {{snmp_timeout}}
  retries: {{snmp_retries}}
  
oids:
{{#each oids}}
  - oid: "{{oid}}"
    name: "{{name}}"
    description: "{{description}}"
{{/each}}

monitoring:
  interval: {{monitoring_interval}}
  enabled: true
', 
'{"device_name": "string", "device_ip": "string", "device_port": "number", "snmp_version": "string", "snmp_community": "string", "snmp_timeout": "number", "snmp_retries": "number", "oids": "array", "monitoring_interval": "number"}', 
NOW(), NOW()),

('Device Discovery', 'discovery', 'Device discovery configuration template', 
'# Device Discovery Configuration
# Generated on {{timestamp}}

discovery:
  enabled: true
  networks:
{{#each networks}}
    - network: "{{network}}"
      mask: "{{mask}}"
{{/each}}
  
  snmp:
    communities:
{{#each communities}}
      - "{{.}}"
{{/each}}
    timeout: {{timeout}}
    retries: {{retries}}
  
  schedule:
    interval: "{{schedule_interval}}"
    enabled: {{schedule_enabled}}
', 
'{"networks": "array", "communities": "array", "timeout": "number", "retries": "number", "schedule_interval": "string", "schedule_enabled": "boolean"}', 
NOW(), NOW()),

('Alerting Rules', 'alerting', 'Alerting rules configuration template', 
'# Alerting Rules Configuration
# Generated on {{timestamp}}

alerting:
  enabled: true
  
  rules:
{{#each rules}}
    - name: "{{name}}"
      condition: "{{condition}}"
      threshold: {{threshold}}
      severity: "{{severity}}"
      enabled: {{enabled}}
{{/each}}
  
  notifications:
    email:
      enabled: {{email_enabled}}
      recipients:
{{#each email_recipients}}
        - "{{.}}"
{{/each}}
    
    webhook:
      enabled: {{webhook_enabled}}
      url: "{{webhook_url}}"
', 
'{"rules": "array", "email_enabled": "boolean", "email_recipients": "array", "webhook_enabled": "boolean", "webhook_url": "string"}', 
NOW(), NOW())
ON CONFLICT (name) DO NOTHING;

-- Create functions for common operations
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for automatic updated_at updates
DO $$ 
DECLARE
    t text;
BEGIN
    FOR t IN
        SELECT table_name 
        FROM information_schema.columns 
        WHERE column_name = 'updated_at' 
        AND table_schema = 'public'
    LOOP
        EXECUTE format('DROP TRIGGER IF EXISTS update_%I_updated_at ON %I', t, t);
        EXECUTE format('CREATE TRIGGER update_%I_updated_at 
                       BEFORE UPDATE ON %I 
                       FOR EACH ROW 
                       EXECUTE FUNCTION update_updated_at_column()', t, t);
    END LOOP;
END $$;

-- Create function for full-text search
CREATE OR REPLACE FUNCTION search_mibs(search_term text)
RETURNS TABLE(
    id bigint,
    name varchar,
    description text,
    organization varchar,
    version varchar,
    rank real
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        m.id,
        m.name,
        m.description,
        m.organization,
        m.version,
        ts_rank(to_tsvector('english', m.name || ' ' || COALESCE(m.description, '')), plainto_tsquery('english', search_term)) as rank
    FROM mibs m
    WHERE to_tsvector('english', m.name || ' ' || COALESCE(m.description, '')) @@ plainto_tsquery('english', search_term)
    ORDER BY rank DESC;
END;
$$ LANGUAGE plpgsql;

-- Create function for OID search
CREATE OR REPLACE FUNCTION search_oids(search_term text)
RETURNS TABLE(
    id bigint,
    oid varchar,
    name varchar,
    description text,
    type varchar,
    mib_name varchar,
    rank real
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        o.id,
        o.oid,
        o.name,
        o.description,
        o.type,
        m.name as mib_name,
        ts_rank(to_tsvector('english', o.name || ' ' || COALESCE(o.description, '') || ' ' || o.oid), plainto_tsquery('english', search_term)) as rank
    FROM oids o
    LEFT JOIN mibs m ON o.mib_id = m.id
    WHERE to_tsvector('english', o.name || ' ' || COALESCE(o.description, '') || ' ' || o.oid) @@ plainto_tsquery('english', search_term)
    ORDER BY rank DESC;
END;
$$ LANGUAGE plpgsql;

-- Create materialized view for dashboard statistics
CREATE MATERIALIZED VIEW IF NOT EXISTS dashboard_stats AS
SELECT 
    (SELECT COUNT(*) FROM mibs) as total_mibs,
    (SELECT COUNT(*) FROM oids) as total_oids,
    (SELECT COUNT(*) FROM devices) as total_devices,
    (SELECT COUNT(*) FROM devices WHERE status = 'online') as online_devices,
    (SELECT COUNT(*) FROM devices WHERE status = 'offline') as offline_devices,
    (SELECT COUNT(*) FROM configs) as total_configs,
    (SELECT COUNT(*) FROM configs WHERE status = 'active') as active_configs,
    NOW() as last_updated;

-- Create index on materialized view
CREATE UNIQUE INDEX IF NOT EXISTS dashboard_stats_unique ON dashboard_stats (last_updated);

-- Create function to refresh dashboard stats
CREATE OR REPLACE FUNCTION refresh_dashboard_stats()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY dashboard_stats;
END;
$$ LANGUAGE plpgsql;

-- Grant permissions
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO mibweb;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO mibweb;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO mibweb;

-- Create scheduled job to refresh stats (requires pg_cron extension)
-- SELECT cron.schedule('refresh-dashboard-stats', '*/5 * * * *', 'SELECT refresh_dashboard_stats();');

COMMIT;