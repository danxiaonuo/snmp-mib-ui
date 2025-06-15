/**
 * MIB 监控平台数据库操作库
 * 提供完整的数据库接口和操作方法
 */

import { Pool, PoolClient } from 'pg';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

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
  config_template: Record<string, any>;
  dependencies: string[];
  supported_platforms: string[];
  documentation_url?: string;
  repository_url?: string;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
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
  config_schema: Record<string, any>;
  minimum_requirements: Record<string, any>;
  created_at: Date;
}

export interface Installation {
  id: number;
  uuid: string;
  component_id: number;
  version_id: number;
  name: string;
  config: Record<string, any>;
  status: 'pending' | 'installing' | 'running' | 'stopped' | 'failed' | 'updating';
  installation_type: 'docker' | 'binary' | 'systemd';
  container_id?: string;
  process_id?: number;
  ports: Record<string, any>;
  volumes: Record<string, any>;
  environment: Record<string, any>;
  health_check_url?: string;
  last_health_check?: Date;
  health_status?: boolean;
  error_message?: string;
  install_path?: string;
  log_path?: string;
  created_at: Date;
  updated_at: Date;
  started_at?: Date;
  stopped_at?: Date;
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
  last_login?: Date;
  created_at: Date;
  updated_at: Date;
}

export interface SystemConfig {
  id: number;
  key: string;
  value: any;
  description?: string;
  is_encrypted: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface OperationLog {
  id: number;
  uuid: string;
  user_id?: number;
  operation: string;
  resource_type: string;
  resource_id?: string;
  details: Record<string, any>;
  ip_address?: string;
  user_agent?: string;
  success: boolean;
  error_message?: string;
  duration_ms?: number;
  created_at: Date;
}

// ============================================================================
// 数据库连接池
// ============================================================================

class DatabasePool {
  private static instance: DatabasePool;
  private pool: Pool;

  private constructor() {
    this.pool = new Pool({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      database: process.env.DB_NAME || 'mib_platform',
      user: process.env.DB_USER || 'mib_user',
      password: process.env.DB_PASSWORD || '',
      max: parseInt(process.env.DB_POOL_MAX || '20'),
      idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT || '30000'),
      connectionTimeoutMillis: parseInt(process.env.DB_CONNECTION_TIMEOUT || '2000'),
      ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
    });

    // 监听连接事件
    this.pool.on('connect', (client) => {
      console.log('数据库连接建立');
    });

    this.pool.on('error', (err) => {
      console.error('数据库连接错误:', err);
    });
  }

  public static getInstance(): DatabasePool {
    if (!DatabasePool.instance) {
      DatabasePool.instance = new DatabasePool();
    }
    return DatabasePool.instance;
  }

  public getPool(): Pool {
    return this.pool;
  }

  public async getClient(): Promise<PoolClient> {
    return await this.pool.connect();
  }

  public async query(text: string, params?: any[]): Promise<any> {
    const start = Date.now();
    try {
      const result = await this.pool.query(text, params);
      const duration = Date.now() - start;
      if (process.env.NODE_ENV === 'development') {
        console.log('查询执行时间:', duration, 'ms');
      }
      return result;
    } catch (error) {
      console.error('数据库查询错误:', error);
      throw error;
    }
  }

  public async transaction<T>(callback: (client: PoolClient) => Promise<T>): Promise<T> {
    const client = await this.getClient();
    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  public async close(): Promise<void> {
    await this.pool.end();
  }
}

// 获取数据库实例
const db = DatabasePool.getInstance();

// ============================================================================
// 监控组件相关操作
// ============================================================================

export class ComponentService {
  /**
   * 获取所有监控组件
   */
  static async getAllComponents(includeInactive = false): Promise<MonitoringComponent[]> {
    const query = `
      SELECT * FROM monitoring_components 
      WHERE ($1 OR is_active = true)
      ORDER BY category, display_name
    `;
    const result = await db.query(query, [includeInactive]);
    return result.rows;
  }

