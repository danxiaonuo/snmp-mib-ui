/**
 * 机器学习预测监控
 * 异常检测算法、趋势预测、容量规划建议
 * 
 * @author SNMP Platform Team
 * @version 1.0.0
 * @date 2024-12-18
 */

import { EventEmitter } from 'events';
import { z } from 'zod';

// 基础类型定义
export interface MetricDataPoint {
  timestamp: Date;
  value: number;
  metadata?: Record<string, any>;
}

export interface TimeSeries {
  metric: string;
  deviceId: string;
  interfaceId?: string;
  data: MetricDataPoint[];
  unit: string;
  tags: string[];
}

export interface AnomalyDetectionResult {
  timestamp: Date;
  value: number;
  expectedValue: number;
  anomalyScore: number;
  isAnomaly: boolean;
  confidence: number;
  algorithm: string;
  metadata: Record<string, any>;
}

export interface TrendPrediction {
  metric: string;
  deviceId: string;
  predictions: PredictionPoint[];
  algorithm: string;
  confidence: number;
  mse: number; // Mean Squared Error
  r2Score: number; // R-squared score
  generatedAt: Date;
  validUntil: Date;
}

export interface PredictionPoint {
  timestamp: Date;
  predictedValue: number;
  confidenceInterval: {
    lower: number;
    upper: number;
  };
  probability: number;
}

export interface CapacityPlan {
  resource: string;
  deviceId: string;
  currentUtilization: number;
  projectedUtilization: number;
  timeToThreshold: number; // milliseconds
  recommendedActions: RecommendedAction[];
  urgency: 'low' | 'medium' | 'high' | 'critical';
  generatedAt: Date;
}

export interface RecommendedAction {
  type: 'scale_up' | 'optimize' | 'replace' | 'redistribute' | 'monitor';
  description: string;
  impact: string;
  effort: 'low' | 'medium' | 'high';
  timeline: string;
  cost: 'low' | 'medium' | 'high';
}

export interface MLModel {
  id: string;
  name: string;
  type: 'anomaly_detection' | 'trend_prediction' | 'capacity_planning';
  algorithm: string;
  parameters: Record<string, any>;
  trainedAt: Date;
  accuracy: number;
  version: string;
  isActive: boolean;
}

export interface TrainingConfig {
  algorithm: string;
  trainingPeriod: number; // milliseconds
  validationSplit: number; // 0-1
  hyperparameters: Record<string, any>;
  retrainInterval: number; // milliseconds
  minDataPoints: number;
  maxDataPoints: number;
}

// 验证模式
const metricDataPointSchema = z.object({
  timestamp: z.date(),
  value: z.number(),
  metadata: z.record(z.any()).optional()
});

const timeSeriesSchema = z.object({
  metric: z.string().min(1),
  deviceId: z.string().min(1),
  interfaceId: z.string().optional(),
  data: z.array(metricDataPointSchema),
  unit: z.string(),
  tags: z.array(z.string())
});

const trainingConfigSchema = z.object({
  algorithm: z.string(),
  trainingPeriod: z.number().positive(),
  validationSplit: z.number().min(0).max(1),
  hyperparameters: z.record(z.any()),
  retrainInterval: z.number().positive(),
  minDataPoints: z.number().positive(),
  maxDataPoints: z.number().positive()
});

/**
 * 异常检测算法基类
 */
abstract class AnomalyDetectionAlgorithm {
  protected config: Record<string, any>;
  protected trained: boolean = false;

  constructor(config: Record<string, any> = {}) {
    this.config = config;
  }

  abstract train(data: MetricDataPoint[]): Promise<void>;
  abstract detect(value: number, timestamp: Date): Promise<AnomalyDetectionResult>;
  abstract getModelInfo(): Record<string, any>;
}

/**
 * Z-Score异常检测
 */
export class ZScoreAnomalyDetector extends AnomalyDetectionAlgorithm {
  private mean: number = 0;
  private standardDeviation: number = 0;
  private threshold: number;

  constructor(config: Record<string, any> = {}) {
    super(config);
    this.threshold = config.threshold || 2.5;
  }

