/**
 * 多租户架构支持
 * 租户隔离、资源配额管理、权限控制
 * 
 * @author SNMP Platform Team
 * @version 1.0.0
 * @date 2024-12-18
 */

import { EventEmitter } from 'events';
import { z } from 'zod';
import crypto from 'crypto';

// 基础类型定义
export interface Tenant {
  id: string;
  name: string;
  description: string;
  domain: string;
  status: TenantStatus;
  tier: TenantTier;
  settings: TenantSettings;
  quotas: ResourceQuotas;
  billing: BillingInfo;
  createdAt: Date;
  updatedAt: Date;
  metadata: Record<string, any>;
}

export enum TenantStatus {
  ACTIVE = 'active',
  SUSPENDED = 'suspended',
  PENDING = 'pending',
  DEACTIVATED = 'deactivated'
}

export enum TenantTier {
  BASIC = 'basic',
  PROFESSIONAL = 'professional',
  ENTERPRISE = 'enterprise',
  CUSTOM = 'custom'
}

export interface TenantSettings {
  timezone: string;
  locale: string;
  theme: string;
  notifications: NotificationSettings;
  dataRetention: DataRetentionSettings;
  integrations: IntegrationSettings;
  security: SecuritySettings;
}

export interface NotificationSettings {
  enabled: boolean;
  channels: string[];
  alertThresholds: Record<string, number>;
  escalationRules: EscalationRule[];
}

export interface DataRetentionSettings {
  metrics: number; // days
  logs: number; // days
  alerts: number; // days
  reports: number; // days
}

export interface IntegrationSettings {
  webhooks: WebhookConfig[];
  apiKeys: ApiKeyConfig[];
  ssoEnabled: boolean;
  ssoProvider?: string;
}

export interface SecuritySettings {
  enforceSSL: boolean;
  ipWhitelist: string[];
  sessionTimeout: number; // minutes
  passwordPolicy: PasswordPolicy;
  mfaRequired: boolean;
}

export interface ResourceQuotas {
  devices: number;
  users: number;
  alertRules: number;
  dashboards: number;
  storage: number; // MB
  apiCalls: number; // per hour
  dataPoints: number; // per day
  exportJobs: number; // per day
}

export interface BillingInfo {
  plan: string;
  billingCycle: 'monthly' | 'yearly';
  amount: number;
  currency: string;
  nextBillingDate: Date;
  paymentMethod: string;
  invoiceEmail: string;
}

export interface User {
  id: string;
  tenantId: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  permissions: Permission[];
  status: UserStatus;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  metadata: Record<string, any>;
}

export enum UserRole {
  TENANT_ADMIN = 'tenant_admin',
  OPERATOR = 'operator',
  VIEWER = 'viewer',
  CUSTOM = 'custom'
}

export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  PENDING = 'pending',
  BLOCKED = 'blocked'
}

export interface Permission {
  resource: string;
  actions: string[];
  conditions?: Record<string, any>;
}

export interface ResourceUsage {
  tenantId: string;
  resource: string;
  used: number;
  limit: number;
  percentage: number;
  timestamp: Date;
}

export interface TenantMetrics {
  tenantId: string;
  period: string;
  metrics: {
    activeUsers: number;
    deviceCount: number;
    alertCount: number;
    dataVolume: number;
    apiCalls: number;
    uptime: number;
    responseTime: number;
  };
  generatedAt: Date;
}

export interface IsolationConfig {
  databaseSchema: boolean;
  dataEncryption: boolean;
  networkSegmentation: boolean;
  resourceLimits: boolean;
  auditLogging: boolean;
}