  /**
   * 根据名称获取组件
   */
  static async getComponentByName(name: string): Promise<MonitoringComponent | null> {
    const query = 'SELECT * FROM monitoring_components WHERE name = $1 AND is_active = true';
    const result = await db.query(query, [name]);
    return result.rows[0] || null;
  }

  /**
   * 根据 ID 获取组件
   */
  static async getComponentById(id: number): Promise<MonitoringComponent | null> {
    const query = 'SELECT * FROM monitoring_components WHERE id = $1';
    const result = await db.query(query, [id]);
    return result.rows[0] || null;
  }

  /**
   * 根据分类获取组件
   */
  static async getComponentsByCategory(category: string): Promise<MonitoringComponent[]> {
    const query = `
      SELECT * FROM monitoring_components 
      WHERE category = $1 AND is_active = true
      ORDER BY display_name
    `;
    const result = await db.query(query, [category]);
    return result.rows;
  }

  /**
   * 搜索组件
   */
  static async searchComponents(keyword: string): Promise<MonitoringComponent[]> {
    const query = `
      SELECT * FROM monitoring_components 
      WHERE (name ILIKE $1 OR display_name ILIKE $1 OR description ILIKE $1)
      AND is_active = true
      ORDER BY 
        CASE 
          WHEN name ILIKE $1 THEN 1
          WHEN display_name ILIKE $1 THEN 2
          ELSE 3
        END,
        display_name
    `;
    const searchPattern = `%${keyword}%`;
    const result = await db.query(query, [searchPattern]);
    return result.rows;
  }
}

// ============================================================================
// 组件版本相关操作
// ============================================================================

export class VersionService {
  /**
   * 获取组件的所有版本
   */
  static async getVersionsByComponent(componentId: number): Promise<ComponentVersion[]> {
    const query = `
      SELECT * FROM component_versions 
      WHERE component_id = $1 
      ORDER BY created_at DESC
    `;
    const result = await db.query(query, [componentId]);
    return result.rows;
  }

  /**
   * 获取组件的最新版本
   */
  static async getLatestVersion(componentId: number): Promise<ComponentVersion | null> {
    const query = `
      SELECT * FROM component_versions 
      WHERE component_id = $1 AND is_latest = true 
      LIMIT 1
    `;
    const result = await db.query(query, [componentId]);
    return result.rows[0] || null;
  }

  /**
   * 获取组件的稳定版本
   */
  static async getStableVersions(componentId: number): Promise<ComponentVersion[]> {
    const query = `
      SELECT * FROM component_versions 
      WHERE component_id = $1 AND is_stable = true 
      ORDER BY created_at DESC
    `;
    const result = await db.query(query, [componentId]);
    return result.rows;
  }

  /**
   * 根据 ID 获取版本
   */
  static async getVersionById(id: number): Promise<ComponentVersion | null> {
    const query = 'SELECT * FROM component_versions WHERE id = $1';
    const result = await db.query(query, [id]);
    return result.rows[0] || null;
  }
}

// ============================================================================
// 安装记录相关操作
// ============================================================================

export class InstallationService {
  /**
   * 获取所有安装记录
   */
  static async getAllInstallations(): Promise<Installation[]> {
    const query = `
      SELECT i.*, mc.name as component_name, mc.display_name, cv.version
      FROM installations i
      JOIN monitoring_components mc ON i.component_id = mc.id
      JOIN component_versions cv ON i.version_id = cv.id
      ORDER BY i.created_at DESC
    `;
    const result = await db.query(query);
    return result.rows;
  }

  /**
   * 根据状态获取安装记录
   */
  static async getInstallationsByStatus(status: string): Promise<Installation[]> {
    const query = `
      SELECT i.*, mc.name as component_name, mc.display_name, cv.version
      FROM installations i
      JOIN monitoring_components mc ON i.component_id = mc.id
      JOIN component_versions cv ON i.version_id = cv.id
      WHERE i.status = $1
      ORDER BY i.created_at DESC
    `;
    const result = await db.query(query, [status]);
    return result.rows;
  }