  async train(data: MetricDataPoint[]): Promise<void> {
    if (data.length < 10) {
      throw new Error('需要至少10个数据点进行训练');
    }

    const values = data.map(d => d.value);
    this.mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    
    const variance = values.reduce((sum, val) => sum + Math.pow(val - this.mean, 2), 0) / values.length;
    this.standardDeviation = Math.sqrt(variance);
    
    this.trained = true;
  }

  async detect(value: number, timestamp: Date): Promise<AnomalyDetectionResult> {
    if (!this.trained) {
      throw new Error('模型未训练');
    }

    const zScore = Math.abs(value - this.mean) / (this.standardDeviation || 1);
    const isAnomaly = zScore > this.threshold;
    const anomalyScore = zScore / this.threshold;
    const confidence = Math.min(1, Math.max(0, (zScore - 1) / (this.threshold - 1)));

    return {
      timestamp,
      value,
      expectedValue: this.mean,
      anomalyScore,
      isAnomaly,
      confidence,
      algorithm: 'z-score',
      metadata: {
        zScore,
        threshold: this.threshold,
        mean: this.mean,
        standardDeviation: this.standardDeviation
      }
    };
  }

  getModelInfo(): Record<string, any> {
    return {
      algorithm: 'z-score',
      trained: this.trained,
      parameters: {
        mean: this.mean,
        standardDeviation: this.standardDeviation,
        threshold: this.threshold
      }
    };
  }
}

/**
 * 指数移动平均异常检测
 */
export class EMAnomalyDetector extends AnomalyDetectionAlgorithm {
  private alpha: number;
  private ema: number = 0;
  private variance: number = 0;
  private threshold: number;
  private initialized: boolean = false;

  constructor(config: Record<string, any> = {}) {
    super(config);
    this.alpha = config.alpha || 0.1;
    this.threshold = config.threshold || 2.0;
  }

  async train(data: MetricDataPoint[]): Promise<void> {
    if (data.length < 5) {
      throw new Error('需要至少5个数据点进行训练');
    }

    // 初始化EMA为第一个值
    this.ema = data[0].value;
    this.variance = 0;

    for (let i = 1; i < data.length; i++) {
      const value = data[i].value;
      const diff = value - this.ema;
      
      this.ema += this.alpha * diff;
      this.variance = (1 - this.alpha) * (this.variance + this.alpha * diff * diff);
    }

    this.initialized = true;
    this.trained = true;
  }

  async detect(value: number, timestamp: Date): Promise<AnomalyDetectionResult> {
    if (!this.trained) {
      throw new Error('模型未训练');
    }

    const expectedValue = this.ema;
    const diff = value - expectedValue;
    const standardDeviation = Math.sqrt(this.variance);
    const anomalyScore = Math.abs(diff) / (standardDeviation || 1);
    const isAnomaly = anomalyScore > this.threshold;
    const confidence = Math.min(1, Math.max(0, (anomalyScore - 1) / (this.threshold - 1)));

    // 更新EMA
    this.ema += this.alpha * diff;
    this.variance = (1 - this.alpha) * (this.variance + this.alpha * diff * diff);

    return {
      timestamp,
      value,
      expectedValue,
      anomalyScore,
      isAnomaly,
      confidence,
      algorithm: 'ema',
      metadata: {
        alpha: this.alpha,
        threshold: this.threshold,
        variance: this.variance
      }
    };
  }

  getModelInfo(): Record<string, any> {
    return {
      algorithm: 'ema',
      trained: this.trained,
      parameters: {
        alpha: this.alpha,
        ema: this.ema,
        variance: this.variance,
        threshold: this.threshold
      }
    };
  }
}

/**
 * 趋势预测算法基类
 */
abstract class TrendPredictionAlgorithm {
  protected config: Record<string, any>;
  protected trained: boolean = false;

  constructor(config: Record<string, any> = {}) {
    this.config = config;
  }

  abstract train(data: MetricDataPoint[]): Promise<void>;
  abstract predict(steps: number): Promise<PredictionPoint[]>;
  abstract getModelInfo(): Record<string, any>;
}

/**
 * 线性回归趋势预测
 */