// 验证模式
const tenantSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1).max(100),
  description: z.string().max(500),
  domain: z.string().regex(/^[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9]\.[a-zA-Z]{2,}$/),
  status: z.nativeEnum(TenantStatus),
  tier: z.nativeEnum(TenantTier),
  settings: z.object({
    timezone: z.string(),
    locale: z.string(),
    theme: z.string(),
    notifications: z.object({
      enabled: z.boolean(),
      channels: z.array(z.string()),
      alertThresholds: z.record(z.number()),
      escalationRules: z.array(z.any())
    }),
    dataRetention: z.object({
      metrics: z.number().positive(),
      logs: z.number().positive(),
      alerts: z.number().positive(),
      reports: z.number().positive()
    }),
    integrations: z.object({
      webhooks: z.array(z.any()),
      apiKeys: z.array(z.any()),
      ssoEnabled: z.boolean(),
      ssoProvider: z.string().optional()
    }),
    security: z.object({
      enforceSSL: z.boolean(),
      ipWhitelist: z.array(z.string()),
      sessionTimeout: z.number().positive(),
      passwordPolicy: z.any(),
      mfaRequired: z.boolean()
    })
  }),
  quotas: z.object({
    devices: z.number().min(0),
    users: z.number().min(1),
    alertRules: z.number().min(0),
    dashboards: z.number().min(0),
    storage: z.number().min(0),
    apiCalls: z.number().min(0),
    dataPoints: z.number().min(0),
    exportJobs: z.number().min(0)
  }),
  billing: z.object({
    plan: z.string(),
    billingCycle: z.enum(['monthly', 'yearly']),
    amount: z.number().min(0),
    currency: z.string(),
    nextBillingDate: z.date(),
    paymentMethod: z.string(),
    invoiceEmail: z.string().email()
  }),
  createdAt: z.date(),
  updatedAt: z.date(),
  metadata: z.record(z.any())
});

const userSchema = z.object({
  id: z.string().min(1),
  tenantId: z.string().min(1),
  username: z.string().min(3).max(50),
  email: z.string().email(),
  firstName: z.string().min(1).max(50),
  lastName: z.string().min(1).max(50),
  role: z.nativeEnum(UserRole),
  permissions: z.array(z.object({
    resource: z.string(),
    actions: z.array(z.string()),
    conditions: z.record(z.any()).optional()
  })),
  status: z.nativeEnum(UserStatus),
  lastLoginAt: z.date().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
  metadata: z.record(z.any())
});

interface EscalationRule {
  level: number;
  delay: number; // minutes
  targets: string[];
}

interface WebhookConfig {
  id: string;
  url: string;
  events: string[];
  enabled: boolean;
}

interface ApiKeyConfig {
  id: string;
  name: string;
  permissions: string[];
  expiresAt?: Date;
}

interface PasswordPolicy {
  minLength: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireNumbers: boolean;
  requireSpecialChars: boolean;
  expirationDays: number;
}

/**
 * 租户隔离管理器
 */
export class TenantIsolationManager {
  private config: IsolationConfig;

  constructor(config: IsolationConfig) {
    this.config = config;
  }

  /**
   * 创建租户数据库模式
   */
  async createTenantSchema(tenantId: string): Promise<void> {
    if (!this.config.databaseSchema) {
      return;
    }

    try {
      const schemaName = `tenant_${tenantId}`;
      
      // 创建数据库模式的SQL语句
      const createSchemaSQL = `CREATE SCHEMA IF NOT EXISTS ${schemaName}`;
      
      // 创建租户专用表
      const createTablesSQL = [
        `CREATE TABLE IF NOT EXISTS ${schemaName}.devices (
          id VARCHAR(255) PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          ip_address INET NOT NULL,
          type VARCHAR(100),
          status VARCHAR(50),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`,
        `CREATE TABLE IF NOT EXISTS ${schemaName}.metrics (
          id BIGSERIAL PRIMARY KEY,
          device_id VARCHAR(255),
          metric_name VARCHAR(255),
          value FLOAT,
          timestamp TIMESTAMP,
          FOREIGN KEY (device_id) REFERENCES ${schemaName}.devices(id)
        )`,
        `CREATE TABLE IF NOT EXISTS ${schemaName}.alerts (
          id VARCHAR(255) PRIMARY KEY,
          device_id VARCHAR(255),
          severity INTEGER,
          message TEXT,
          status VARCHAR(50),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (device_id) REFERENCES ${schemaName}.devices(id)
        )`
      ];
      
      // 这里应该执行实际的数据库操作
      console.log(`创建租户数据库模式: ${schemaName}`);
      
    } catch (error) {
      throw new Error(`创建租户模式失败: ${error}`);
    }
  }