  /**
   * 根据组件获取安装记录
   */
  static async getInstallationsByComponent(componentId: number): Promise<Installation[]> {
    const query = `
      SELECT i.*, cv.version
      FROM installations i
      JOIN component_versions cv ON i.version_id = cv.id
      WHERE i.component_id = $1
      ORDER BY i.created_at DESC
    `;
    const result = await db.query(query, [componentId]);
    return result.rows;
  }

  /**
   * 根据 ID 获取安装记录
   */
  static async getInstallationById(id: number): Promise<Installation | null> {
    const query = `
      SELECT i.*, mc.name as component_name, mc.display_name, cv.version
      FROM installations i
      JOIN monitoring_components mc ON i.component_id = mc.id
      JOIN component_versions cv ON i.version_id = cv.id
      WHERE i.id = $1
    `;
    const result = await db.query(query, [id]);
    return result.rows[0] || null;
  }

  /**
   * 创建安装记录
   */
  static async createInstallation(installation: {
    component_id: number;
    version_id: number;
    name: string;
    config: Record<string, any>;
    installation_type?: 'docker' | 'binary' | 'systemd';
    ports?: Record<string, any>;
    volumes?: Record<string, any>;
    environment?: Record<string, any>;
  }): Promise<Installation> {
    const query = `
      INSERT INTO installations (
        uuid, component_id, version_id, name, config, installation_type,
        ports, volumes, environment, status
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, 'pending'
      ) RETURNING *
    `;
    
    const values = [
      uuidv4(),
      installation.component_id,
      installation.version_id,
      installation.name,
      JSON.stringify(installation.config),
      installation.installation_type || 'docker',
      JSON.stringify(installation.ports || {}),
      JSON.stringify(installation.volumes || {}),
      JSON.stringify(installation.environment || {})
    ];
    
    const result = await db.query(query, values);
    return result.rows[0];
  }

  /**
   * 更新安装记录状态
   */
  static async updateInstallationStatus(
    id: number, 
    status: string, 
    containerId?: string,
    errorMessage?: string
  ): Promise<Installation | null> {
    const query = `
      UPDATE installations 
      SET status = $1, container_id = $2, error_message = $3, updated_at = CURRENT_TIMESTAMP
      WHERE id = $4
      RETURNING *
    `;
    const result = await db.query(query, [status, containerId, errorMessage, id]);
    return result.rows[0] || null;
  }

  /**
   * 更新健康检查状态
   */
  static async updateHealthStatus(id: number, status: boolean, errorMessage?: string): Promise<void> {
    const query = `
      UPDATE installations 
      SET health_status = $1, last_health_check = CURRENT_TIMESTAMP, error_message = $2
      WHERE id = $3
    `;
    await db.query(query, [status, errorMessage, id]);
  }

  /**
   * 删除安装记录
   */
  static async deleteInstallation(id: number): Promise<boolean> {
    const query = 'DELETE FROM installations WHERE id = $1';
    const result = await db.query(query, [id]);
    return result.rowCount > 0;
  }
}

// ============================================================================
// 用户相关操作
// ============================================================================

export class UserService {
  /**
   * 根据用户名获取用户
   */
  static async getUserByUsername(username: string): Promise<User | null> {
    const query = 'SELECT * FROM users WHERE username = $1 AND is_active = true';
    const result = await db.query(query, [username]);
    return result.rows[0] || null;
  }

  /**
   * 验证用户密码
   */
  static async verifyPassword(username: string, password: string): Promise<User | null> {
    const user = await this.getUserByUsername(username);
    if (!user) {
      return null;
    }

    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) {
      return null;
    }

    // 更新最后登录时间
    await db.query('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1', [user.id]);
    
    return user;
  }
}

// ============================================================================
// 系统配置相关操作
// ============================================================================

export class ConfigService {
  /**
   * 获取配置值
   */
  static async getConfig(key: string): Promise<any> {
    const query = 'SELECT value FROM system_config WHERE key = $1';
    const result = await db.query(query, [key]);
    return result.rows[0]?.value;
  }