export class LinearRegressionPredictor extends TrendPredictionAlgorithm {
  private slope: number = 0;
  private intercept: number = 0;
  private r2Score: number = 0;
  private mse: number = 0;
  private lastTimestamp: number = 0;
  private interval: number = 0;

  async train(data: MetricDataPoint[]): Promise<void> {
    if (data.length < 10) {
      throw new Error('需要至少10个数据点进行训练');
    }

    // 排序数据
    const sortedData = data.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    
    // 计算时间间隔
    if (sortedData.length > 1) {
      this.interval = (sortedData[sortedData.length - 1].timestamp.getTime() - 
                      sortedData[0].timestamp.getTime()) / (sortedData.length - 1);
    }

    this.lastTimestamp = sortedData[sortedData.length - 1].timestamp.getTime();

    // 转换为序列索引
    const n = sortedData.length;
    const x = Array.from({ length: n }, (_, i) => i);
    const y = sortedData.map(d => d.value);

    // 计算线性回归参数
    const sumX = x.reduce((sum, val) => sum + val, 0);
    const sumY = y.reduce((sum, val) => sum + val, 0);
    const sumXY = x.reduce((sum, val, i) => sum + val * y[i], 0);
    const sumX2 = x.reduce((sum, val) => sum + val * val, 0);

    this.slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    this.intercept = (sumY - this.slope * sumX) / n;

    // 计算R²和MSE
    const predictions = x.map(xi => this.slope * xi + this.intercept);
    const meanY = sumY / n;
    
    const totalSumSquares = y.reduce((sum, yi) => sum + Math.pow(yi - meanY, 2), 0);
    const residualSumSquares = y.reduce((sum, yi, i) => sum + Math.pow(yi - predictions[i], 2), 0);
    
    this.r2Score = 1 - (residualSumSquares / totalSumSquares);
    this.mse = residualSumSquares / n;

    this.trained = true;
  }

  async predict(steps: number): Promise<PredictionPoint[]> {
    if (!this.trained) {
      throw new Error('模型未训练');
    }

    const predictions: PredictionPoint[] = [];
    
    for (let i = 1; i <= steps; i++) {
      const timestamp = new Date(this.lastTimestamp + i * this.interval);
      const x = i; // 从最后一个训练点开始的步数
      const predictedValue = this.slope * x + this.intercept;
      
      // 简单的置信区间计算（基于MSE）
      const margin = 1.96 * Math.sqrt(this.mse); // 95%置信区间
      
      predictions.push({
        timestamp,
        predictedValue,
        confidenceInterval: {
          lower: predictedValue - margin,
          upper: predictedValue + margin
        },
        probability: Math.max(0, Math.min(1, this.r2Score))
      });
    }

    return predictions;
  }

  getModelInfo(): Record<string, any> {
    return {
      algorithm: 'linear-regression',
      trained: this.trained,
      parameters: {
        slope: this.slope,
        intercept: this.intercept,
        r2Score: this.r2Score,
        mse: this.mse,
        interval: this.interval
      }
    };
  }
}

/**
 * 季节性分解趋势预测
 */
export class SeasonalDecompositionPredictor extends TrendPredictionAlgorithm {
  private trendCoefficients: number[] = [];
  private seasonalPattern: number[] = [];
  private seasonalPeriod: number = 24; // 默认24小时季节性
  private r2Score: number = 0;
  private mse: number = 0;
  private lastTimestamp: number = 0;
  private interval: number = 0;

  constructor(config: Record<string, any> = {}) {
    super(config);
    this.seasonalPeriod = config.seasonalPeriod || 24;
  }