  /**
   * 删除租户数据库模式
   */
  async deleteTenantSchema(tenantId: string): Promise<void> {
    if (!this.config.databaseSchema) {
      return;
    }

    try {
      const schemaName = `tenant_${tenantId}`;
      const dropSchemaSQL = `DROP SCHEMA IF EXISTS ${schemaName} CASCADE`;
      
      // 这里应该执行实际的数据库操作
      console.log(`删除租户数据库模式: ${schemaName}`);
      
    } catch (error) {
      throw new Error(`删除租户模式失败: ${error}`);
    }
  }

  /**
   * 加密租户数据
   */
  encryptTenantData(tenantId: string, data: any): string {
    if (!this.config.dataEncryption) {
      return JSON.stringify(data);
    }

    try {
      const key = this.getTenantEncryptionKey(tenantId);
      const cipher = crypto.createCipher('aes-256-cbc', key);
      let encrypted = cipher.update(JSON.stringify(data), 'utf8', 'hex');
      encrypted += cipher.final('hex');
      
      return encrypted;
      
    } catch (error) {
      throw new Error(`数据加密失败: ${error}`);
    }
  }

  /**
   * 解密租户数据
   */
  decryptTenantData(tenantId: string, encryptedData: string): any {
    if (!this.config.dataEncryption) {
      return JSON.parse(encryptedData);
    }

    try {
      const key = this.getTenantEncryptionKey(tenantId);
      const decipher = crypto.createDecipher('aes-256-cbc', key);
      let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      return JSON.parse(decrypted);
      
    } catch (error) {
      throw new Error(`数据解密失败: ${error}`);
    }
  }

  /**
   * 获取租户加密密钥
   */
  private getTenantEncryptionKey(tenantId: string): string {
    // 基于租户ID和系统密钥生成唯一的加密密钥
    const systemKey = process.env.SYSTEM_ENCRYPTION_KEY || 'default-system-key';
    return crypto.createHash('sha256').update(`${systemKey}-${tenantId}`).digest('hex');
  }

  /**
   * 验证网络隔离
   */
  async validateNetworkIsolation(tenantId: string, sourceIP: string): Promise<boolean> {
    if (!this.config.networkSegmentation) {
      return true;
    }

    try {
      // 获取租户网络配置
      const tenantNetworkConfig = await this.getTenantNetworkConfig(tenantId);
      
      // 检查IP是否在允许的网络段内
      return this.isIPInAllowedNetworks(sourceIP, tenantNetworkConfig.allowedNetworks);
      
    } catch (error) {
      console.error(`网络隔离验证失败: ${error}`);
      return false;
    }
  }

  private async getTenantNetworkConfig(tenantId: string): Promise<any> {
    // 模拟获取租户网络配置
    return {
      allowedNetworks: ['192.168.1.0/24', '10.0.0.0/8']
    };
  }

  private isIPInAllowedNetworks(ip: string, networks: string[]): boolean {
    // 简化的IP网络匹配逻辑
    for (const network of networks) {
      if (ip.startsWith(network.split('/')[0].substring(0, network.indexOf('/')))) {
        return true;
      }
    }
    return false;
  }
}

/**
 * 资源配额管理器
 */
export class ResourceQuotaManager {
  private quotas: Map<string, ResourceQuotas> = new Map();
  private usage: Map<string, Map<string, number>> = new Map();

  /**
   * 设置租户配额
   */
  setTenantQuotas(tenantId: string, quotas: ResourceQuotas): void {
    this.quotas.set(tenantId, quotas);
    
    // 初始化使用量跟踪
    if (!this.usage.has(tenantId)) {
      this.usage.set(tenantId, new Map());
    }
  }

  /**
   * 检查资源配额
   */
  checkQuota(tenantId: string, resource: string, amount: number = 1): boolean {
    const tenantQuotas = this.quotas.get(tenantId);
    if (!tenantQuotas) {
      return false;
    }

    const currentUsage = this.getCurrentUsage(tenantId, resource);
    const quota = (tenantQuotas as any)[resource];
    
    if (quota === undefined) {
      return true; // 没有限制
    }

    return currentUsage + amount <= quota;
  }

