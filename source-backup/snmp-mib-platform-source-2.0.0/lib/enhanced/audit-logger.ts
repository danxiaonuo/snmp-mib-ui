/**
 * 增强审计日志系统
 * 完整操作审计、合规性报告、安全事件跟踪
 * 
 * @author SNMP Platform Team
 * @version 1.0.0
 * @date 2024-12-18
 */

import { EventEmitter } from 'events';
import { z } from 'zod';
import crypto from 'crypto';

// 基础类型定义
export interface AuditEvent {
  id: string;
  timestamp: Date;
  eventType: AuditEventType;
  category: AuditCategory;
  severity: AuditSeverity;
  action: string;
  resource: string;
  resourceId?: string;
  actor: ActorInfo;
  target?: TargetInfo;
  result: AuditResult;
  details: AuditDetails;
  context: AuditContext;
  metadata: Record<string, any>;
  checksum: string;
  version: string;
}

export enum AuditEventType {
  AUTHENTICATION = 'authentication',
  AUTHORIZATION = 'authorization',
  DATA_ACCESS = 'data_access',
  DATA_MODIFICATION = 'data_modification',
  CONFIGURATION = 'configuration',
  SYSTEM_EVENT = 'system_event',
  SECURITY_EVENT = 'security_event',
  COMPLIANCE_EVENT = 'compliance_event',
  ADMIN_ACTION = 'admin_action',
  ERROR_EVENT = 'error_event'
}

export enum AuditCategory {
  USER_MANAGEMENT = 'user_management',
  DEVICE_MANAGEMENT = 'device_management',
  ALERT_MANAGEMENT = 'alert_management',
  CONFIGURATION_MANAGEMENT = 'configuration_management',
  MONITORING = 'monitoring',
  REPORTING = 'reporting',
  SECURITY = 'security',
  SYSTEM = 'system',
  API = 'api',
  BACKUP = 'backup'
}

export enum AuditSeverity {
  LOW = 1,
  MEDIUM = 2,
  HIGH = 3,
  CRITICAL = 4
}

export enum AuditResult {
  SUCCESS = 'success',
  FAILURE = 'failure',
  PARTIAL = 'partial',
  ERROR = 'error',
  BLOCKED = 'blocked',
  TIMEOUT = 'timeout'
}

export interface ActorInfo {
  id: string;
  type: 'user' | 'system' | 'service' | 'api_key';
  name: string;
  email?: string;
  role?: string;
  tenantId?: string;
  sessionId?: string;
  impersonating?: string;
}

export interface TargetInfo {
  id: string;
  type: string;
  name: string;
  attributes?: Record<string, any>;
}

export interface AuditDetails {
  description: string;
  changes?: ChangeRecord[];
  parameters?: Record<string, any>;
  response?: any;
  errorCode?: string;
  errorMessage?: string;
  duration?: number;
  bytesSent?: number;
  bytesReceived?: number;
}

export interface ChangeRecord {
  field: string;
  oldValue: any;
  newValue: any;
  changeType: 'create' | 'update' | 'delete';
}

export interface AuditContext {
  requestId: string;
  sessionId?: string;
  clientIP: string;
  userAgent: string;
  httpMethod?: string;
  httpPath?: string;
  httpStatus?: number;
  referer?: string;
  deviceFingerprint?: string;
  geoLocation?: GeoLocation;
  riskScore?: number;
}

export interface GeoLocation {
  country: string;
  region: string;
  city: string;
  latitude?: number;
  longitude?: number;
  timezone?: string;
}

export interface AuditFilter {
  startDate?: Date;
  endDate?: Date;
  eventTypes?: AuditEventType[];
  categories?: AuditCategory[];
  severities?: AuditSeverity[];
  actors?: string[];
  resources?: string[];
  results?: AuditResult[];
  tenantId?: string;
  riskScoreMin?: number;
  riskScoreMax?: number;
  searchText?: string;
}

export interface AuditReport {
  id: string;
  name: string;
  description: string;
  type: ReportType;
  period: ReportPeriod;
  filter: AuditFilter;
  data: AuditReportData;
  generatedAt: Date;
  generatedBy: string;
  format: ReportFormat;
}

export enum ReportType {
  SUMMARY = 'summary',
  DETAILED = 'detailed',
  COMPLIANCE = 'compliance',
  SECURITY = 'security',
  USER_ACTIVITY = 'user_activity',
  SYSTEM_ACTIVITY = 'system_activity',
  RISK_ANALYSIS = 'risk_analysis'
}

export enum ReportPeriod {
  HOURLY = 'hourly',
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  QUARTERLY = 'quarterly',
  YEARLY = 'yearly',
  CUSTOM = 'custom'
}

export enum ReportFormat {
  JSON = 'json',
  CSV = 'csv',
  PDF = 'pdf',
  HTML = 'html',
  XLSX = 'xlsx'
}

