/**
 * 智能告警聚合降噪
 * 告警事件关联分析、重复告警过滤、根因分析
 * 
 * @author SNMP Platform Team
 * @version 1.0.0
 * @date 2024-12-18
 */

import { EventEmitter } from 'events';
import { z } from 'zod';

// 基础类型定义
export interface AlertEvent {
  id: string;
  timestamp: Date;
  source: string;
  severity: AlertSeverity;
  category: AlertCategory;
  title: string;
  description: string;
  deviceId?: string;
  deviceName?: string;
  interfaceId?: string;
  metric?: string;
  value?: number;
  threshold?: number;
  tags: string[];
  metadata: Record<string, any>;
  fingerprint: string;
  acknowledged: boolean;
  resolved: boolean;
  resolvedAt?: Date;
  escalated: boolean;
  escalatedAt?: Date;
}

export enum AlertSeverity {
  CRITICAL = 1,
  HIGH = 2,
  MEDIUM = 3,
  LOW = 4,
  INFO = 5
}

export enum AlertCategory {
  NETWORK = 'network',
  SYSTEM = 'system',
  PERFORMANCE = 'performance',
  SECURITY = 'security',
  CONFIGURATION = 'configuration',
  HARDWARE = 'hardware',
  APPLICATION = 'application'
}

export interface AlertRule {
  id: string;
  name: string;
  category: AlertCategory;
  severity: AlertSeverity;
  condition: string;
  threshold: number;
  timeWindow: number;
  cooldown: number;
  enabled: boolean;
  correlations: string[];
  suppressions: string[];
}

export interface AlertCluster {
  id: string;
  alerts: AlertEvent[];
  pattern: AlertPattern;
  severity: AlertSeverity;
  category: AlertCategory;
  startTime: Date;
  endTime?: Date;
  rootCause?: RootCause;
  summary: string;
  count: number;
  affectedResources: string[];
  tags: string[];
}

export interface AlertPattern {
  type: 'duplicate' | 'cascade' | 'flapping' | 'storm' | 'correlation';
  confidence: number;
  description: string;
  parameters: Record<string, any>;
}

export interface RootCause {
  type: 'device_failure' | 'link_failure' | 'configuration_error' | 'capacity_issue' | 'external_dependency';
  confidence: number;
  description: string;
  evidence: string[];
  recommendations: string[];
}

export interface AggregationConfig {
  enabled: boolean;
  deduplicationWindow: number;
  correlationWindow: number;
  maxClusterSize: number;
  minClusterConfidence: number;
  autoResolveTimeout: number;
  escalationThreshold: number;
  enableRootCauseAnalysis: boolean;
  enablePreventiveActions: boolean;
}

export interface AggregationStats {
  totalAlerts: number;
  clusteredAlerts: number;
  duplicatesRemoved: number;
  correlationsFound: number;
  rootCausesIdentified: number;
  reductionRatio: number;
  averageClusterSize: number;
  falsePositiveRate: number;
}

// 验证模式
const alertEventSchema = z.object({
  id: z.string().min(1),
  timestamp: z.date(),
  source: z.string().min(1),
  severity: z.nativeEnum(AlertSeverity),
  category: z.nativeEnum(AlertCategory),
  title: z.string().min(1),
  description: z.string(),
  deviceId: z.string().optional(),
  deviceName: z.string().optional(),
  interfaceId: z.string().optional(),
  metric: z.string().optional(),
  value: z.number().optional(),
  threshold: z.number().optional(),
  tags: z.array(z.string()),
  metadata: z.record(z.any()),
  fingerprint: z.string().min(1),
  acknowledged: z.boolean(),
  resolved: z.boolean(),
  resolvedAt: z.date().optional(),
  escalated: z.boolean(),
  escalatedAt: z.date().optional()
});

const aggregationConfigSchema = z.object({
  enabled: z.boolean(),
  deduplicationWindow: z.number().positive(),
  correlationWindow: z.number().positive(),
  maxClusterSize: z.number().positive(),
  minClusterConfidence: z.number().min(0).max(1),
  autoResolveTimeout: z.number().positive(),
  escalationThreshold: z.number().positive(),
  enableRootCauseAnalysis: z.boolean(),
  enablePreventiveActions: z.boolean()
});