  /**
   * 消费资源
   */
  consumeResource(tenantId: string, resource: string, amount: number = 1): boolean {
    if (!this.checkQuota(tenantId, resource, amount)) {
      return false;
    }

    const tenantUsage = this.usage.get(tenantId)!;
    const currentUsage = tenantUsage.get(resource) || 0;
    tenantUsage.set(resource, currentUsage + amount);

    return true;
  }

  /**
   * 释放资源
   */
  releaseResource(tenantId: string, resource: string, amount: number = 1): void {
    const tenantUsage = this.usage.get(tenantId);
    if (!tenantUsage) return;

    const currentUsage = tenantUsage.get(resource) || 0;
    tenantUsage.set(resource, Math.max(0, currentUsage - amount));
  }

  /**
   * 获取当前使用量
   */
  getCurrentUsage(tenantId: string, resource: string): number {
    const tenantUsage = this.usage.get(tenantId);
    return tenantUsage ? (tenantUsage.get(resource) || 0) : 0;
  }

  /**
   * 获取资源使用统计
   */
  getResourceUsage(tenantId: string): ResourceUsage[] {
    const tenantQuotas = this.quotas.get(tenantId);
    const tenantUsage = this.usage.get(tenantId);
    
    if (!tenantQuotas || !tenantUsage) {
      return [];
    }

    const usage: ResourceUsage[] = [];
    
    for (const [resource, limit] of Object.entries(tenantQuotas)) {
      const used = tenantUsage.get(resource) || 0;
      
      usage.push({
        tenantId,
        resource,
        used,
        limit,
        percentage: limit > 0 ? (used / limit) * 100 : 0,
        timestamp: new Date()
      });
    }

    return usage;
  }

  /**
   * 重置资源使用量
   */
  resetUsage(tenantId: string, resource?: string): void {
    const tenantUsage = this.usage.get(tenantId);
    if (!tenantUsage) return;

    if (resource) {
      tenantUsage.set(resource, 0);
    } else {
      tenantUsage.clear();
    }
  }

  /**
   * 获取超配额的租户
   */
  getOverQuotaTenants(): string[] {
    const overQuotaTenants: string[] = [];

    for (const [tenantId] of this.quotas) {
      const usage = this.getResourceUsage(tenantId);
      const hasOverQuota = usage.some(u => u.percentage >= 100);
      
      if (hasOverQuota) {
        overQuotaTenants.push(tenantId);
      }
    }

    return overQuotaTenants;
  }
}

/**
 * 权限管理器
 */
export class PermissionManager {
  private rolePermissions: Map<UserRole, Permission[]> = new Map();

  constructor() {
    this.initializeDefaultRolePermissions();
  }

  /**
   * 初始化默认角色权限
   */
  private initializeDefaultRolePermissions(): void {
    // 租户管理员权限
    this.rolePermissions.set(UserRole.TENANT_ADMIN, [
      { resource: '*', actions: ['*'] }
    ]);

    // 操作员权限
    this.rolePermissions.set(UserRole.OPERATOR, [
      { resource: 'devices', actions: ['read', 'write', 'delete'] },
      { resource: 'alerts', actions: ['read', 'write', 'acknowledge'] },
      { resource: 'dashboards', actions: ['read', 'write'] },
      { resource: 'reports', actions: ['read', 'generate'] }
    ]);

    // 查看者权限
    this.rolePermissions.set(UserRole.VIEWER, [
      { resource: 'devices', actions: ['read'] },
      { resource: 'alerts', actions: ['read'] },
      { resource: 'dashboards', actions: ['read'] },
      { resource: 'reports', actions: ['read'] }
    ]);
  }

