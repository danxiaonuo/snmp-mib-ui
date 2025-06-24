/**
 * SQLite数据库操作库
 * 替代PostgreSQL，提供轻量级本地数据库支持
 */

import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';

// ============================================================================
// 类型定义
// ============================================================================

export interface MonitoringComponent {
  id: number;
  uuid: string;
  name: string;
  display_name: string;
  description?: string;
  category: 'exporter' | 'agent' | 'storage' | 'visualization' | 'alerting' | 'proxy';
  default_port?: number;
  config_template: string;
  dependencies: string;
  supported_platforms: string;
  documentation_url?: string;
  repository_url?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ComponentVersion {
  id: number;
  uuid: string;
  component_id: number;
  version: string;
  docker_image?: string;
  binary_url?: string;
  checksum?: string;
  is_stable: boolean;
  is_latest: boolean;
  release_notes?: string;
  config_schema: string;
  minimum_requirements: string;
  created_at: string;
}

export interface Installation {
  id: number;
  uuid: string;
  component_id: number;
  version_id: number;
  name: string;
  config: string;
  status: 'pending' | 'installing' | 'running' | 'stopped' | 'failed' | 'updating';
  installation_type: 'docker' | 'binary' | 'systemd';
  container_id?: string;
  process_id?: number;
  ports: string;
  volumes: string;
  environment: string;
  health_check_url?: string;
  last_health_check?: string;
  health_status?: boolean;
  error_message?: string;
  install_path?: string;
  log_path?: string;
  created_at: string;
  updated_at: string;
  started_at?: string;
  stopped_at?: string;
}

export interface User {
  id: number;
  uuid: string;
  username: string;
  email: string;
  password_hash: string;
  full_name?: string;
  role: string;
  is_active: boolean;
  last_login?: string;
  created_at: string;
  updated_at: string;
}

export interface SystemConfig {
  id: number;
  key: string;
  value: string;
  description?: string;
  is_encrypted: boolean;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// SQLite数据库连接
// ============================================================================

class SQLiteDatabase {
  private static instance: SQLiteDatabase;
  private db: Database.Database;

  private constructor() {
    const dbPath = process.env.SQLITE_DB_PATH || path.join(process.cwd(), 'snmp_platform.db');
    this.db = new Database(dbPath);
    this.db.pragma('journal_mode = WAL');
    this.db.pragma('foreign_keys = ON');
    this.initializeTables();
  }

  public static getInstance(): SQLiteDatabase {
    if (!SQLiteDatabase.instance) {
      SQLiteDatabase.instance = new SQLiteDatabase();
    }
    return SQLiteDatabase.instance;
  }

  private initializeTables() {
    // 创建监控组件表
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS monitoring_components (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        uuid TEXT UNIQUE NOT NULL,
        name TEXT UNIQUE NOT NULL,
        display_name TEXT NOT NULL,
        description TEXT,
        category TEXT NOT NULL CHECK (category IN ('exporter', 'agent', 'storage', 'visualization', 'alerting', 'proxy')),
        default_port INTEGER,
        config_template TEXT NOT NULL DEFAULT '{}',
        dependencies TEXT NOT NULL DEFAULT '[]',
        supported_platforms TEXT NOT NULL DEFAULT '[]',
        documentation_url TEXT,
        repository_url TEXT,
        is_active BOOLEAN NOT NULL DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 创建组件版本表
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS component_versions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        uuid TEXT UNIQUE NOT NULL,
        component_id INTEGER NOT NULL,
        version TEXT NOT NULL,
        docker_image TEXT,
        binary_url TEXT,
        checksum TEXT,
        is_stable BOOLEAN NOT NULL DEFAULT 0,
        is_latest BOOLEAN NOT NULL DEFAULT 0,
        release_notes TEXT,
        config_schema TEXT NOT NULL DEFAULT '{}',
        minimum_requirements TEXT NOT NULL DEFAULT '{}',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (component_id) REFERENCES monitoring_components(id) ON DELETE CASCADE,
        UNIQUE(component_id, version)
      )
    `);

    // 创建安装记录表
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS installations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        uuid TEXT UNIQUE NOT NULL,
        component_id INTEGER NOT NULL,
        version_id INTEGER NOT NULL,
        name TEXT NOT NULL,
        config TEXT NOT NULL DEFAULT '{}',
        status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'installing', 'running', 'stopped', 'failed', 'updating')),
        installation_type TEXT NOT NULL DEFAULT 'docker' CHECK (installation_type IN ('docker', 'binary', 'systemd')),
        container_id TEXT,
        process_id INTEGER,
        ports TEXT NOT NULL DEFAULT '{}',
        volumes TEXT NOT NULL DEFAULT '{}',
        environment TEXT NOT NULL DEFAULT '{}',
        health_check_url TEXT,
        last_health_check DATETIME,
        health_status BOOLEAN,
        error_message TEXT,
        install_path TEXT,
        log_path TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        started_at DATETIME,
        stopped_at DATETIME,
        FOREIGN KEY (component_id) REFERENCES monitoring_components(id) ON DELETE CASCADE,
        FOREIGN KEY (version_id) REFERENCES component_versions(id) ON DELETE CASCADE
      )
    `);