/**
 * 重复告警检测器
 */
export class DuplicateDetector {
  private recentAlerts: Map<string, AlertEvent[]> = new Map();
  private deduplicationWindow: number;

  constructor(deduplicationWindow: number = 300000) { // 5分钟
    this.deduplicationWindow = deduplicationWindow;
  }

  /**
   * 检测重复告警
   */
  isDuplicate(alert: AlertEvent): boolean {
    const fingerprint = alert.fingerprint;
    const now = Date.now();
    
    // 获取相同指纹的最近告警
    const recentAlerts = this.recentAlerts.get(fingerprint) || [];
    
    // 清理过期告警
    const validAlerts = recentAlerts.filter(
      a => now - a.timestamp.getTime() < this.deduplicationWindow
    );
    
    // 检查是否有重复
    const isDuplicate = validAlerts.length > 0;
    
    // 更新最近告警列表
    validAlerts.push(alert);
    this.recentAlerts.set(fingerprint, validAlerts);
    
    return isDuplicate;
  }

  /**
   * 生成告警指纹
   */
  static generateFingerprint(alert: AlertEvent): string {
    const components = [
      alert.source,
      alert.deviceId || '',
      alert.interfaceId || '',
      alert.metric || '',
      alert.category,
      alert.title
    ];
    
    return Buffer.from(components.join('|')).toString('base64');
  }

  /**
   * 清理过期数据
   */
  cleanup(): void {
    const now = Date.now();
    
    for (const [fingerprint, alerts] of this.recentAlerts) {
      const validAlerts = alerts.filter(
        a => now - a.timestamp.getTime() < this.deduplicationWindow
      );
      
      if (validAlerts.length === 0) {
        this.recentAlerts.delete(fingerprint);
      } else {
        this.recentAlerts.set(fingerprint, validAlerts);
      }
    }
  }
}

/**
 * 告警关联分析器
 */
export class AlertCorrelator {
  private correlationRules: Map<string, CorrelationRule[]> = new Map();
  private correlationWindow: number;

  constructor(correlationWindow: number = 600000) { // 10分钟
    this.correlationWindow = correlationWindow;
    this.initializeCorrelationRules();
  }

  /**
   * 初始化关联规则
   */
  private initializeCorrelationRules(): void {
    // 网络设备故障关联
    this.addCorrelationRule({
      id: 'device-down-cascade',
      name: '设备下线级联',
      conditions: [
        { metric: 'device_status', operator: 'equals', value: 'down' },
        { metric: 'interface_status', operator: 'equals', value: 'down' }
      ],
      timeWindow: 300000, // 5分钟
      minConfidence: 0.8,
      maxDistance: 2 // 最大跳数
    });

    // 接口利用率关联
    this.addCorrelationRule({
      id: 'interface-utilization-correlation',
      name: '接口利用率关联',
      conditions: [
        { metric: 'interface_utilization', operator: 'greater_than', value: 80 },
        { metric: 'interface_errors', operator: 'greater_than', value: 100 }
      ],
      timeWindow: 180000, // 3分钟
      minConfidence: 0.7,
      maxDistance: 1
    });

    // 系统资源关联
    this.addCorrelationRule({
      id: 'system-resource-correlation',
      name: '系统资源关联',
      conditions: [
        { metric: 'cpu_utilization', operator: 'greater_than', value: 90 },
        { metric: 'memory_utilization', operator: 'greater_than', value: 85 },
        { metric: 'response_time', operator: 'greater_than', value: 5000 }
      ],
      timeWindow: 300000,
      minConfidence: 0.75,
      maxDistance: 0
    });
  }

  /**
   * 添加关联规则
   */
  addCorrelationRule(rule: CorrelationRule): void {
    const category = rule.conditions[0]?.metric.split('_')[0] || 'general';
    
    if (!this.correlationRules.has(category)) {
      this.correlationRules.set(category, []);
    }
    
    this.correlationRules.get(category)!.push(rule);
  }