  /**
   * 检查用户权限
   */
  checkPermission(user: User, resource: string, action: string): boolean {
    // 检查用户特定权限
    for (const permission of user.permissions) {
      if (this.matchesPermission(permission, resource, action)) {
        return true;
      }
    }

    // 检查角色权限
    const rolePermissions = this.rolePermissions.get(user.role);
    if (rolePermissions) {
      for (const permission of rolePermissions) {
        if (this.matchesPermission(permission, resource, action)) {
          return true;
        }
      }
    }

    return false;
  }

  /**
   * 匹配权限
   */
  private matchesPermission(permission: Permission, resource: string, action: string): boolean {
    // 检查资源匹配
    if (permission.resource !== '*' && permission.resource !== resource) {
      return false;
    }

    // 检查动作匹配
    if (!permission.actions.includes('*') && !permission.actions.includes(action)) {
      return false;
    }

    // 检查条件（如果有）
    if (permission.conditions) {
      // 这里可以实现更复杂的条件检查逻辑
      return true;
    }

    return true;
  }

  /**
   * 获取用户可访问的资源
   */
  getUserAccessibleResources(user: User): string[] {
    const resources = new Set<string>();

    // 添加用户特定权限的资源
    for (const permission of user.permissions) {
      if (permission.resource !== '*') {
        resources.add(permission.resource);
      }
    }

    // 添加角色权限的资源
    const rolePermissions = this.rolePermissions.get(user.role);
    if (rolePermissions) {
      for (const permission of rolePermissions) {
        if (permission.resource !== '*') {
          resources.add(permission.resource);
        }
      }
    }

    return Array.from(resources);
  }

  /**
   * 添加角色权限
   */
  addRolePermission(role: UserRole, permission: Permission): void {
    const existing = this.rolePermissions.get(role) || [];
    existing.push(permission);
    this.rolePermissions.set(role, existing);
  }

  /**
   * 移除角色权限
   */
  removeRolePermission(role: UserRole, resource: string, action?: string): void {
    const permissions = this.rolePermissions.get(role) || [];
    
    const filtered = permissions.filter(p => {
      if (p.resource !== resource) return true;
      if (action && !p.actions.includes(action)) return true;
      return false;
    });
    
    this.rolePermissions.set(role, filtered);
  }
}

/**
 * 多租户管理器
 */
export class MultiTenantManager extends EventEmitter {
  private tenants: Map<string, Tenant> = new Map();
  private users: Map<string, User> = new Map();
  private isolationManager: TenantIsolationManager;
  private quotaManager: ResourceQuotaManager;
  private permissionManager: PermissionManager;
  private metricsCollectionTimer?: NodeJS.Timeout;

  constructor(isolationConfig: IsolationConfig) {
    super();
    
    this.isolationManager = new TenantIsolationManager(isolationConfig);
    this.quotaManager = new ResourceQuotaManager();
    this.permissionManager = new PermissionManager();
    
    this.startMetricsCollection();
  }

  /**
   * 创建租户
   */
  async createTenant(tenantData: Partial<Tenant>): Promise<Tenant> {
    try {
      const tenantId = tenantData.id || this.generateTenantId();
      
      const tenant: Tenant = {
        id: tenantId,
        name: tenantData.name || '',
        description: tenantData.description || '',
        domain: tenantData.domain || '',
        status: TenantStatus.PENDING,
        tier: tenantData.tier || TenantTier.BASIC,
        settings: tenantData.settings || this.getDefaultTenantSettings(),
        quotas: tenantData.quotas || this.getDefaultQuotas(tenantData.tier || TenantTier.BASIC),
        billing: tenantData.billing || this.getDefaultBillingInfo(),
        createdAt: new Date(),
        updatedAt: new Date(),
        metadata: tenantData.metadata || {}
      };

      // 验证租户数据
      const validatedTenant = tenantSchema.parse(tenant);
      
      // 创建租户隔离环境
      await this.isolationManager.createTenantSchema(tenantId);
      
      // 设置资源配额
      this.quotaManager.setTenantQuotas(tenantId, validatedTenant.quotas);
      
      // 存储租户
      this.tenants.set(tenantId, validatedTenant);
      
      // 激活租户
      validatedTenant.status = TenantStatus.ACTIVE;
      
      this.emit('tenant:created', validatedTenant);
      
      return validatedTenant;
      
    } catch (error) {
      this.emit('tenant:creation_failed', { tenantData, error });
      throw error;
    }
  }