export interface AuditReportData {
  summary: AuditSummary;
  events: AuditEvent[];
  statistics: AuditStatistics;
  trends: AuditTrend[];
  risks: RiskAssessment[];
  compliance: ComplianceStatus;
}

export interface AuditSummary {
  totalEvents: number;
  eventsByType: Record<AuditEventType, number>;
  eventsByCategory: Record<AuditCategory, number>;
  eventsBySeverity: Record<AuditSeverity, number>;
  eventsByResult: Record<AuditResult, number>;
  uniqueActors: number;
  uniqueResources: number;
  timespan: {
    start: Date;
    end: Date;
  };
}

export interface AuditStatistics {
  averageEventsPerDay: number;
  peakHours: number[];
  topActors: { actor: string; count: number }[];
  topResources: { resource: string; count: number }[];
  topActions: { action: string; count: number }[];
  errorRate: number;
  securityIncidents: number;
  complianceViolations: number;
}

export interface AuditTrend {
  date: Date;
  eventCount: number;
  errorCount: number;
  riskScore: number;
  categories: Record<AuditCategory, number>;
}

export interface RiskAssessment {
  eventId: string;
  riskScore: number;
  riskFactors: RiskFactor[];
  recommendation: string;
  mitigation?: string;
}

export interface RiskFactor {
  type: string;
  description: string;
  weight: number;
  score: number;
}

export interface ComplianceStatus {
  standards: ComplianceStandard[];
  overallScore: number;
  violations: ComplianceViolation[];
  recommendations: string[];
}

export interface ComplianceStandard {
  name: string;
  version: string;
  score: number;
  requirements: ComplianceRequirement[];
}

export interface ComplianceRequirement {
  id: string;
  description: string;
  status: 'compliant' | 'non_compliant' | 'partial' | 'not_applicable';
  evidence: string[];
  gaps: string[];
}

export interface ComplianceViolation {
  eventId: string;
  standard: string;
  requirement: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  remediation: string;
}

export interface AuditConfig {
  retention: RetentionPolicy;
  encryption: EncryptionConfig;
  integrity: IntegrityConfig;
  compliance: ComplianceConfig;
  alerting: AlertingConfig;
  storage: StorageConfig;
}

export interface RetentionPolicy {
  defaultDays: number;
  policies: Record<AuditCategory, number>;
  archiveAfterDays: number;
  compressionEnabled: boolean;
}

export interface EncryptionConfig {
  enabled: boolean;
  algorithm: string;
  keyRotationDays: number;
  atRest: boolean;
  inTransit: boolean;
}

export interface IntegrityConfig {
  enabled: boolean;
  checksumAlgorithm: string;
  tamperDetection: boolean;
  digitalSignatures: boolean;
}

export interface ComplianceConfig {
  standards: string[];
  autoReporting: boolean;
  reportingInterval: string;
  notificationEmails: string[];
}

export interface AlertingConfig {
  enabled: boolean;
  realTimeAlerts: boolean;
  thresholds: AlertThreshold[];
  webhooks: string[];
}

export interface AlertThreshold {
  condition: string;
  value: number;
  severity: AuditSeverity;
  action: string;
}

export interface StorageConfig {
  backend: 'database' | 'file' | 'elasticsearch' | 'splunk';
  batchSize: number;
  flushInterval: number;
  compression: boolean;
  sharding: boolean;
}

// 验证模式
const auditEventSchema = z.object({
  id: z.string().min(1),
  timestamp: z.date(),
  eventType: z.nativeEnum(AuditEventType),
  category: z.nativeEnum(AuditCategory),
  severity: z.nativeEnum(AuditSeverity),
  action: z.string().min(1),
  resource: z.string().min(1),
  resourceId: z.string().optional(),
  actor: z.object({
    id: z.string().min(1),
    type: z.enum(['user', 'system', 'service', 'api_key']),
    name: z.string().min(1),
    email: z.string().email().optional(),
    role: z.string().optional(),
    tenantId: z.string().optional(),
    sessionId: z.string().optional(),
    impersonating: z.string().optional()
  }),
  target: z.object({
    id: z.string().min(1),
    type: z.string().min(1),
    name: z.string().min(1),
    attributes: z.record(z.any()).optional()
  }).optional(),
  result: z.nativeEnum(AuditResult),
  details: z.object({
    description: z.string().min(1),
    changes: z.array(z.object({
      field: z.string(),
      oldValue: z.any(),
      newValue: z.any(),
      changeType: z.enum(['create', 'update', 'delete'])
    })).optional(),
    parameters: z.record(z.any()).optional(),
    response: z.any().optional(),
    errorCode: z.string().optional(),
    errorMessage: z.string().optional(),
    duration: z.number().optional(),
    bytesSent: z.number().optional(),
    bytesReceived: z.number().optional()
  }),
  context: z.object({
    requestId: z.string().min(1),
    sessionId: z.string().optional(),
    clientIP: z.string().min(1),
    userAgent: z.string().min(1),
    httpMethod: z.string().optional(),
    httpPath: z.string().optional(),
    httpStatus: z.number().optional(),
    referer: z.string().optional(),
    deviceFingerprint: z.string().optional(),
    geoLocation: z.object({
      country: z.string(),
      region: z.string(),
      city: z.string(),
      latitude: z.number().optional(),
      longitude: z.number().optional(),
      timezone: z.string().optional()
    }).optional(),
    riskScore: z.number().min(0).max(100).optional()
  }),
  metadata: z.record(z.any()),
  checksum: z.string().min(1),
  version: z.string().min(1)
});