  /**
   * 查找告警关联
   */
  findCorrelations(alert: AlertEvent, recentAlerts: AlertEvent[]): AlertEvent[] {
    const correlatedAlerts: AlertEvent[] = [];
    const alertTime = alert.timestamp.getTime();
    
    // 获取时间窗口内的告警
    const windowAlerts = recentAlerts.filter(a => 
      Math.abs(a.timestamp.getTime() - alertTime) <= this.correlationWindow
    );
    
    // 应用关联规则
    for (const [category, rules] of this.correlationRules) {
      for (const rule of rules) {
        const matches = this.applyCorrelationRule(alert, windowAlerts, rule);
        correlatedAlerts.push(...matches);
      }
    }
    
    return Array.from(new Set(correlatedAlerts));
  }

  /**
   * 应用关联规则
   */
  private applyCorrelationRule(
    alert: AlertEvent, 
    candidates: AlertEvent[], 
    rule: CorrelationRule
  ): AlertEvent[] {
    const matches: AlertEvent[] = [];
    
    for (const candidate of candidates) {
      if (candidate.id === alert.id) continue;
      
      let matchScore = 0;
      let totalConditions = rule.conditions.length;
      
      for (const condition of rule.conditions) {
        if (this.evaluateCondition(candidate, condition)) {
          matchScore++;
        }
      }
      
      const confidence = matchScore / totalConditions;
      
      if (confidence >= rule.minConfidence) {
        // 检查设备距离
        if (this.calculateDeviceDistance(alert, candidate) <= rule.maxDistance) {
          matches.push(candidate);
        }
      }
    }
    
    return matches;
  }

  /**
   * 评估条件
   */
  private evaluateCondition(alert: AlertEvent, condition: CorrelationCondition): boolean {
    const alertValue = alert.metadata[condition.metric] || alert.value;
    
    if (alertValue === undefined) return false;
    
    switch (condition.operator) {
      case 'equals':
        return alertValue === condition.value;
      case 'greater_than':
        return alertValue > condition.value;
      case 'less_than':
        return alertValue < condition.value;
      case 'contains':
        return String(alertValue).includes(String(condition.value));
      default:
        return false;
    }
  }

  /**
   * 计算设备距离
   */
  private calculateDeviceDistance(alert1: AlertEvent, alert2: AlertEvent): number {
    // 简化实现：相同设备距离为0，不同设备距离为1
    if (alert1.deviceId === alert2.deviceId) return 0;
    if (alert1.deviceId && alert2.deviceId) return 1;
    return 2;
  }
}

interface CorrelationRule {
  id: string;
  name: string;
  conditions: CorrelationCondition[];
  timeWindow: number;
  minConfidence: number;
  maxDistance: number;
}

interface CorrelationCondition {
  metric: string;
  operator: 'equals' | 'greater_than' | 'less_than' | 'contains';
  value: any;
}

/**
 * 根因分析引擎
 */
export class RootCauseAnalyzer {
  private knowledgeBase: Map<string, RootCauseRule[]> = new Map();

  constructor() {
    this.initializeKnowledgeBase();
  }

  /**
   * 初始化知识库
   */
  private initializeKnowledgeBase(): void {
    // 设备故障规则
    this.addRootCauseRule({
      id: 'device-power-failure',
      pattern: ['device_status:down', 'power_supply:failure'],
      rootCause: {
        type: 'device_failure',
        confidence: 0.95,
        description: '设备电源故障导致设备下线',
        evidence: ['电源状态异常', '设备无响应'],
        recommendations: [
          '检查电源连接',
          '更换电源模块',
          '联系硬件维护人员'
        ]
      }
    });

    // 链路故障规则
    this.addRootCauseRule({
      id: 'link-congestion',
      pattern: ['interface_utilization:high', 'interface_errors:high', 'packet_loss:high'],
      rootCause: {
        type: 'capacity_issue',
        confidence: 0.85,
        description: '链路拥塞导致性能下降',
        evidence: ['接口利用率过高', '丢包率增加', '错误包增多'],
        recommendations: [
          '升级链路带宽',
          '优化流量分布',
          '实施QoS策略'
        ]
      }
    });

    // 配置错误规则
    this.addRootCauseRule({
      id: 'config-mismatch',
      pattern: ['config_changed:true', 'connectivity:failed'],
      rootCause: {
        type: 'configuration_error',
        confidence: 0.80,
        description: '配置变更导致连接失败',
        evidence: ['最近有配置变更', '连接性测试失败'],
        recommendations: [
          '回滚配置变更',
          '检查配置语法',
          '验证配置兼容性'
        ]
      }
    });
  }