  async train(data: MetricDataPoint[]): Promise<void> {
    if (data.length < this.seasonalPeriod * 2) {
      throw new Error(`需要至少${this.seasonalPeriod * 2}个数据点进行季节性分析`);
    }

    const sortedData = data.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    this.interval = (sortedData[sortedData.length - 1].timestamp.getTime() - 
                    sortedData[0].timestamp.getTime()) / (sortedData.length - 1);
    this.lastTimestamp = sortedData[sortedData.length - 1].timestamp.getTime();

    const values = sortedData.map(d => d.value);
    
    // 计算移动平均（趋势）
    const trend = this.calculateMovingAverage(values, this.seasonalPeriod);
    
    // 去趋势
    const detrended = values.map((val, i) => val - (trend[i] || trend[trend.length - 1]));
    
    // 计算季节性模式
    this.seasonalPattern = this.calculateSeasonalPattern(detrended);
    
    // 计算趋势系数（简单线性回归）
    const n = trend.length;
    const x = Array.from({ length: n }, (_, i) => i);
    const sumX = x.reduce((sum, val) => sum + val, 0);
    const sumY = trend.reduce((sum, val) => sum + val, 0);
    const sumXY = x.reduce((sum, val, i) => sum + val * trend[i], 0);
    const sumX2 = x.reduce((sum, val) => sum + val * val, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
    
    this.trendCoefficients = [intercept, slope];

    // 计算预测精度
    const predictions = values.map((_, i) => {
      const trendValue = this.trendCoefficients[0] + this.trendCoefficients[1] * i;
      const seasonalValue = this.seasonalPattern[i % this.seasonalPeriod];
      return trendValue + seasonalValue;
    });

    const meanY = values.reduce((sum, val) => sum + val, 0) / values.length;
    const totalSumSquares = values.reduce((sum, val) => sum + Math.pow(val - meanY, 2), 0);
    const residualSumSquares = values.reduce((sum, val, i) => sum + Math.pow(val - predictions[i], 2), 0);
    
    this.r2Score = 1 - (residualSumSquares / totalSumSquares);
    this.mse = residualSumSquares / values.length;

    this.trained = true;
  }

  private calculateMovingAverage(values: number[], window: number): number[] {
    const result: number[] = [];
    
    for (let i = 0; i < values.length; i++) {
      const start = Math.max(0, i - Math.floor(window / 2));
      const end = Math.min(values.length, i + Math.ceil(window / 2));
      
      const sum = values.slice(start, end).reduce((s, v) => s + v, 0);
      result.push(sum / (end - start));
    }
    
    return result;
  }

  private calculateSeasonalPattern(detrended: number[]): number[] {
    const pattern: number[] = new Array(this.seasonalPeriod).fill(0);
    const counts: number[] = new Array(this.seasonalPeriod).fill(0);
    
    for (let i = 0; i < detrended.length; i++) {
      const seasonIndex = i % this.seasonalPeriod;
      pattern[seasonIndex] += detrended[i];
      counts[seasonIndex]++;
    }
    
    // 计算平均值
    for (let i = 0; i < this.seasonalPeriod; i++) {
      pattern[i] = counts[i] > 0 ? pattern[i] / counts[i] : 0;
    }
    
    return pattern;
  }

  async predict(steps: number): Promise<PredictionPoint[]> {
    if (!this.trained) {
      throw new Error('模型未训练');
    }

    const predictions: PredictionPoint[] = [];
    
    for (let i = 1; i <= steps; i++) {
      const timestamp = new Date(this.lastTimestamp + i * this.interval);
      
      // 趋势值
      const trendValue = this.trendCoefficients[0] + this.trendCoefficients[1] * i;
      
      // 季节性值
      const seasonIndex = i % this.seasonalPeriod;
      const seasonalValue = this.seasonalPattern[seasonIndex];
      
      const predictedValue = trendValue + seasonalValue;
      
      // 置信区间
      const margin = 1.96 * Math.sqrt(this.mse);
      
      predictions.push({
        timestamp,
        predictedValue,
        confidenceInterval: {
          lower: predictedValue - margin,
          upper: predictedValue + margin
        },
        probability: Math.max(0, Math.min(1, this.r2Score))
      });
    }

    return predictions;
  }

  getModelInfo(): Record<string, any> {
    return {
      algorithm: 'seasonal-decomposition',
      trained: this.trained,
      parameters: {
        trendCoefficients: this.trendCoefficients,
        seasonalPeriod: this.seasonalPeriod,
        seasonalPattern: this.seasonalPattern,
        r2Score: this.r2Score,
        mse: this.mse
      }
    };
  }
}

/**
 * 容量规划分析器
 */
export class CapacityPlanningAnalyzer {
  private thresholds: Map<string, number> = new Map();