  /**
   * 更新租户
   */
  async updateTenant(tenantId: string, updates: Partial<Tenant>): Promise<Tenant | null> {
    const tenant = this.tenants.get(tenantId);
    if (!tenant) {
      return null;
    }

    try {
      const updatedTenant = {
        ...tenant,
        ...updates,
        id: tenantId, // 确保ID不被覆盖
        updatedAt: new Date()
      };

      // 验证更新后的租户数据
      const validatedTenant = tenantSchema.parse(updatedTenant);
      
      // 更新资源配额（如果配额有变化）
      if (updates.quotas) {
        this.quotaManager.setTenantQuotas(tenantId, validatedTenant.quotas);
      }
      
      this.tenants.set(tenantId, validatedTenant);
      
      this.emit('tenant:updated', validatedTenant);
      
      return validatedTenant;
      
    } catch (error) {
      this.emit('tenant:update_failed', { tenantId, updates, error });
      throw error;
    }
  }

  /**
   * 删除租户
   */
  async deleteTenant(tenantId: string): Promise<boolean> {
    const tenant = this.tenants.get(tenantId);
    if (!tenant) {
      return false;
    }

    try {
      // 删除租户的所有用户
      const tenantUsers = Array.from(this.users.values()).filter(u => u.tenantId === tenantId);
      for (const user of tenantUsers) {
        this.users.delete(user.id);
      }
      
      // 删除租户隔离环境
      await this.isolationManager.deleteTenantSchema(tenantId);
      
      // 删除租户
      this.tenants.delete(tenantId);
      
      this.emit('tenant:deleted', { tenantId, tenant });
      
      return true;
      
    } catch (error) {
      this.emit('tenant:deletion_failed', { tenantId, error });
      throw error;
    }
  }

  /**
   * 获取租户
   */
  getTenant(tenantId: string): Tenant | null {
    return this.tenants.get(tenantId) || null;
  }

  /**
   * 获取所有租户
   */
  getAllTenants(): Tenant[] {
    return Array.from(this.tenants.values());
  }

  /**
   * 暂停租户
   */
  suspendTenant(tenantId: string, reason: string): boolean {
    const tenant = this.tenants.get(tenantId);
    if (!tenant) {
      return false;
    }

    tenant.status = TenantStatus.SUSPENDED;
    tenant.updatedAt = new Date();
    tenant.metadata.suspensionReason = reason;
    
    this.emit('tenant:suspended', { tenantId, reason });
    
    return true;
  }

  /**
   * 恢复租户
   */
  resumeTenant(tenantId: string): boolean {
    const tenant = this.tenants.get(tenantId);
    if (!tenant) {
      return false;
    }

    tenant.status = TenantStatus.ACTIVE;
    tenant.updatedAt = new Date();
    delete tenant.metadata.suspensionReason;
    
    this.emit('tenant:resumed', { tenantId });
    
    return true;
  }

  /**
   * 创建用户
   */
  async createUser(userData: Partial<User>): Promise<User> {
    try {
      const userId = userData.id || this.generateUserId();
      
      const user: User = {
        id: userId,
        tenantId: userData.tenantId || '',
        username: userData.username || '',
        email: userData.email || '',
        firstName: userData.firstName || '',
        lastName: userData.lastName || '',
        role: userData.role || UserRole.VIEWER,
        permissions: userData.permissions || [],
        status: UserStatus.ACTIVE,
        lastLoginAt: undefined,
        createdAt: new Date(),
        updatedAt: new Date(),
        metadata: userData.metadata || {}
      };

      // 验证用户数据
      const validatedUser = userSchema.parse(user);
      
      // 检查租户是否存在
      const tenant = this.tenants.get(validatedUser.tenantId);
      if (!tenant) {
        throw new Error('租户不存在');
      }

      // 检查用户配额
      if (!this.quotaManager.checkQuota(validatedUser.tenantId, 'users')) {
        throw new Error('用户数量已达到配额限制');
      }

      // 消费用户配额
      this.quotaManager.consumeResource(validatedUser.tenantId, 'users');
      
      // 存储用户
      this.users.set(userId, validatedUser);
      
      this.emit('user:created', validatedUser);
      
      return validatedUser;
      
    } catch (error) {
      this.emit('user:creation_failed', { userData, error });
      throw error;
    }
  }