  /**
   * 添加根因规则
   */
  addRootCauseRule(rule: RootCauseRule): void {
    const category = rule.pattern[0]?.split(':')[0] || 'general';
    
    if (!this.knowledgeBase.has(category)) {
      this.knowledgeBase.set(category, []);
    }
    
    this.knowledgeBase.get(category)!.push(rule);
  }

  /**
   * 分析根因
   */
  analyzeRootCause(cluster: AlertCluster): RootCause | null {
    const patterns = this.extractPatterns(cluster.alerts);
    let bestMatch: { rule: RootCauseRule; confidence: number } | null = null;
    
    // 搜索匹配的规则
    for (const [category, rules] of this.knowledgeBase) {
      for (const rule of rules) {
        const confidence = this.matchPattern(patterns, rule.pattern);
        
        if (confidence > 0.5 && (!bestMatch || confidence > bestMatch.confidence)) {
          bestMatch = { rule, confidence };
        }
      }
    }
    
    if (bestMatch) {
      return {
        ...bestMatch.rule.rootCause,
        confidence: bestMatch.confidence
      };
    }
    
    return null;
  }

  /**
   * 提取告警模式
   */
  private extractPatterns(alerts: AlertEvent[]): string[] {
    const patterns = new Set<string>();
    
    for (const alert of alerts) {
      // 基础模式
      patterns.add(`category:${alert.category}`);
      patterns.add(`severity:${AlertSeverity[alert.severity].toLowerCase()}`);
      
      // 设备相关模式
      if (alert.deviceId) {
        patterns.add(`device:${alert.deviceId}`);
      }
      
      // 指标相关模式
      if (alert.metric) {
        patterns.add(`metric:${alert.metric}`);
        
        if (alert.value !== undefined && alert.threshold !== undefined) {
          if (alert.value > alert.threshold) {
            patterns.add(`${alert.metric}:high`);
          } else {
            patterns.add(`${alert.metric}:low`);
          }
        }
      }
      
      // 标签模式
      for (const tag of alert.tags) {
        patterns.add(`tag:${tag}`);
      }
      
      // 元数据模式
      for (const [key, value] of Object.entries(alert.metadata)) {
        patterns.add(`${key}:${value}`);
      }
    }
    
    return Array.from(patterns);
  }

  /**
   * 匹配模式
   */
  private matchPattern(alertPatterns: string[], rulePattern: string[]): number {
    let matches = 0;
    
    for (const pattern of rulePattern) {
      if (alertPatterns.includes(pattern)) {
        matches++;
      }
    }
    
    return matches / rulePattern.length;
  }
}

interface RootCauseRule {
  id: string;
  pattern: string[];
  rootCause: RootCause;
}

/**
 * 智能告警聚合器
 */
export class IntelligentAlertAggregator extends EventEmitter {
  private config: AggregationConfig;
  private duplicateDetector: DuplicateDetector;
  private correlator: AlertCorrelator;
  private rootCauseAnalyzer: RootCauseAnalyzer;
  private alerts: Map<string, AlertEvent> = new Map();
  private clusters: Map<string, AlertCluster> = new Map();
  private stats: AggregationStats;
  private cleanupTimer?: NodeJS.Timeout;