  constructor() {
    // 设置默认阈值
    this.thresholds.set('cpu_utilization', 80);
    this.thresholds.set('memory_utilization', 85);
    this.thresholds.set('disk_utilization', 90);
    this.thresholds.set('interface_utilization', 70);
    this.thresholds.set('bandwidth_utilization', 75);
  }

  /**
   * 分析容量需求
   */
  async analyzeCapacity(
    metric: string,
    deviceId: string,
    currentData: MetricDataPoint[],
    prediction: TrendPrediction
  ): Promise<CapacityPlan> {
    const threshold = this.thresholds.get(metric) || 80;
    const currentUtilization = this.getCurrentUtilization(currentData);
    
    // 找到预测值超过阈值的时间点
    let timeToThreshold = Infinity;
    let projectedUtilization = currentUtilization;
    
    for (const point of prediction.predictions) {
      if (point.predictedValue >= threshold) {
        timeToThreshold = point.timestamp.getTime() - Date.now();
        break;
      }
      projectedUtilization = Math.max(projectedUtilization, point.predictedValue);
    }

    // 如果30天内会超过阈值，计算更精确的时间
    if (timeToThreshold === Infinity && prediction.predictions.length > 0) {
      const lastPrediction = prediction.predictions[prediction.predictions.length - 1];
      projectedUtilization = lastPrediction.predictedValue;
      
      // 使用线性外推估算
      if (projectedUtilization > currentUtilization) {
        const growthRate = (projectedUtilization - currentUtilization) / 
                          (lastPrediction.timestamp.getTime() - Date.now());
        timeToThreshold = (threshold - currentUtilization) / growthRate;
      }
    }

    const urgency = this.determineUrgency(timeToThreshold, currentUtilization, threshold);
    const recommendations = this.generateRecommendations(metric, currentUtilization, projectedUtilization, urgency);

    return {
      resource: metric,
      deviceId,
      currentUtilization,
      projectedUtilization,
      timeToThreshold: Math.max(0, timeToThreshold),
      recommendedActions: recommendations,
      urgency,
      generatedAt: new Date()
    };
  }

  /**
   * 获取当前利用率
   */
  private getCurrentUtilization(data: MetricDataPoint[]): number {
    if (data.length === 0) return 0;
    
    // 计算最近数据点的平均值
    const recentPoints = data.slice(-5);
    return recentPoints.reduce((sum, point) => sum + point.value, 0) / recentPoints.length;
  }

  /**
   * 确定紧急程度
   */
  private determineUrgency(
    timeToThreshold: number, 
    currentUtilization: number, 
    threshold: number
  ): 'low' | 'medium' | 'high' | 'critical' {
    const daysToThreshold = timeToThreshold / (24 * 60 * 60 * 1000);
    
    if (currentUtilization >= threshold) {
      return 'critical';
    } else if (daysToThreshold <= 7) {
      return 'high';
    } else if (daysToThreshold <= 30) {
      return 'medium';
    } else {
      return 'low';
    }
  }