/**
 * 风险评估引擎
 */
export class RiskAssessmentEngine {
  private riskFactors: Map<string, RiskFactor> = new Map();

  constructor() {
    this.initializeRiskFactors();
  }

  /**
   * 初始化风险因子
   */
  private initializeRiskFactors(): void {
    // 登录风险因子
    this.addRiskFactor('failed_login', {
      type: 'authentication',
      description: '登录失败',
      weight: 0.3,
      score: 20
    });

    this.addRiskFactor('unusual_location', {
      type: 'location',
      description: '异常登录位置',
      weight: 0.4,
      score: 30
    });

    this.addRiskFactor('off_hours_access', {
      type: 'timing',
      description: '非工作时间访问',
      weight: 0.2,
      score: 15
    });

    this.addRiskFactor('privilege_escalation', {
      type: 'authorization',
      description: '权限提升',
      weight: 0.6,
      score: 40
    });

    this.addRiskFactor('bulk_data_access', {
      type: 'data_access',
      description: '批量数据访问',
      weight: 0.5,
      score: 35
    });

    this.addRiskFactor('configuration_change', {
      type: 'configuration',
      description: '配置变更',
      weight: 0.4,
      score: 25
    });

    this.addRiskFactor('admin_action', {
      type: 'admin',
      description: '管理员操作',
      weight: 0.3,
      score: 20
    });
  }

  /**
   * 添加风险因子
   */
  addRiskFactor(id: string, factor: RiskFactor): void {
    this.riskFactors.set(id, factor);
  }

  /**
   * 评估事件风险
   */
  assessRisk(event: AuditEvent): RiskAssessment {
    const detectedFactors: RiskFactor[] = [];
    let totalScore = 0;

    // 检测各种风险因子
    this.detectFailedLogin(event, detectedFactors);
    this.detectUnusualLocation(event, detectedFactors);
    this.detectOffHoursAccess(event, detectedFactors);
    this.detectPrivilegeEscalation(event, detectedFactors);
    this.detectBulkDataAccess(event, detectedFactors);
    this.detectConfigurationChanges(event, detectedFactors);
    this.detectAdminActions(event, detectedFactors);

    // 计算总风险分数
    for (const factor of detectedFactors) {
      totalScore += factor.score * factor.weight;
    }

    // 限制分数范围
    const riskScore = Math.min(100, Math.max(0, totalScore));

    return {
      eventId: event.id,
      riskScore,
      riskFactors: detectedFactors,
      recommendation: this.generateRecommendation(riskScore, detectedFactors),
      mitigation: this.generateMitigation(riskScore, detectedFactors)
    };
  }

  private detectFailedLogin(event: AuditEvent, factors: RiskFactor[]): void {
    if (event.eventType === AuditEventType.AUTHENTICATION && 
        event.result === AuditResult.FAILURE) {
      const factor = this.riskFactors.get('failed_login');
      if (factor) factors.push(factor);
    }
  }

  private detectUnusualLocation(event: AuditEvent, factors: RiskFactor[]): void {
    if (event.context.geoLocation) {
      // 简化的异常位置检测逻辑
      const unusualCountries = ['CN', 'RU', 'KP', 'IR'];
      if (unusualCountries.includes(event.context.geoLocation.country)) {
        const factor = this.riskFactors.get('unusual_location');
        if (factor) factors.push(factor);
      }
    }
  }

  private detectOffHoursAccess(event: AuditEvent, factors: RiskFactor[]): void {
    const hour = event.timestamp.getHours();
    if (hour < 6 || hour > 22) { // 非工作时间
      const factor = this.riskFactors.get('off_hours_access');
      if (factor) factors.push(factor);
    }
  }

  private detectPrivilegeEscalation(event: AuditEvent, factors: RiskFactor[]): void {
    if (event.action.includes('privilege') || 
        event.action.includes('role') || 
        event.action.includes('permission')) {
      const factor = this.riskFactors.get('privilege_escalation');
      if (factor) factors.push(factor);
    }
  }

  private detectBulkDataAccess(event: AuditEvent, factors: RiskFactor[]): void {
    if (event.details.bytesReceived && event.details.bytesReceived > 1000000) { // > 1MB
      const factor = this.riskFactors.get('bulk_data_access');
      if (factor) factors.push(factor);
    }
  }