    // 创建用户表
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        uuid TEXT UNIQUE NOT NULL,
        username TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        full_name TEXT,
        role TEXT NOT NULL DEFAULT 'user',
        is_active BOOLEAN NOT NULL DEFAULT 1,
        last_login DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 创建系统配置表
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS system_config (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        key TEXT UNIQUE NOT NULL,
        value TEXT NOT NULL,
        description TEXT,
        is_encrypted BOOLEAN NOT NULL DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 创建索引
    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_monitoring_components_category ON monitoring_components(category);
      CREATE INDEX IF NOT EXISTS idx_monitoring_components_active ON monitoring_components(is_active);
      CREATE INDEX IF NOT EXISTS idx_component_versions_component_id ON component_versions(component_id);
      CREATE INDEX IF NOT EXISTS idx_component_versions_latest ON component_versions(is_latest);
      CREATE INDEX IF NOT EXISTS idx_installations_status ON installations(status);
      CREATE INDEX IF NOT EXISTS idx_installations_component_id ON installations(component_id);
      CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
      CREATE INDEX IF NOT EXISTS idx_users_active ON users(is_active);
      CREATE INDEX IF NOT EXISTS idx_system_config_key ON system_config(key);
    `);

    console.log('SQLite数据库表已初始化完成');
  }

  public getDb(): Database.Database {
    return this.db;
  }

  public close(): void {
    this.db.close();
  }
}

// 获取数据库实例
const sqliteDb = SQLiteDatabase.getInstance();
const db = sqliteDb.getDb();

// ============================================================================
// 监控组件相关操作
// ============================================================================

export class ComponentService {
  static getAllComponents(includeInactive = false): MonitoringComponent[] {
    const query = includeInactive 
      ? 'SELECT * FROM monitoring_components ORDER BY category, display_name'
      : 'SELECT * FROM monitoring_components WHERE is_active = 1 ORDER BY category, display_name';
    return db.prepare(query).all() as MonitoringComponent[];
  }

  static getComponentByName(name: string): MonitoringComponent | null {
    const query = 'SELECT * FROM monitoring_components WHERE name = ? AND is_active = 1';
    return db.prepare(query).get(name) as MonitoringComponent || null;
  }

  static getComponentById(id: number): MonitoringComponent | null {
    const query = 'SELECT * FROM monitoring_components WHERE id = ?';
    return db.prepare(query).get(id) as MonitoringComponent || null;
  }

  static getComponentsByCategory(category: string): MonitoringComponent[] {
    const query = 'SELECT * FROM monitoring_components WHERE category = ? AND is_active = 1 ORDER BY display_name';
    return db.prepare(query).all(category) as MonitoringComponent[];
  }

  static searchComponents(keyword: string): MonitoringComponent[] {
    const searchPattern = `%${keyword}%`;
    const query = `
      SELECT * FROM monitoring_components 
      WHERE (name LIKE ? OR display_name LIKE ? OR description LIKE ?)
      AND is_active = 1
      ORDER BY 
        CASE 
          WHEN name LIKE ? THEN 1
          WHEN display_name LIKE ? THEN 2
          ELSE 3
        END,
        display_name
    `;
    return db.prepare(query).all(searchPattern, searchPattern, searchPattern, searchPattern, searchPattern) as MonitoringComponent[];
  }
}

// ============================================================================
// 组件版本相关操作
// ============================================================================

export class VersionService {
  static getVersionsByComponent(componentId: number): ComponentVersion[] {
    const query = 'SELECT * FROM component_versions WHERE component_id = ? ORDER BY created_at DESC';
    return db.prepare(query).all(componentId) as ComponentVersion[];
  }

  static getLatestVersion(componentId: number): ComponentVersion | null {
    const query = 'SELECT * FROM component_versions WHERE component_id = ? AND is_latest = 1 LIMIT 1';
    return db.prepare(query).get(componentId) as ComponentVersion || null;
  }

  static getStableVersions(componentId: number): ComponentVersion[] {
    const query = 'SELECT * FROM component_versions WHERE component_id = ? AND is_stable = 1 ORDER BY created_at DESC';
    return db.prepare(query).all(componentId) as ComponentVersion[];
  }

  static getVersionById(id: number): ComponentVersion | null {
    const query = 'SELECT * FROM component_versions WHERE id = ?';
    return db.prepare(query).get(id) as ComponentVersion || null;
  }
}

// ============================================================================
// 安装记录相关操作
// ============================================================================

export class InstallationService {
  static getAllInstallations(): Installation[] {
    const query = `
      SELECT i.*, mc.name as component_name, mc.display_name, cv.version
      FROM installations i
      JOIN monitoring_components mc ON i.component_id = mc.id
      JOIN component_versions cv ON i.version_id = cv.id
      ORDER BY i.created_at DESC
    `;
    return db.prepare(query).all() as Installation[];
  }

  static getInstallationsByStatus(status: string): Installation[] {
    const query = `
      SELECT i.*, mc.name as component_name, mc.display_name, cv.version
      FROM installations i
      JOIN monitoring_components mc ON i.component_id = mc.id
      JOIN component_versions cv ON i.version_id = cv.id
      WHERE i.status = ?
      ORDER BY i.created_at DESC
    `;
    return db.prepare(query).all(status) as Installation[];
  }

  static getInstallationsByComponent(componentId: number): Installation[] {
    const query = `
      SELECT i.*, cv.version
      FROM installations i
      JOIN component_versions cv ON i.version_id = cv.id
      WHERE i.component_id = ?
      ORDER BY i.created_at DESC
    `;
    return db.prepare(query).all(componentId) as Installation[];
  }

  static getInstallationById(id: number): Installation | null {
    const query = `
      SELECT i.*, mc.name as component_name, mc.display_name, cv.version
      FROM installations i
      JOIN monitoring_components mc ON i.component_id = mc.id
      JOIN component_versions cv ON i.version_id = cv.id
      WHERE i.id = ?
    `;
    return db.prepare(query).get(id) as Installation || null;
  }

  static createInstallation(installation: {
    component_id: number;
    version_id: number;
    name: string;
    config: Record<string, any>;
    installation_type?: 'docker' | 'binary' | 'systemd';
    ports?: Record<string, any>;
    volumes?: Record<string, any>;
    environment?: Record<string, any>;
  }): Installation {
    const query = `
      INSERT INTO installations (
        uuid, component_id, version_id, name, config, installation_type,
        ports, volumes, environment, status
      ) VALUES (
        ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending'
      )
    `;
    
    const uuid = uuidv4();
    const stmt = db.prepare(query);
    const result = stmt.run(
      uuid,
      installation.component_id,
      installation.version_id,
      installation.name,
      JSON.stringify(installation.config),
      installation.installation_type || 'docker',
      JSON.stringify(installation.ports || {}),
      JSON.stringify(installation.volumes || {}),
      JSON.stringify(installation.environment || {})
    );
    
    return this.getInstallationById(result.lastInsertRowid as number)!;
  }

  static updateInstallationStatus(
    id: number, 
    status: string, 
    containerId?: string,
    errorMessage?: string
  ): Installation | null {
    const query = `
      UPDATE installations 
      SET status = ?, container_id = ?, error_message = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;
    db.prepare(query).run(status, containerId, errorMessage, id);
    return this.getInstallationById(id);
  }