  /**
   * 生成推荐行动
   */
  private generateRecommendations(
    metric: string,
    currentUtilization: number,
    projectedUtilization: number,
    urgency: string
  ): RecommendedAction[] {
    const recommendations: RecommendedAction[] = [];

    switch (metric) {
      case 'cpu_utilization':
        if (urgency === 'critical' || urgency === 'high') {
          recommendations.push({
            type: 'scale_up',
            description: '增加CPU核心数或升级到更高性能的处理器',
            impact: '显著提升处理能力',
            effort: 'high',
            timeline: '1-2周',
            cost: 'high'
          });
        }
        recommendations.push({
          type: 'optimize',
          description: '优化应用程序和进程，减少CPU使用',
          impact: '中等程度的性能提升',
          effort: 'medium',
          timeline: '1-2周',
          cost: 'low'
        });
        break;

      case 'memory_utilization':
        if (urgency === 'critical' || urgency === 'high') {
          recommendations.push({
            type: 'scale_up',
            description: '增加内存容量',
            impact: '解决内存不足问题',
            effort: 'medium',
            timeline: '3-5天',
            cost: 'medium'
          });
        }
        recommendations.push({
          type: 'optimize',
          description: '优化内存使用，清理缓存',
          impact: '释放部分内存空间',
          effort: 'low',
          timeline: '1-2天',
          cost: 'low'
        });
        break;

      case 'interface_utilization':
      case 'bandwidth_utilization':
        if (urgency === 'critical' || urgency === 'high') {
          recommendations.push({
            type: 'scale_up',
            description: '升级网络接口或增加带宽',
            impact: '显著提升网络性能',
            effort: 'high',
            timeline: '1-4周',
            cost: 'high'
          });
        }
        recommendations.push({
          type: 'redistribute',
          description: '重新分配网络流量，实施负载均衡',
          impact: '平衡网络负载',
          effort: 'medium',
          timeline: '1周',
          cost: 'low'
        });
        break;

      case 'disk_utilization':
        if (urgency === 'critical' || urgency === 'high') {
          recommendations.push({
            type: 'scale_up',
            description: '增加存储容量或更换更大的磁盘',
            impact: '解决存储空间不足',
            effort: 'medium',
            timeline: '1-2周',
            cost: 'medium'
          });
        }
        recommendations.push({
          type: 'optimize',
          description: '清理不必要的文件，压缩数据',
          impact: '释放存储空间',
          effort: 'low',
          timeline: '1-3天',
          cost: 'low'
        });
        break;
    }

    // 通用监控建议
    if (urgency !== 'critical') {
      recommendations.push({
        type: 'monitor',
        description: '加强监控，设置更精确的告警阈值',
        impact: '提前发现潜在问题',
        effort: 'low',
        timeline: '立即',
        cost: 'low'
      });
    }

    return recommendations;
  }

  /**
   * 设置阈值
   */
  setThreshold(metric: string, threshold: number): void {
    this.thresholds.set(metric, threshold);
  }

  /**
   * 获取阈值
   */
  getThreshold(metric: string): number {
    return this.thresholds.get(metric) || 80;
  }
}

/**
 * 机器学习预测监控引擎
 */
export class MLPredictiveMonitoring extends EventEmitter {
  private anomalyDetectors: Map<string, AnomalyDetectionAlgorithm> = new Map();
  private trendPredictors: Map<string, TrendPredictionAlgorithm> = new Map();
  private capacityAnalyzer: CapacityPlanningAnalyzer;
  private models: Map<string, MLModel> = new Map();
  private trainingSchedule: Map<string, NodeJS.Timeout> = new Map();

  constructor() {
    super();
    this.capacityAnalyzer = new CapacityPlanningAnalyzer();
  }

  /**
   * 注册异常检测模型
   */
  registerAnomalyDetector(
    modelId: string, 
    algorithm: 'z-score' | 'ema',
    config: Record<string, any> = {}
  ): void {
    let detector: AnomalyDetectionAlgorithm;
    
    switch (algorithm) {
      case 'z-score':
        detector = new ZScoreAnomalyDetector(config);
        break;
      case 'ema':
        detector = new EMAnomalyDetector(config);
        break;
      default:
        throw new Error(`不支持的算法: ${algorithm}`);
    }
    
    this.anomalyDetectors.set(modelId, detector);
    
    const model: MLModel = {
      id: modelId,
      name: `${algorithm} Anomaly Detector`,
      type: 'anomaly_detection',
      algorithm,
      parameters: config,
      trainedAt: new Date(),
      accuracy: 0,
      version: '1.0.0',
      isActive: true
    };
    
    this.models.set(modelId, model);
    this.emit('model:registered', model);
  }

  /**
   * 注册趋势预测模型
   */
  registerTrendPredictor(
    modelId: string,
    algorithm: 'linear-regression' | 'seasonal-decomposition',
    config: Record<string, any> = {}
  ): void {
    let predictor: TrendPredictionAlgorithm;
    
    switch (algorithm) {
      case 'linear-regression':
        predictor = new LinearRegressionPredictor(config);
        break;
      case 'seasonal-decomposition':
        predictor = new SeasonalDecompositionPredictor(config);
        break;
      default:
        throw new Error(`不支持的算法: ${algorithm}`);
    }
    
    this.trendPredictors.set(modelId, predictor);
    
    const model: MLModel = {
      id: modelId,
      name: `${algorithm} Trend Predictor`,
      type: 'trend_prediction',
      algorithm,
      parameters: config,
      trainedAt: new Date(),
      accuracy: 0,
      version: '1.0.0',
      isActive: true
    };
    
    this.models.set(modelId, model);
    this.emit('model:registered', model);
  }