  private detectConfigurationChanges(event: AuditEvent, factors: RiskFactor[]): void {
    if (event.category === AuditCategory.CONFIGURATION_MANAGEMENT) {
      const factor = this.riskFactors.get('configuration_change');
      if (factor) factors.push(factor);
    }
  }

  private detectAdminActions(event: AuditEvent, factors: RiskFactor[]): void {
    if (event.actor.role === 'admin' || event.actor.role === 'super_admin') {
      const factor = this.riskFactors.get('admin_action');
      if (factor) factors.push(factor);
    }
  }

  private generateRecommendation(score: number, factors: RiskFactor[]): string {
    if (score >= 80) {
      return '高风险事件，建议立即调查并采取安全措施';
    } else if (score >= 60) {
      return '中等风险事件，建议加强监控';
    } else if (score >= 40) {
      return '低风险事件，记录备案';
    } else {
      return '正常事件';
    }
  }

  private generateMitigation(score: number, factors: RiskFactor[]): string {
    const mitigations: string[] = [];

    if (factors.some(f => f.type === 'authentication')) {
      mitigations.push('加强身份验证，启用多因子认证');
    }

    if (factors.some(f => f.type === 'location')) {
      mitigations.push('配置地理位置限制，阻止异常位置访问');
    }

    if (factors.some(f => f.type === 'authorization')) {
      mitigations.push('审查权限分配，实施最小权限原则');
    }

    if (factors.some(f => f.type === 'data_access')) {
      mitigations.push('实施数据丢失防护，监控大量数据访问');
    }

    return mitigations.join('; ') || '无需特殊缓解措施';
  }
}

/**
 * 合规性管理器
 */
export class ComplianceManager {
  private standards: Map<string, ComplianceStandard> = new Map();

  constructor() {
    this.initializeStandards();
  }

  /**
   * 初始化合规标准
   */
  private initializeStandards(): void {
    // SOX合规
    this.addStandard('SOX', '2002', [
      {
        id: 'SOX-302',
        description: '财务报告的内部控制',
        status: 'compliant',
        evidence: ['审计日志完整性', '访问控制记录'],
        gaps: []
      },
      {
        id: 'SOX-404',
        description: '内部控制评估',
        status: 'compliant',
        evidence: ['定期审计报告', '控制测试记录'],
        gaps: []
      }
    ]);

    // GDPR合规
    this.addStandard('GDPR', '2018', [
      {
        id: 'Article-30',
        description: '处理活动记录',
        status: 'compliant',
        evidence: ['详细审计日志', '数据处理记录'],
        gaps: []
      },
      {
        id: 'Article-32',
        description: '处理安全',
        status: 'partial',
        evidence: ['访问控制', '加密保护'],
        gaps: ['需要完善数据匿名化']
      }
    ]);

    // ISO 27001合规
    this.addStandard('ISO27001', '2013', [
      {
        id: 'A.12.4.1',
        description: '事件日志记录',
        status: 'compliant',
        evidence: ['完整事件日志', '日志保护措施'],
        gaps: []
      },
      {
        id: 'A.12.4.3',
        description: '管理员和操作员日志',
        status: 'compliant',
        evidence: ['特权用户活动记录', '操作审计'],
        gaps: []
      }
    ]);
  }

  /**
   * 添加合规标准
   */
  addStandard(name: string, version: string, requirements: ComplianceRequirement[]): void {
    this.standards.set(name, {
      name,
      version,
      score: this.calculateComplianceScore(requirements),
      requirements
    });
  }

  /**
   * 评估合规状态
   */
  assessCompliance(events: AuditEvent[]): ComplianceStatus {
    const violations: ComplianceViolation[] = [];
    const recommendations: string[] = [];

    // 检查各个标准的合规性
    for (const standard of this.standards.values()) {
      const standardViolations = this.checkStandardCompliance(standard, events);
      violations.push(...standardViolations);
    }

    // 生成建议
    if (violations.length > 0) {
      recommendations.push('定期审查和更新合规政策');
      recommendations.push('加强员工合规培训');
      recommendations.push('实施自动化合规监控');
    }

    return {
      standards: Array.from(this.standards.values()),
      overallScore: this.calculateOverallScore(),
      violations,
      recommendations
    };
  }

  private checkStandardCompliance(
    standard: ComplianceStandard, 
    events: AuditEvent[]
  ): ComplianceViolation[] {
    const violations: ComplianceViolation[] = [];

    // 检查是否有违反合规要求的事件
    for (const event of events) {
      if (this.isComplianceViolation(event, standard)) {
        violations.push({
          eventId: event.id,
          standard: standard.name,
          requirement: this.getViolatedRequirement(event, standard),
          severity: this.getViolationSeverity(event),
          description: `违反${standard.name}合规要求: ${event.details.description}`,
          remediation: this.getRemediation(event, standard)
        });
      }
    }

    return violations;
  }