  /**
   * 设置配置值
   */
  static async setConfig(key: string, value: any, description?: string): Promise<void> {
    const query = `
      INSERT INTO system_config (key, value, description)
      VALUES ($1, $2, $3)
      ON CONFLICT (key) DO UPDATE SET
        value = EXCLUDED.value,
        description = COALESCE(EXCLUDED.description, system_config.description),
        updated_at = CURRENT_TIMESTAMP
    `;
    await db.query(query, [key, JSON.stringify(value), description]);
  }

  /**
   * 获取所有配置
   */
  static async getAllConfigs(): Promise<SystemConfig[]> {
    const query = 'SELECT * FROM system_config ORDER BY key';
    const result = await db.query(query);
    return result.rows;
  }
}

// ============================================================================
// 统计和监控相关操作
// ============================================================================

export class StatsService {
  /**
   * 获取系统统计信息
   */
  static async getSystemStats(): Promise<any> {
    const queries = {
      totalComponents: 'SELECT COUNT(*) as count FROM monitoring_components WHERE is_active = true',
      totalInstallations: 'SELECT COUNT(*) as count FROM installations',
      runningInstallations: 'SELECT COUNT(*) as count FROM installations WHERE status = \'running\'',
      failedInstallations: 'SELECT COUNT(*) as count FROM installations WHERE status = \'failed\'',
      totalUsers: 'SELECT COUNT(*) as count FROM users WHERE is_active = true'
    };

    const results: any = {};
    for (const [key, query] of Object.entries(queries)) {
      const result = await db.query(query);
      results[key] = parseInt(result.rows[0].count);
    }

    return results;
  }
}

// ============================================================================
// 数据库工具函数
// ============================================================================

export class DatabaseUtils {
  /**
   * 检查数据库连接
   */
  static async checkConnection(): Promise<boolean> {
    try {
      await db.query('SELECT 1');
      return true;
    } catch (error) {
      console.error('数据库连接检查失败:', error);
      return false;
    }
  }

  /**
   * 初始化数据库检查
   */
  static async initializeDatabase(): Promise<boolean> {
    try {
      // 检查是否已初始化
      const result = await db.query(
        "SELECT value FROM system_config WHERE key = 'database.initialized'"
      );
      
      if (result.rows.length > 0 && result.rows[0].value === 'true') {
        console.log('数据库已初始化');
        return true;
      }

      console.log('数据库未初始化，需要运行初始化脚本');
      return false;
    } catch (error) {
      console.error('检查数据库初始化状态失败:', error);
      return false;
    }
  }
}

// ============================================================================
// 兼容性函数 (保持向后兼容)
// ============================================================================

// Test database connection
export async function testConnection() {
  return await DatabaseUtils.checkConnection();
}

// Execute query
export async function query(text: string, params?: any[]) {
  return await db.query(text, params);
}

// Get monitoring components
export async function getMonitoringComponents() {
  const result = await db.query(`
    SELECT mc.*, 
           cv.version as latest_version,
           cv.docker_image
    FROM monitoring_components mc
    LEFT JOIN component_versions cv ON mc.id = cv.component_id AND cv.is_latest = true
    WHERE mc.is_active = true
    ORDER BY mc.category, mc.display_name
  `);
  return result.rows;
}

// Get component versions
export async function getComponentVersions(componentId: number) {
  return await VersionService.getVersionsByComponent(componentId);
}

// Create installation record
export async function createInstallation(data: {
  componentId: number;
  versionId: number;
  name: string;
  config: any;
  ports: any;
}) {
  return await InstallationService.createInstallation({
    component_id: data.componentId,
    version_id: data.versionId,
    name: data.name,
    config: data.config,
    ports: data.ports
  });
}

// Update installation status
export async function updateInstallationStatus(
  id: number, 
  status: string, 
  containerId?: string,
  errorMessage?: string
) {
  return await InstallationService.updateInstallationStatus(id, status, containerId, errorMessage);
}

// Get installations
export async function getInstallations() {
  return await InstallationService.getAllInstallations();
}

// 导出数据库实例
export { db };

// 默认导出
export default db.getPool();