  /**
   * 训练异常检测模型
   */
  async trainAnomalyDetector(modelId: string, data: TimeSeries): Promise<void> {
    const detector = this.anomalyDetectors.get(modelId);
    if (!detector) {
      throw new Error(`异常检测模型不存在: ${modelId}`);
    }

    try {
      await detector.train(data.data);
      
      const model = this.models.get(modelId)!;
      model.trainedAt = new Date();
      model.accuracy = 0.85; // 模拟精度
      
      this.emit('model:trained', { modelId, type: 'anomaly_detection' });
      
    } catch (error) {
      this.emit('model:training_failed', { modelId, error });
      throw error;
    }
  }

  /**
   * 训练趋势预测模型
   */
  async trainTrendPredictor(modelId: string, data: TimeSeries): Promise<void> {
    const predictor = this.trendPredictors.get(modelId);
    if (!predictor) {
      throw new Error(`趋势预测模型不存在: ${modelId}`);
    }

    try {
      await predictor.train(data.data);
      
      const model = this.models.get(modelId)!;
      model.trainedAt = new Date();
      
      const modelInfo = predictor.getModelInfo();
      model.accuracy = modelInfo.parameters?.r2Score || 0.8;
      
      this.emit('model:trained', { modelId, type: 'trend_prediction' });
      
    } catch (error) {
      this.emit('model:training_failed', { modelId, error });
      throw error;
    }
  }

  /**
   * 检测异常
   */
  async detectAnomaly(
    modelId: string, 
    value: number, 
    timestamp: Date = new Date()
  ): Promise<AnomalyDetectionResult> {
    const detector = this.anomalyDetectors.get(modelId);
    if (!detector) {
      throw new Error(`异常检测模型不存在: ${modelId}`);
    }

    const result = await detector.detect(value, timestamp);
    
    if (result.isAnomaly) {
      this.emit('anomaly:detected', { modelId, result });
    }
    
    return result;
  }

  /**
   * 预测趋势
   */
  async predictTrend(
    modelId: string,
    steps: number = 24,
    metric: string,
    deviceId: string
  ): Promise<TrendPrediction> {
    const predictor = this.trendPredictors.get(modelId);
    if (!predictor) {
      throw new Error(`趋势预测模型不存在: ${modelId}`);
    }

    const predictions = await predictor.predict(steps);
    const modelInfo = predictor.getModelInfo();
    
    const trendPrediction: TrendPrediction = {
      metric,
      deviceId,
      predictions,
      algorithm: modelInfo.algorithm,
      confidence: modelInfo.parameters?.r2Score || 0.8,
      mse: modelInfo.parameters?.mse || 0,
      r2Score: modelInfo.parameters?.r2Score || 0.8,
      generatedAt: new Date(),
      validUntil: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24小时有效
    };
    
    this.emit('prediction:generated', trendPrediction);
    
    return trendPrediction;
  }

  /**
   * 容量规划分析
   */
  async analyzeCapacity(
    metric: string,
    deviceId: string,
    currentData: TimeSeries,
    predictorModelId: string
  ): Promise<CapacityPlan> {
    // 首先生成趋势预测
    const prediction = await this.predictTrend(predictorModelId, 720, metric, deviceId); // 30天预测
    
    // 分析容量需求
    const plan = await this.capacityAnalyzer.analyzeCapacity(
      metric,
      deviceId,
      currentData.data,
      prediction
    );
    
    this.emit('capacity:analyzed', plan);
    
    return plan;
  }