  private isComplianceViolation(event: AuditEvent, standard: ComplianceStandard): boolean {
    // 简化的违规检测逻辑
    if (event.result === AuditResult.FAILURE && event.severity >= AuditSeverity.HIGH) {
      return true;
    }

    if (event.eventType === AuditEventType.SECURITY_EVENT) {
      return true;
    }

    return false;
  }

  private getViolatedRequirement(event: AuditEvent, standard: ComplianceStandard): string {
    // 根据事件类型匹配违反的要求
    switch (event.eventType) {
      case AuditEventType.AUTHENTICATION:
        return standard.requirements.find(r => r.description.includes('访问'))?.id || 'UNKNOWN';
      case AuditEventType.DATA_ACCESS:
        return standard.requirements.find(r => r.description.includes('数据'))?.id || 'UNKNOWN';
      default:
        return standard.requirements[0]?.id || 'UNKNOWN';
    }
  }

  private getViolationSeverity(event: AuditEvent): 'low' | 'medium' | 'high' | 'critical' {
    switch (event.severity) {
      case AuditSeverity.CRITICAL:
        return 'critical';
      case AuditSeverity.HIGH:
        return 'high';
      case AuditSeverity.MEDIUM:
        return 'medium';
      default:
        return 'low';
    }
  }

  private getRemediation(event: AuditEvent, standard: ComplianceStandard): string {
    return `根据${standard.name}标准，建议立即调查此事件并采取相应的纠正措施`;
  }

  private calculateComplianceScore(requirements: ComplianceRequirement[]): number {
    if (requirements.length === 0) return 100;

    const compliantCount = requirements.filter(r => r.status === 'compliant').length;
    const partialCount = requirements.filter(r => r.status === 'partial').length;

    return ((compliantCount + partialCount * 0.5) / requirements.length) * 100;
  }

  private calculateOverallScore(): number {
    const standards = Array.from(this.standards.values());
    if (standards.length === 0) return 100;

    const totalScore = standards.reduce((sum, s) => sum + s.score, 0);
    return totalScore / standards.length;
  }
}

/**
 * 审计存储后端接口
 */
export interface AuditStorage {
  store(event: AuditEvent): Promise<void>;
  storeBatch(events: AuditEvent[]): Promise<void>;
  query(filter: AuditFilter): Promise<AuditEvent[]>;
  count(filter: AuditFilter): Promise<number>;
  delete(eventId: string): Promise<boolean>;
  deleteByFilter(filter: AuditFilter): Promise<number>;
  archive(beforeDate: Date): Promise<number>;
  healthCheck(): Promise<boolean>;
}

/**
 * 数据库审计存储实现
 */
export class DatabaseAuditStorage implements AuditStorage {
  private db: any; // 数据库连接

  constructor(database: any) {
    this.db = database;
  }