  static updateHealthStatus(id: number, status: boolean, errorMessage?: string): void {
    const query = `
      UPDATE installations 
      SET health_status = ?, last_health_check = CURRENT_TIMESTAMP, error_message = ?
      WHERE id = ?
    `;
    db.prepare(query).run(status, errorMessage, id);
  }

  static deleteInstallation(id: number): boolean {
    const query = 'DELETE FROM installations WHERE id = ?';
    const result = db.prepare(query).run(id);
    return result.changes > 0;
  }
}

// ============================================================================
// 用户相关操作
// ============================================================================

export class UserService {
  static getUserByUsername(username: string): User | null {
    const query = 'SELECT * FROM users WHERE username = ? AND is_active = 1';
    return db.prepare(query).get(username) as User || null;
  }

  static async verifyPassword(username: string, password: string): Promise<User | null> {
    const user = this.getUserByUsername(username);
    if (!user) {
      return null;
    }

    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) {
      return null;
    }

    // 更新最后登录时间
    db.prepare('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?').run(user.id);
    
    return user;
  }
}

// ============================================================================
// 系统配置相关操作
// ============================================================================

export class ConfigService {
  static getConfig(key: string): any {
    const query = 'SELECT value FROM system_config WHERE key = ?';
    const result = db.prepare(query).get(key) as { value: string } | undefined;
    if (!result) return null;
    
    try {
      return JSON.parse(result.value);
    } catch {
      return result.value;
    }
  }

