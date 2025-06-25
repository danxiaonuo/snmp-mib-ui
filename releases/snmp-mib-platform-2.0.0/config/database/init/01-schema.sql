-- Create database schema for network monitoring platform

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255),
    role VARCHAR(50) DEFAULT 'user',
    avatar_url TEXT,
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create device_types table
CREATE TABLE IF NOT EXISTS device_types (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    icon VARCHAR(50),
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create devices table
CREATE TABLE IF NOT EXISTS devices (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    hostname VARCHAR(255),
    ip_address INET NOT NULL,
    port INTEGER DEFAULT 161,
    type VARCHAR(100),
    vendor VARCHAR(100),
    model VARCHAR(100),
    location VARCHAR(255),
    description TEXT,
    status VARCHAR(50) DEFAULT 'unknown',
    last_seen TIMESTAMP WITH TIME ZONE,
    template_id INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Create device_templates table
CREATE TABLE IF NOT EXISTS device_templates (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(100) NOT NULL,
    vendor VARCHAR(100),
    description TEXT,
    oids TEXT[],
    config JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Create snmp_credentials table
CREATE TABLE IF NOT EXISTS snmp_credentials (
    id SERIAL PRIMARY KEY,
    device_id INTEGER NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
    version VARCHAR(10) NOT NULL,
    community VARCHAR(255),
    username VARCHAR(255),
    auth_proto VARCHAR(50),
    auth_key VARCHAR(255),
    priv_proto VARCHAR(50),
    priv_key VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Create mibs table
CREATE TABLE IF NOT EXISTS mibs (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    filename VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    version VARCHAR(100),
    description TEXT,
    author VARCHAR(255),
    status VARCHAR(50) DEFAULT 'uploaded',
    parsed_at TIMESTAMP WITH TIME ZONE,
    error_msg TEXT,
    file_size BIGINT,
    checksum VARCHAR(64),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Create oids table
CREATE TABLE IF NOT EXISTS oids (
    id SERIAL PRIMARY KEY,
    mib_id INTEGER NOT NULL REFERENCES mibs(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    oid_string VARCHAR(500) NOT NULL,
    type VARCHAR(100),
    access VARCHAR(50),
    status VARCHAR(50),
    description TEXT,
    syntax VARCHAR(100),
    units VARCHAR(100),
    parent_oid VARCHAR(500),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Create configs table
CREATE TABLE IF NOT EXISTS configs (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(100) NOT NULL,
    content TEXT,
    device_id INTEGER REFERENCES devices(id),
    template_id INTEGER,
    status VARCHAR(50) DEFAULT 'draft',
    version VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Create config_templates table
CREATE TABLE IF NOT EXISTS config_templates (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(100) NOT NULL,
    description TEXT,
    template TEXT,
    variables JSONB,
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Create config_versions table
CREATE TABLE IF NOT EXISTS config_versions (
    id SERIAL PRIMARY KEY,
    config_id INTEGER NOT NULL REFERENCES configs(id) ON DELETE CASCADE,
    version VARCHAR(50) NOT NULL,
    content TEXT,
    changes TEXT,
    created_by VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Create settings table
CREATE TABLE IF NOT EXISTS settings (
    key VARCHAR(100) PRIMARY KEY,
    value TEXT NOT NULL,
    type VARCHAR(50) DEFAULT 'string',
    category VARCHAR(100),
    description TEXT,
    is_public BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Create many-to-many relationship table for device templates and MIBs
CREATE TABLE IF NOT EXISTS device_template_mibs (
    device_template_id INTEGER REFERENCES device_templates(id) ON DELETE CASCADE,
    mib_id INTEGER REFERENCES mibs(id) ON DELETE CASCADE,
    PRIMARY KEY (device_template_id, mib_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_devices_ip_address ON devices(ip_address);
CREATE INDEX IF NOT EXISTS idx_devices_status ON devices(status);
CREATE INDEX IF NOT EXISTS idx_mibs_status ON mibs(status);
CREATE INDEX IF NOT EXISTS idx_oids_mib_id ON oids(mib_id);
CREATE INDEX IF NOT EXISTS idx_oids_oid_string ON oids(oid_string);
CREATE INDEX IF NOT EXISTS idx_configs_type ON configs(type);
CREATE INDEX IF NOT EXISTS idx_configs_device_id ON configs(device_id);

-- Insert default device types
INSERT INTO device_types (name, icon, description) VALUES
('Router', 'router', 'Network router device'),
('Switch', 'switch', 'Network switch device'),
('Server', 'server', 'Server or host device'),
('Firewall', 'shield', 'Firewall or security device'),
('Access Point', 'wifi', 'Wireless access point'),
('Printer', 'printer', 'Network printer'),
('UPS', 'battery', 'Uninterruptible power supply'),
('Other', 'device', 'Other network device')
ON CONFLICT DO NOTHING;

-- Insert default config templates
INSERT INTO config_templates (name, type, description, template, is_default) VALUES
('Prometheus SNMP Exporter', 'prometheus', 'Default Prometheus SNMP Exporter configuration', 
'modules:
  {{.Device.Name}}:
    walk:
{{range .OIDs}}      - {{.}}
{{end}}    auth:
      community: {{.Device.Credentials.Community}}
    version: {{.Device.Credentials.Version}}
', true),

('Zabbix Template', 'zabbix', 'Default Zabbix monitoring template',
'<?xml version="1.0" encoding="UTF-8"?>
<zabbix_export>
    <version>5.0</version>
    <templates>
        <template>
            <template>{{.Device.Name}}</template>
            <name>{{.Device.Name}} Template</name>
            <items>
{{range .OIDs}}                <item>
                    <name>{{.}}</name>
                    <key>snmp.get[{{.}}]</key>
                    <type>SNMP_AGENT</type>
                </item>
{{end}}            </items>
        </template>
    </templates>
</zabbix_export>', true)
ON CONFLICT DO NOTHING;

-- Insert default settings
INSERT INTO settings (key, value, type, category, description, is_public) VALUES
('app_name', 'Network Monitoring Platform', 'string', 'general', 'Application name', true),
('app_version', '1.0.0', 'string', 'general', 'Application version', true),
('max_file_size', '10485760', 'number', 'mib', 'Maximum MIB file size in bytes (10MB)', false),
('snmp_timeout', '5', 'number', 'snmp', 'Default SNMP timeout in seconds', false),
('snmp_retries', '3', 'number', 'snmp', 'Default SNMP retries', false),
('config_backup_enabled', 'true', 'boolean', 'config', 'Enable automatic config backups', false)
ON CONFLICT DO NOTHING;