  async store(event: AuditEvent): Promise<void> {
    try {
      const sql = `
        INSERT INTO audit_events (
          id, timestamp, event_type, category, severity, action, resource, 
          resource_id, actor, target, result, details, context, metadata, 
          checksum, version
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      await this.db.execute(sql, [
        event.id,
        event.timestamp,
        event.eventType,
        event.category,
        event.severity,
        event.action,
        event.resource,
        event.resourceId,
        JSON.stringify(event.actor),
        JSON.stringify(event.target),
        event.result,
        JSON.stringify(event.details),
        JSON.stringify(event.context),
        JSON.stringify(event.metadata),
        event.checksum,
        event.version
      ]);
    } catch (error) {
      throw new Error(`审计事件存储失败: ${error}`);
    }
  }

  async storeBatch(events: AuditEvent[]): Promise<void> {
    try {
      await this.db.transaction(async (tx: any) => {
        for (const event of events) {
          await this.store(event);
        }
      });
    } catch (error) {
      throw new Error(`批量审计事件存储失败: ${error}`);
    }
  }

  async query(filter: AuditFilter): Promise<AuditEvent[]> {
    try {
      let sql = 'SELECT * FROM audit_events WHERE 1=1';
      const params: any[] = [];

      // 构建查询条件
      if (filter.startDate) {
        sql += ' AND timestamp >= ?';
        params.push(filter.startDate);
      }

      if (filter.endDate) {
        sql += ' AND timestamp <= ?';
        params.push(filter.endDate);
      }

      if (filter.eventTypes && filter.eventTypes.length > 0) {
        sql += ` AND event_type IN (${filter.eventTypes.map(() => '?').join(',')})`;
        params.push(...filter.eventTypes);
      }

      if (filter.actors && filter.actors.length > 0) {
        sql += ` AND JSON_EXTRACT(actor, '$.id') IN (${filter.actors.map(() => '?').join(',')})`;
        params.push(...filter.actors);
      }

      sql += ' ORDER BY timestamp DESC LIMIT 1000';

      const results = await this.db.query(sql, params);
      
      return results.map((row: any) => ({
        ...row,
        actor: JSON.parse(row.actor),
        target: row.target ? JSON.parse(row.target) : undefined,
        details: JSON.parse(row.details),
        context: JSON.parse(row.context),
        metadata: JSON.parse(row.metadata)
      }));
    } catch (error) {
      throw new Error(`审计事件查询失败: ${error}`);
    }
  }

  async count(filter: AuditFilter): Promise<number> {
    // 实现计数查询
    return 0;
  }

  async delete(eventId: string): Promise<boolean> {
    try {
      const result = await this.db.execute(
        'DELETE FROM audit_events WHERE id = ?',
        [eventId]
      );
      return result.affectedRows > 0;
    } catch (error) {
      throw new Error(`审计事件删除失败: ${error}`);
    }
  }

  async deleteByFilter(filter: AuditFilter): Promise<number> {
    // 实现按条件删除
    return 0;
  }

  async archive(beforeDate: Date): Promise<number> {
    // 实现归档功能
    return 0;
  }

  async healthCheck(): Promise<boolean> {
    try {
      await this.db.query('SELECT 1');
      return true;
    } catch {
      return false;
    }
  }
}

/**
 * 增强审计日志系统
 */
export class EnhancedAuditLogger extends EventEmitter {
  private config: AuditConfig;
  private storage: AuditStorage;
  private riskAssessment: RiskAssessmentEngine;
  private complianceManager: ComplianceManager;
  private eventBuffer: AuditEvent[] = [];
  private flushTimer?: NodeJS.Timeout;
  private encryptionKey?: string;

  constructor(config: AuditConfig, storage: AuditStorage) {
    super();
    
    this.config = config;
    this.storage = storage;
    this.riskAssessment = new RiskAssessmentEngine();
    this.complianceManager = new ComplianceManager();
    
    if (config.encryption.enabled) {
      this.initializeEncryption();
    }

    this.startFlushTimer();
  }

  /**
   * 记录审计事件
   */
  async logEvent(eventData: Partial<AuditEvent>): Promise<void> {
    try {
      // 生成完整的审计事件
      const event = await this.createAuditEvent(eventData);
      
      // 验证事件
      const validatedEvent = auditEventSchema.parse(event);
      
      // 风险评估
      if (validatedEvent.context.riskScore === undefined) {
        const riskAssessment = this.riskAssessment.assessRisk(validatedEvent);
        validatedEvent.context.riskScore = riskAssessment.riskScore;
        validatedEvent.metadata.riskAssessment = riskAssessment;
      }

      // 加密敏感数据
      if (this.config.encryption.enabled) {
        await this.encryptSensitiveData(validatedEvent);
      }

      // 添加到缓冲区
      this.eventBuffer.push(validatedEvent);
      
      // 如果缓冲区满了，立即刷新
      if (this.eventBuffer.length >= this.config.storage.batchSize) {
        await this.flushBuffer();
      }

      // 实时告警检查
      if (this.config.alerting.realTimeAlerts) {
        this.checkAlertThresholds(validatedEvent);
      }

      this.emit('event:logged', validatedEvent);
      
    } catch (error) {
      this.emit('event:error', { eventData, error });
      throw error;
    }
  }

  /**
   * 批量记录审计事件
   */
  async logBatch(events: Partial<AuditEvent>[]): Promise<void> {
    for (const eventData of events) {
      await this.logEvent(eventData);
    }
  }

  /**
   * 查询审计事件
   */
  async queryEvents(filter: AuditFilter): Promise<AuditEvent[]> {
    try {
      const events = await this.storage.query(filter);
      
      // 解密敏感数据
      if (this.config.encryption.enabled) {
        for (const event of events) {
          await this.decryptSensitiveData(event);
        }
      }

      return events;
    } catch (error) {
      this.emit('query:error', { filter, error });
      throw error;
    }
  }

  /**
   * 生成审计报告
   */
  async generateReport(
    type: ReportType,
    period: ReportPeriod,
    filter: AuditFilter,
    format: ReportFormat = ReportFormat.JSON
  ): Promise<AuditReport> {
    try {
      const events = await this.queryEvents(filter);
      
      const reportData: AuditReportData = {
        summary: this.generateSummary(events),
        events,
        statistics: this.generateStatistics(events),
        trends: this.generateTrends(events),
        risks: this.generateRiskAnalysis(events),
        compliance: this.complianceManager.assessCompliance(events)
      };

      const report: AuditReport = {
        id: this.generateReportId(),
        name: `${type} Report - ${period}`,
        description: `审计报告 (${new Date().toISOString()})`,
        type,
        period,
        filter,
        data: reportData,
        generatedAt: new Date(),
        generatedBy: 'system',
        format
      };

      this.emit('report:generated', report);
      
      return report;
      
    } catch (error) {
      this.emit('report:error', { type, period, filter, error });
      throw error;
    }
  }

  /**
   * 合规性检查
   */
  async checkCompliance(events?: AuditEvent[]): Promise<ComplianceStatus> {
    if (!events) {
      const filter: AuditFilter = {
        startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 最近30天
        endDate: new Date()
      };
      events = await this.queryEvents(filter);
    }

    return this.complianceManager.assessCompliance(events);
  }

  /**
   * 归档旧数据
   */
  async archiveOldData(): Promise<number> {
    const cutoffDate = new Date(
      Date.now() - this.config.retention.archiveAfterDays * 24 * 60 * 60 * 1000
    );
    
    const archivedCount = await this.storage.archive(cutoffDate);
    
    this.emit('data:archived', { cutoffDate, count: archivedCount });
    
    return archivedCount;
  }

  /**
   * 健康检查
   */
  async healthCheck(): Promise<boolean> {
    try {
      const storageHealthy = await this.storage.healthCheck();
      const bufferSize = this.eventBuffer.length;
      
      const isHealthy = storageHealthy && bufferSize < this.config.storage.batchSize * 2;
      
      this.emit('health:check', { 
        healthy: isHealthy, 
        storage: storageHealthy, 
        bufferSize 
      });
      
      return isHealthy;
    } catch (error) {
      this.emit('health:error', error);
      return false;
    }
  }

  // 私有方法

  private async createAuditEvent(eventData: Partial<AuditEvent>): Promise<AuditEvent> {
    const now = new Date();
    
    const event: AuditEvent = {
      id: eventData.id || this.generateEventId(),
      timestamp: eventData.timestamp || now,
      eventType: eventData.eventType || AuditEventType.SYSTEM_EVENT,
      category: eventData.category || AuditCategory.SYSTEM,
      severity: eventData.severity || AuditSeverity.LOW,
      action: eventData.action || 'unknown',
      resource: eventData.resource || 'unknown',
      resourceId: eventData.resourceId,
      actor: eventData.actor || {
        id: 'system',
        type: 'system',
        name: 'System'
      },
      target: eventData.target,
      result: eventData.result || AuditResult.SUCCESS,
      details: eventData.details || {
        description: 'No description provided'
      },
      context: eventData.context || {
        requestId: this.generateRequestId(),
        clientIP: 'unknown',
        userAgent: 'unknown'
      },
      metadata: eventData.metadata || {},
      checksum: '',
      version: '1.0.0'
    };

    // 生成校验和
    event.checksum = this.generateChecksum(event);
    
    return event;
  }

  private generateEventId(): string {
    return `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateReportId(): string {
    return `report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateChecksum(event: AuditEvent): string {
    const data = JSON.stringify({
      timestamp: event.timestamp,
      eventType: event.eventType,
      action: event.action,
      actor: event.actor,
      result: event.result
    });
    
    return crypto.createHash(this.config.integrity.checksumAlgorithm || 'sha256')
      .update(data)
      .digest('hex');
  }

  private async encryptSensitiveData(event: AuditEvent): Promise<void> {
    if (!this.encryptionKey) return;

    // 加密敏感字段
    const sensitiveFields = ['details', 'metadata'];
    
    for (const field of sensitiveFields) {
      if ((event as any)[field]) {
        const data = JSON.stringify((event as any)[field]);
        const cipher = crypto.createCipher(this.config.encryption.algorithm, this.encryptionKey);
        let encrypted = cipher.update(data, 'utf8', 'hex');
        encrypted += cipher.final('hex');
        (event as any)[field] = { encrypted: true, data: encrypted };
      }
    }
  }

  private async decryptSensitiveData(event: AuditEvent): Promise<void> {
    if (!this.encryptionKey) return;

    // 解密敏感字段
    const sensitiveFields = ['details', 'metadata'];
    
    for (const field of sensitiveFields) {
      const fieldData = (event as any)[field];
      if (fieldData && fieldData.encrypted) {
        const decipher = crypto.createDecipher(this.config.encryption.algorithm, this.encryptionKey);
        let decrypted = decipher.update(fieldData.data, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        (event as any)[field] = JSON.parse(decrypted);
      }
    }
  }

  private initializeEncryption(): void {
    this.encryptionKey = process.env.AUDIT_ENCRYPTION_KEY || 'default-key';
  }

  private startFlushTimer(): void {
    this.flushTimer = setInterval(async () => {
      if (this.eventBuffer.length > 0) {
        await this.flushBuffer();
      }
    }, this.config.storage.flushInterval);
  }

  private async flushBuffer(): Promise<void> {
    if (this.eventBuffer.length === 0) return;

    try {
      const events = [...this.eventBuffer];
      this.eventBuffer = [];
      
      await this.storage.storeBatch(events);
      
      this.emit('buffer:flushed', { count: events.length });
      
    } catch (error) {
      // 如果存储失败，将事件放回缓冲区
      this.eventBuffer.unshift(...this.eventBuffer);
      this.emit('buffer:flush_error', error);
    }
  }

  private checkAlertThresholds(event: AuditEvent): void {
    for (const threshold of this.config.alerting.thresholds) {
      if (this.evaluateThreshold(event, threshold)) {
        this.emit('alert:threshold_exceeded', { event, threshold });
      }
    }
  }

  private evaluateThreshold(event: AuditEvent, threshold: AlertThreshold): boolean {
    // 简化的阈值检查逻辑
    switch (threshold.condition) {
      case 'severity_gte':
        return event.severity >= threshold.value;
      case 'risk_score_gte':
        return (event.context.riskScore || 0) >= threshold.value;
      default:
        return false;
    }
  }

  private generateSummary(events: AuditEvent[]): AuditSummary {
    const eventsByType: Record<string, number> = {};
    const eventsByCategory: Record<string, number> = {};
    const eventsBySeverity: Record<string, number> = {};
    const eventsByResult: Record<string, number> = {};
    const uniqueActors = new Set<string>();
    const uniqueResources = new Set<string>();

    for (const event of events) {
      eventsByType[event.eventType] = (eventsByType[event.eventType] || 0) + 1;
      eventsByCategory[event.category] = (eventsByCategory[event.category] || 0) + 1;
      eventsBySeverity[event.severity] = (eventsBySeverity[event.severity] || 0) + 1;
      eventsByResult[event.result] = (eventsByResult[event.result] || 0) + 1;
      uniqueActors.add(event.actor.id);
      uniqueResources.add(event.resource);
    }

    const timestamps = events.map(e => e.timestamp.getTime());
    
    return {
      totalEvents: events.length,
      eventsByType: eventsByType as any,
      eventsByCategory: eventsByCategory as any,
      eventsBySeverity: eventsBySeverity as any,
      eventsByResult: eventsByResult as any,
      uniqueActors: uniqueActors.size,
      uniqueResources: uniqueResources.size,
      timespan: {
        start: new Date(Math.min(...timestamps)),
        end: new Date(Math.max(...timestamps))
      }
    };
  }

  private generateStatistics(events: AuditEvent[]): AuditStatistics {
    // 实现统计生成逻辑
    return {
      averageEventsPerDay: 0,
      peakHours: [],
      topActors: [],
      topResources: [],
      topActions: [],
      errorRate: 0,
      securityIncidents: 0,
      complianceViolations: 0
    };
  }

  private generateTrends(events: AuditEvent[]): AuditTrend[] {
    // 实现趋势分析逻辑
    return [];
  }

  private generateRiskAnalysis(events: AuditEvent[]): RiskAssessment[] {
    return events
      .filter(e => (e.context.riskScore || 0) > 50)
      .map(e => this.riskAssessment.assessRisk(e));
  }

  /**
   * 关闭审计日志系统
   */
  async close(): Promise<void> {
    try {
      // 清理定时器
      if (this.flushTimer) {
        clearInterval(this.flushTimer);
        this.flushTimer = undefined;
      }

      // 刷新剩余的缓冲区
      await this.flushBuffer();

      this.emit('logger:closed');
      
    } catch (error) {
      this.emit('logger:close_error', error);
    }
  }
}

// 默认配置
export const defaultAuditConfig: AuditConfig = {
  retention: {
    defaultDays: 365,
    policies: {
      [AuditCategory.SECURITY]: 2555, // 7年
      [AuditCategory.USER_MANAGEMENT]: 1095, // 3年
      [AuditCategory.SYSTEM]: 90
    },
    archiveAfterDays: 365,
    compressionEnabled: true
  },
  encryption: {
    enabled: true,
    algorithm: 'aes-256-cbc',
    keyRotationDays: 90,
    atRest: true,
    inTransit: true
  },
  integrity: {
    enabled: true,
    checksumAlgorithm: 'sha256',
    tamperDetection: true,
    digitalSignatures: false
  },
  compliance: {
    standards: ['SOX', 'GDPR', 'ISO27001'],
    autoReporting: true,
    reportingInterval: 'monthly',
    notificationEmails: []
  },
  alerting: {
    enabled: true,
    realTimeAlerts: true,
    thresholds: [
      {
        condition: 'severity_gte',
        value: AuditSeverity.HIGH,
        severity: AuditSeverity.HIGH,
        action: 'notify'
      }
    ],
    webhooks: []
  },
  storage: {
    backend: 'database',
    batchSize: 100,
    flushInterval: 5000,
    compression: true,
    sharding: false
  }
};

// 默认实例（需要在实际使用时提供storage实现）
export function createAuditLogger(storage: AuditStorage, config?: Partial<AuditConfig>): EnhancedAuditLogger {
  const finalConfig = { ...defaultAuditConfig, ...config };
  return new EnhancedAuditLogger(finalConfig, storage);
}

export default EnhancedAuditLogger;