  /**
   * 更新用户
   */
  async updateUser(userId: string, updates: Partial<User>): Promise<User | null> {
    const user = this.users.get(userId);
    if (!user) {
      return null;
    }

    try {
      const updatedUser = {
        ...user,
        ...updates,
        id: userId, // 确保ID不被覆盖
        updatedAt: new Date()
      };

      // 验证更新后的用户数据
      const validatedUser = userSchema.parse(updatedUser);
      
      this.users.set(userId, validatedUser);
      
      this.emit('user:updated', validatedUser);
      
      return validatedUser;
      
    } catch (error) {
      this.emit('user:update_failed', { userId, updates, error });
      throw error;
    }
  }

  /**
   * 删除用户
   */
  deleteUser(userId: string): boolean {
    const user = this.users.get(userId);
    if (!user) {
      return false;
    }

    // 释放用户配额
    this.quotaManager.releaseResource(user.tenantId, 'users');
    
    this.users.delete(userId);
    
    this.emit('user:deleted', { userId, user });
    
    return true;
  }

  /**
   * 获取用户
   */
  getUser(userId: string): User | null {
    return this.users.get(userId) || null;
  }

  /**
   * 获取租户用户
   */
  getTenantUsers(tenantId: string): User[] {
    return Array.from(this.users.values()).filter(u => u.tenantId === tenantId);
  }

  /**
   * 检查用户权限
   */
  checkUserPermission(userId: string, resource: string, action: string): boolean {
    const user = this.users.get(userId);
    if (!user || user.status !== UserStatus.ACTIVE) {
      return false;
    }

    const tenant = this.tenants.get(user.tenantId);
    if (!tenant || tenant.status !== TenantStatus.ACTIVE) {
      return false;
    }

    return this.permissionManager.checkPermission(user, resource, action);
  }

  /**
   * 检查资源配额
   */
  checkResourceQuota(tenantId: string, resource: string, amount: number = 1): boolean {
    return this.quotaManager.checkQuota(tenantId, resource, amount);
  }

  /**
   * 消费资源
   */
  consumeResource(tenantId: string, resource: string, amount: number = 1): boolean {
    return this.quotaManager.consumeResource(tenantId, resource, amount);
  }

  /**
   * 获取租户资源使用情况
   */
  getTenantResourceUsage(tenantId: string): ResourceUsage[] {
    return this.quotaManager.getResourceUsage(tenantId);
  }

  /**
   * 生成租户指标
   */
  async generateTenantMetrics(tenantId: string, period: string): Promise<TenantMetrics> {
    const tenant = this.tenants.get(tenantId);
    if (!tenant) {
      throw new Error('租户不存在');
    }

    const tenantUsers = this.getTenantUsers(tenantId);
    const activeUsers = tenantUsers.filter(u => u.status === UserStatus.ACTIVE).length;
    
    // 模拟指标数据
    const metrics: TenantMetrics = {
      tenantId,
      period,
      metrics: {
        activeUsers,
        deviceCount: this.quotaManager.getCurrentUsage(tenantId, 'devices'),
        alertCount: this.quotaManager.getCurrentUsage(tenantId, 'alertRules'),
        dataVolume: this.quotaManager.getCurrentUsage(tenantId, 'storage'),
        apiCalls: this.quotaManager.getCurrentUsage(tenantId, 'apiCalls'),
        uptime: 99.9,
        responseTime: 150
      },
      generatedAt: new Date()
    };

    this.emit('metrics:generated', metrics);

    return metrics;
  }