  /**
   * 批量处理时间序列
   */
  async processTimeSeries(data: TimeSeries): Promise<{
    anomalies: AnomalyDetectionResult[];
    predictions: TrendPrediction[];
    capacityPlans: CapacityPlan[];
  }> {
    const anomalies: AnomalyDetectionResult[] = [];
    const predictions: TrendPrediction[] = [];
    const capacityPlans: CapacityPlan[] = [];

    // 异常检测
    for (const [modelId, detector] of this.anomalyDetectors) {
      try {
        for (const point of data.data) {
          const result = await detector.detect(point.value, point.timestamp);
          if (result.isAnomaly) {
            anomalies.push(result);
          }
        }
      } catch (error) {
        console.error(`异常检测失败 ${modelId}:`, error);
      }
    }

    // 趋势预测
    for (const [modelId, predictor] of this.trendPredictors) {
      try {
        const prediction = await this.predictTrend(modelId, 24, data.metric, data.deviceId);
        predictions.push(prediction);
      } catch (error) {
        console.error(`趋势预测失败 ${modelId}:`, error);
      }
    }

    // 容量规划
    if (predictions.length > 0) {
      try {
        const plan = await this.capacityAnalyzer.analyzeCapacity(
          data.metric,
          data.deviceId,
          data.data,
          predictions[0]
        );
        capacityPlans.push(plan);
      } catch (error) {
        console.error('容量规划分析失败:', error);
      }
    }

    return { anomalies, predictions, capacityPlans };
  }

  /**
   * 获取模型信息
   */
  getModel(modelId: string): MLModel | null {
    return this.models.get(modelId) || null;
  }

  /**
   * 获取所有模型
   */
  getAllModels(): MLModel[] {
    return Array.from(this.models.values());
  }

  /**
   * 激活/停用模型
   */
  setModelActive(modelId: string, active: boolean): boolean {
    const model = this.models.get(modelId);
    if (!model) return false;
    
    model.isActive = active;
    this.emit('model:status_changed', { modelId, active });
    
    return true;
  }

  /**
   * 删除模型
   */
  removeModel(modelId: string): boolean {
    const model = this.models.get(modelId);
    if (!model) return false;
    
    this.models.delete(modelId);
    this.anomalyDetectors.delete(modelId);
    this.trendPredictors.delete(modelId);
    
    // 清理定时器
    const timer = this.trainingSchedule.get(modelId);
    if (timer) {
      clearInterval(timer);
      this.trainingSchedule.delete(modelId);
    }
    
    this.emit('model:removed', modelId);
    
    return true;
  }

  /**
   * 设置自动重训练
   */
  scheduleAutoRetraining(modelId: string, interval: number): void {
    // 清除现有定时器
    const existingTimer = this.trainingSchedule.get(modelId);
    if (existingTimer) {
      clearInterval(existingTimer);
    }
    
    // 设置新的定时器
    const timer = setInterval(() => {
      this.emit('model:retrain_scheduled', modelId);
    }, interval);
    
    this.trainingSchedule.set(modelId, timer);
  }

  /**
   * 获取模型统计信息
   */
  getModelStats(): Record<string, any> {
    const models = Array.from(this.models.values());
    
    return {
      totalModels: models.length,
      activeModels: models.filter(m => m.isActive).length,
      modelsByType: {
        anomaly_detection: models.filter(m => m.type === 'anomaly_detection').length,
        trend_prediction: models.filter(m => m.type === 'trend_prediction').length,
        capacity_planning: models.filter(m => m.type === 'capacity_planning').length
      },
      averageAccuracy: models.reduce((sum, m) => sum + m.accuracy, 0) / models.length || 0
    };
  }

  /**
   * 关闭监控引擎
   */
  close(): void {
    // 清理所有定时器
    for (const timer of this.trainingSchedule.values()) {
      clearInterval(timer);
    }
    
    this.trainingSchedule.clear();
    this.emit('engine:closed');
  }
}

// 默认实例
export const mlPredictiveMonitoring = new MLPredictiveMonitoring();

// 注册默认模型
mlPredictiveMonitoring.registerAnomalyDetector('default-zscore', 'z-score', { threshold: 2.5 });
mlPredictiveMonitoring.registerAnomalyDetector('default-ema', 'ema', { alpha: 0.1, threshold: 2.0 });
mlPredictiveMonitoring.registerTrendPredictor('default-linear', 'linear-regression');
mlPredictiveMonitoring.registerTrendPredictor('default-seasonal', 'seasonal-decomposition', { seasonalPeriod: 24 });

export default MLPredictiveMonitoring;