  static setConfig(key: string, value: any, description?: string): void {
    const query = `
      INSERT INTO system_config (key, value, description)
      VALUES (?, ?, ?)
      ON CONFLICT(key) DO UPDATE SET
        value = excluded.value,
        description = COALESCE(excluded.description, system_config.description),
        updated_at = CURRENT_TIMESTAMP
    `;
    db.prepare(query).run(key, JSON.stringify(value), description);
  }

  static getAllConfigs(): SystemConfig[] {
    const query = 'SELECT * FROM system_config ORDER BY key';
    return db.prepare(query).all() as SystemConfig[];
  }
}

// ============================================================================
// 统计和监控相关操作
// ============================================================================

export class StatsService {
  static getSystemStats(): any {
    const queries = {
      totalComponents: 'SELECT COUNT(*) as count FROM monitoring_components WHERE is_active = 1',
      totalInstallations: 'SELECT COUNT(*) as count FROM installations',
      runningInstallations: 'SELECT COUNT(*) as count FROM installations WHERE status = \'running\'',
      failedInstallations: 'SELECT COUNT(*) as count FROM installations WHERE status = \'failed\'',
      totalUsers: 'SELECT COUNT(*) as count FROM users WHERE is_active = 1'
    };

    const results: any = {};
    for (const [key, query] of Object.entries(queries)) {
      const result = db.prepare(query).get() as { count: number };
      results[key] = result.count;
    }

    return results;
  }
}

// ============================================================================
// 数据库工具函数
// ============================================================================

export class DatabaseUtils {
  static checkConnection(): boolean {
    try {
      db.prepare('SELECT 1').get();
      return true;
    } catch (error) {
      console.error('SQLite数据库连接检查失败:', error);
      return false;
    }
  }

  static initializeDatabase(): boolean {
    try {
      // 检查是否已初始化
      const result = db.prepare("SELECT value FROM system_config WHERE key = 'database.initialized'").get() as { value: string } | undefined;
      
      if (result && result.value === 'true') {
        console.log('数据库已初始化');
        return true;
      }

      // 标记为已初始化
      ConfigService.setConfig('database.initialized', 'true', '数据库初始化状态');
      console.log('数据库初始化完成');
      return true;
    } catch (error) {
      console.error('检查数据库初始化状态失败:', error);
      return false;
    }
  }
}

// ============================================================================
// 兼容性函数 (保持向后兼容)
// ============================================================================

export function testConnection(): boolean {
  return DatabaseUtils.checkConnection();
}

export function query(text: string, params: any[] = []): any {
  // 简化的查询接口，适配SQLite
  try {
    const stmt = db.prepare(text);
    if (text.trim().toLowerCase().startsWith('select')) {
      return { rows: stmt.all(...params) };
    } else {
      const result = stmt.run(...params);
      return { rows: [], rowCount: result.changes };
    }
  } catch (error) {
    console.error('查询执行错误:', error);
    throw error;
  }
}

export function getMonitoringComponents(): MonitoringComponent[] {
  const query = `
    SELECT mc.*, 
           cv.version as latest_version,
           cv.docker_image
    FROM monitoring_components mc
    LEFT JOIN component_versions cv ON mc.id = cv.component_id AND cv.is_latest = 1
    WHERE mc.is_active = 1
    ORDER BY mc.category, mc.display_name
  `;
  return db.prepare(query).all() as MonitoringComponent[];
}

export function getComponentVersions(componentId: number): ComponentVersion[] {
  return VersionService.getVersionsByComponent(componentId);
}

export function createInstallation(data: {
  componentId: number;
  versionId: number;
  name: string;
  config: any;
  ports: any;
}): Installation {
  return InstallationService.createInstallation({
    component_id: data.componentId,
    version_id: data.versionId,
    name: data.name,
    config: data.config,
    ports: data.ports
  });
}

export function updateInstallationStatus(
  id: number, 
  status: string, 
  containerId?: string,
  errorMessage?: string
): Installation | null {
  return InstallationService.updateInstallationStatus(id, status, containerId, errorMessage);
}

export function getInstallations(): Installation[] {
  return InstallationService.getAllInstallations();
}

// 导出数据库实例
export { db };

// 默认导出
export default db;