  constructor(config: AggregationConfig) {
    super();
    
    // 验证配置
    this.config = aggregationConfigSchema.parse(config);
    
    // 初始化组件
    this.duplicateDetector = new DuplicateDetector(config.deduplicationWindow);
    this.correlator = new AlertCorrelator(config.correlationWindow);
    this.rootCauseAnalyzer = new RootCauseAnalyzer();
    
    // 初始化统计
    this.stats = {
      totalAlerts: 0,
      clusteredAlerts: 0,
      duplicatesRemoved: 0,
      correlationsFound: 0,
      rootCausesIdentified: 0,
      reductionRatio: 0,
      averageClusterSize: 0,
      falsePositiveRate: 0
    };
    
    // 启动清理定时器
    this.startCleanupTimer();
  }

  /**
   * 处理新告警
   */
  async processAlert(alert: AlertEvent): Promise<void> {
    try {
      // 验证告警
      const validatedAlert = alertEventSchema.parse(alert);
      
      // 生成指纹
      validatedAlert.fingerprint = DuplicateDetector.generateFingerprint(validatedAlert);
      
      this.stats.totalAlerts++;
      
      // 检查重复
      if (this.duplicateDetector.isDuplicate(validatedAlert)) {
        this.stats.duplicatesRemoved++;
        this.emit('alert:duplicate', validatedAlert);
        return;
      }
      
      // 存储告警
      this.alerts.set(validatedAlert.id, validatedAlert);
      
      // 查找关联告警
      const recentAlerts = Array.from(this.alerts.values());
      const correlatedAlerts = this.correlator.findCorrelations(validatedAlert, recentAlerts);
      
      if (correlatedAlerts.length > 0) {
        this.stats.correlationsFound++;
        await this.createOrUpdateCluster(validatedAlert, correlatedAlerts);
      } else {
        // 创建单独的告警簇
        await this.createSingleAlertCluster(validatedAlert);
      }
      
      this.emit('alert:processed', validatedAlert);
      
    } catch (error) {
      this.emit('alert:error', { alert, error });
      throw error;
    }
  }

  /**
   * 创建或更新告警簇
   */
  private async createOrUpdateCluster(
    alert: AlertEvent, 
    correlatedAlerts: AlertEvent[]
  ): Promise<void> {
    // 查找现有簇
    let existingCluster: AlertCluster | null = null;
    
    for (const cluster of this.clusters.values()) {
      if (cluster.alerts.some(a => correlatedAlerts.includes(a))) {
        existingCluster = cluster;
        break;
      }
    }
    
    if (existingCluster) {
      // 更新现有簇
      existingCluster.alerts.push(alert);
      existingCluster.count++;
      existingCluster.endTime = new Date();
      
      // 更新严重性
      if (alert.severity < existingCluster.severity) {
        existingCluster.severity = alert.severity;
      }
      
      // 更新受影响资源
      if (alert.deviceId && !existingCluster.affectedResources.includes(alert.deviceId)) {
        existingCluster.affectedResources.push(alert.deviceId);
      }
      
      // 更新标签
      for (const tag of alert.tags) {
        if (!existingCluster.tags.includes(tag)) {
          existingCluster.tags.push(tag);
        }
      }
      
      this.emit('cluster:updated', existingCluster);
      
    } else {
      // 创建新簇
      const allAlerts = [alert, ...correlatedAlerts];
      const cluster = await this.createCluster(allAlerts);
      this.clusters.set(cluster.id, cluster);
      
      this.stats.clusteredAlerts += allAlerts.length;
      this.emit('cluster:created', cluster);
    }
  }

  /**
   * 创建单独告警簇
   */
  private async createSingleAlertCluster(alert: AlertEvent): Promise<void> {
    const cluster = await this.createCluster([alert]);
    this.clusters.set(cluster.id, cluster);
    this.emit('cluster:created', cluster);
  }