  /**
   * 获取租户统计信息
   */
  getTenantStats(): Record<string, any> {
    const tenants = Array.from(this.tenants.values());
    const users = Array.from(this.users.values());

    return {
      totalTenants: tenants.length,
      activeTenants: tenants.filter(t => t.status === TenantStatus.ACTIVE).length,
      totalUsers: users.length,
      activeUsers: users.filter(u => u.status === UserStatus.ACTIVE).length,
      tenantsByTier: {
        basic: tenants.filter(t => t.tier === TenantTier.BASIC).length,
        professional: tenants.filter(t => t.tier === TenantTier.PROFESSIONAL).length,
        enterprise: tenants.filter(t => t.tier === TenantTier.ENTERPRISE).length,
        custom: tenants.filter(t => t.tier === TenantTier.CUSTOM).length
      },
      overQuotaTenants: this.quotaManager.getOverQuotaTenants().length
    };
  }

  // 私有方法

  private generateTenantId(): string {
    return `tenant_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateUserId(): string {
    return `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private getDefaultTenantSettings(): TenantSettings {
    return {
      timezone: 'UTC',
      locale: 'en-US',
      theme: 'light',
      notifications: {
        enabled: true,
        channels: ['email'],
        alertThresholds: {
          critical: 0,
          high: 5,
          medium: 10
        },
        escalationRules: []
      },
      dataRetention: {
        metrics: 90,
        logs: 30,
        alerts: 365,
        reports: 180
      },
      integrations: {
        webhooks: [],
        apiKeys: [],
        ssoEnabled: false
      },
      security: {
        enforceSSL: true,
        ipWhitelist: [],
        sessionTimeout: 60,
        passwordPolicy: {
          minLength: 8,
          requireUppercase: true,
          requireLowercase: true,
          requireNumbers: true,
          requireSpecialChars: false,
          expirationDays: 90
        },
        mfaRequired: false
      }
    };
  }

  private getDefaultQuotas(tier: TenantTier): ResourceQuotas {
    const quotasByTier: Record<TenantTier, ResourceQuotas> = {
      [TenantTier.BASIC]: {
        devices: 10,
        users: 5,
        alertRules: 20,
        dashboards: 5,
        storage: 1024, // 1GB
        apiCalls: 1000,
        dataPoints: 10000,
        exportJobs: 5
      },
      [TenantTier.PROFESSIONAL]: {
        devices: 100,
        users: 25,
        alertRules: 100,
        dashboards: 25,
        storage: 10240, // 10GB
        apiCalls: 10000,
        dataPoints: 100000,
        exportJobs: 50
      },
      [TenantTier.ENTERPRISE]: {
        devices: 1000,
        users: 100,
        alertRules: 500,
        dashboards: 100,
        storage: 102400, // 100GB
        apiCalls: 100000,
        dataPoints: 1000000,
        exportJobs: 500
      },
      [TenantTier.CUSTOM]: {
        devices: -1, // 无限制
        users: -1,
        alertRules: -1,
        dashboards: -1,
        storage: -1,
        apiCalls: -1,
        dataPoints: -1,
        exportJobs: -1
      }
    };

    return quotasByTier[tier];
  }

  private getDefaultBillingInfo(): BillingInfo {
    return {
      plan: 'basic',
      billingCycle: 'monthly',
      amount: 0,
      currency: 'USD',
      nextBillingDate: new Date(),
      paymentMethod: 'none',
      invoiceEmail: ''
    };
  }

  private startMetricsCollection(): void {
    // 每小时收集一次指标
    this.metricsCollectionTimer = setInterval(async () => {
      try {
        for (const tenantId of this.tenants.keys()) {
          await this.generateTenantMetrics(tenantId, 'hourly');
        }
      } catch (error) {
        console.error('指标收集失败:', error);
      }
    }, 3600000);
  }

  /**
   * 关闭多租户管理器
   */
  close(): void {
    if (this.metricsCollectionTimer) {
      clearInterval(this.metricsCollectionTimer);
      this.metricsCollectionTimer = undefined;
    }
    
    this.emit('manager:closed');
  }
}

// 默认实例
export const multiTenantManager = new MultiTenantManager({
  databaseSchema: true,
  dataEncryption: true,
  networkSegmentation: false,
  resourceLimits: true,
  auditLogging: true
});

export default MultiTenantManager;