  /**
   * 创建告警簇
   */
  private async createCluster(alerts: AlertEvent[]): Promise<AlertCluster> {
    const id = `cluster-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const pattern = this.identifyPattern(alerts);
    const severity = Math.min(...alerts.map(a => a.severity));
    const category = this.determinePrimaryCategory(alerts);
    const affectedResources = Array.from(new Set(
      alerts.map(a => a.deviceId).filter(Boolean) as string[]
    ));
    const tags = Array.from(new Set(alerts.flatMap(a => a.tags)));
    
    const cluster: AlertCluster = {
      id,
      alerts: [...alerts],
      pattern,
      severity,
      category,
      startTime: new Date(Math.min(...alerts.map(a => a.timestamp.getTime()))),
      summary: this.generateSummary(alerts, pattern),
      count: alerts.length,
      affectedResources,
      tags
    };
    
    // 执行根因分析
    if (this.config.enableRootCauseAnalysis) {
      cluster.rootCause = this.rootCauseAnalyzer.analyzeRootCause(cluster);
      if (cluster.rootCause) {
        this.stats.rootCausesIdentified++;
      }
    }
    
    return cluster;
  }

  /**
   * 识别告警模式
   */
  private identifyPattern(alerts: AlertEvent[]): AlertPattern {
    if (alerts.length === 1) {
      return {
        type: 'duplicate',
        confidence: 1.0,
        description: '单独告警',
        parameters: {}
      };
    }
    
    // 检查级联模式
    const deviceCounts = new Map<string, number>();
    for (const alert of alerts) {
      if (alert.deviceId) {
        deviceCounts.set(alert.deviceId, (deviceCounts.get(alert.deviceId) || 0) + 1);
      }
    }
    
    if (deviceCounts.size > 1) {
      return {
        type: 'cascade',
        confidence: 0.8,
        description: '级联告警，多个设备受影响',
        parameters: { affectedDevices: deviceCounts.size }
      };
    }
    
    // 检查告警风暴
    const timeSpan = Math.max(...alerts.map(a => a.timestamp.getTime())) - 
                    Math.min(...alerts.map(a => a.timestamp.getTime()));
    
    if (timeSpan < 60000 && alerts.length > 5) { // 1分钟内超过5个告警
      return {
        type: 'storm',
        confidence: 0.9,
        description: '告警风暴，短时间内大量告警',
        parameters: { timeSpan, count: alerts.length }
      };
    }
    
    // 检查震荡模式
    const fingerprints = new Set(alerts.map(a => a.fingerprint));
    if (fingerprints.size < alerts.length / 2) {
      return {
        type: 'flapping',
        confidence: 0.7,
        description: '告警震荡，相同告警反复出现',
        parameters: { uniqueFingerprints: fingerprints.size }
      };
    }
    
    return {
      type: 'correlation',
      confidence: 0.6,
      description: '相关告警聚合',
      parameters: {}
    };
  }

  /**
   * 确定主要类别
   */
  private determinePrimaryCategory(alerts: AlertEvent[]): AlertCategory {
    const categoryCounts = new Map<AlertCategory, number>();
    
    for (const alert of alerts) {
      categoryCounts.set(alert.category, (categoryCounts.get(alert.category) || 0) + 1);
    }
    
    let maxCount = 0;
    let primaryCategory = AlertCategory.SYSTEM;
    
    for (const [category, count] of categoryCounts) {
      if (count > maxCount) {
        maxCount = count;
        primaryCategory = category;
      }
    }
    
    return primaryCategory;
  }

  /**
   * 生成摘要
   */
  private generateSummary(alerts: AlertEvent[], pattern: AlertPattern): string {
    const count = alerts.length;
    const primaryCategory = this.determinePrimaryCategory(alerts);
    const severity = AlertSeverity[Math.min(...alerts.map(a => a.severity))];
    
    let summary = `${count}个${severity}级别${primaryCategory}告警`;
    
    if (pattern.type === 'cascade') {
      summary += '，发生级联影响';
    } else if (pattern.type === 'storm') {
      summary += '，形成告警风暴';
    } else if (pattern.type === 'flapping') {
      summary += '，出现震荡现象';
    }
    
    const affectedDevices = new Set(alerts.map(a => a.deviceId).filter(Boolean));
    if (affectedDevices.size > 0) {
      summary += `，影响${affectedDevices.size}个设备`;
    }
    
    return summary;
  }

  /**
   * 获取告警簇
   */
  getClusters(): AlertCluster[] {
    return Array.from(this.clusters.values());
  }

  /**
   * 获取告警簇详情
   */
  getCluster(clusterId: string): AlertCluster | null {
    return this.clusters.get(clusterId) || null;
  }

  /**
   * 确认告警簇
   */
  acknowledgeCluster(clusterId: string, userId: string): boolean {
    const cluster = this.clusters.get(clusterId);
    if (!cluster) return false;
    
    // 确认簇中所有告警
    for (const alert of cluster.alerts) {
      alert.acknowledged = true;
      alert.metadata.acknowledgedBy = userId;
      alert.metadata.acknowledgedAt = new Date().toISOString();
    }
    
    this.emit('cluster:acknowledged', { cluster, userId });
    return true;
  }

  /**
   * 解决告警簇
   */
  resolveCluster(clusterId: string, userId: string, resolution: string): boolean {
    const cluster = this.clusters.get(clusterId);
    if (!cluster) return false;
    
    // 解决簇中所有告警
    for (const alert of cluster.alerts) {
      alert.resolved = true;
      alert.resolvedAt = new Date();
      alert.metadata.resolvedBy = userId;
      alert.metadata.resolution = resolution;
    }
    
    cluster.endTime = new Date();
    
    this.emit('cluster:resolved', { cluster, userId, resolution });
    return true;
  }

  /**
   * 获取统计信息
   */
  getStats(): AggregationStats {
    // 计算减少比例
    if (this.stats.totalAlerts > 0) {
      const effectiveAlerts = this.stats.totalAlerts - this.stats.duplicatesRemoved;
      const clusteredCount = this.clusters.size;
      this.stats.reductionRatio = ((effectiveAlerts - clusteredCount) / effectiveAlerts) * 100;
    }
    
    // 计算平均簇大小
    if (this.clusters.size > 0) {
      const totalAlertsInClusters = Array.from(this.clusters.values())
        .reduce((sum, cluster) => sum + cluster.count, 0);
      this.stats.averageClusterSize = totalAlertsInClusters / this.clusters.size;
    }
    
    return { ...this.stats };
  }

  /**
   * 重置统计信息
   */
  resetStats(): void {
    this.stats = {
      totalAlerts: 0,
      clusteredAlerts: 0,
      duplicatesRemoved: 0,
      correlationsFound: 0,
      rootCausesIdentified: 0,
      reductionRatio: 0,
      averageClusterSize: 0,
      falsePositiveRate: 0
    };
    
    this.emit('stats:reset');
  }

  /**
   * 启动清理定时器
   */
  private startCleanupTimer(): void {
    // 每小时清理一次过期数据
    this.cleanupTimer = setInterval(() => {
      this.cleanup();
    }, 3600000);
  }

  /**
   * 清理过期数据
   */
  private cleanup(): void {
    const now = Date.now();
    const maxAge = 24 * 60 * 60 * 1000; // 24小时
    
    // 清理过期告警
    for (const [id, alert] of this.alerts) {
      if (now - alert.timestamp.getTime() > maxAge) {
        this.alerts.delete(id);
      }
    }
    
    // 清理过期簇
    for (const [id, cluster] of this.clusters) {
      const age = cluster.endTime ? 
        now - cluster.endTime.getTime() : 
        now - cluster.startTime.getTime();
      
      if (age > maxAge) {
        this.clusters.delete(id);
      }
    }
    
    // 清理重复检测器
    this.duplicateDetector.cleanup();
    
    this.emit('cleanup:completed', {
      alertsRemaining: this.alerts.size,
      clustersRemaining: this.clusters.size
    });
  }

  /**
   * 关闭聚合器
   */
  close(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = undefined;
    }
    
    this.emit('aggregator:closed');
  }
}

// 默认实例
export const intelligentAlertAggregator = new IntelligentAlertAggregator({
  enabled: true,
  deduplicationWindow: 300000, // 5分钟
  correlationWindow: 600000, // 10分钟
  maxClusterSize: 100,
  minClusterConfidence: 0.6,
  autoResolveTimeout: 3600000, // 1小时
  escalationThreshold: 900000, // 15分钟
  enableRootCauseAnalysis: true,
  enablePreventiveActions: true
});

export default IntelligentAlertAggregator;