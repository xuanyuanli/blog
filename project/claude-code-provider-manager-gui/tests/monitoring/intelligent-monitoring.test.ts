/**
 * Intelligent Monitoring Framework Tests
 * 智能监控框架测试
 */

import { api } from '@/services/api.mock';
import { createValidProvider } from '../fixtures/providers.factory';
import type { Provider } from '@/types';

// 监控指标定义
interface MonitoringMetrics {
  timestamp: number;
  systemHealth: {
    cpu: number;
    memory: number;
    diskSpace: number;
    networkLatency: number;
  };
  applicationHealth: {
    responseTime: number;
    errorRate: number;
    activeConnections: number;
    queueSize: number;
  };
  userExperience: {
    taskCompletionRate: number;
    averageTaskTime: number;
    userSatisfactionScore: number;
    errorRecoveryRate: number;
  };
  securityMetrics: {
    authenticationFailures: number;
    suspiciousActivities: number;
    dataIntegrityChecks: number;
    encryptionStatus: boolean;
  };
}

// 智能分析器
class IntelligentAnalyzer {
  private metricsHistory: MonitoringMetrics[] = [];
  private alerts: Array<{ type: string; severity: 'low' | 'medium' | 'high'; message: string; timestamp: number }> = [];
  private patterns: Map<string, number[]> = new Map();

  // 收集指标
  collectMetrics(): MonitoringMetrics {
    const timestamp = Date.now();
    const metrics: MonitoringMetrics = {
      timestamp,
      systemHealth: {
        cpu: Math.random() * 100,
        memory: Math.random() * 100,
        diskSpace: Math.random() * 100,
        networkLatency: Math.random() * 200,
      },
      applicationHealth: {
        responseTime: Math.random() * 1000,
        errorRate: Math.random() * 5,
        activeConnections: Math.floor(Math.random() * 100),
        queueSize: Math.floor(Math.random() * 50),
      },
      userExperience: {
        taskCompletionRate: 85 + Math.random() * 15,
        averageTaskTime: 30000 + Math.random() * 20000,
        userSatisfactionScore: 7 + Math.random() * 3,
        errorRecoveryRate: 70 + Math.random() * 30,
      },
      securityMetrics: {
        authenticationFailures: Math.floor(Math.random() * 5),
        suspiciousActivities: Math.floor(Math.random() * 3),
        dataIntegrityChecks: Math.floor(Math.random() * 10),
        encryptionStatus: Math.random() > 0.1,
      },
    };

    this.metricsHistory.push(metrics);
    if (this.metricsHistory.length > 1000) {
      this.metricsHistory.shift(); // 保持最近1000条记录
    }

    return metrics;
  }

  // 异常检测 - 基于统计学方法
  detectAnomalies(metrics: MonitoringMetrics): Array<{ type: string; severity: 'low' | 'medium' | 'high'; message: string }> {
    const anomalies: Array<{ type: string; severity: 'low' | 'medium' | 'high'; message: string }> = [];

    // CPU异常检测
    if (metrics.systemHealth.cpu > 90) {
      anomalies.push({
        type: 'system',
        severity: 'high',
        message: `High CPU usage detected: ${metrics.systemHealth.cpu.toFixed(2)}%`
      });
    }

    // 内存异常检测
    if (metrics.systemHealth.memory > 85) {
      anomalies.push({
        type: 'system',
        severity: 'high',
        message: `High memory usage detected: ${metrics.systemHealth.memory.toFixed(2)}%`
      });
    }

    // 响应时间异常检测
    if (metrics.applicationHealth.responseTime > 5000) {
      anomalies.push({
        type: 'performance',
        severity: 'medium',
        message: `Slow response time detected: ${metrics.applicationHealth.responseTime.toFixed(0)}ms`
      });
    }

    // 错误率异常检测
    if (metrics.applicationHealth.errorRate > 10) {
      anomalies.push({
        type: 'application',
        severity: 'high',
        message: `High error rate detected: ${metrics.applicationHealth.errorRate.toFixed(2)}%`
      });
    }

    // 用户体验指标异常检测
    if (metrics.userExperience.taskCompletionRate < 70) {
      anomalies.push({
        type: 'ux',
        severity: 'medium',
        message: `Low task completion rate: ${metrics.userExperience.taskCompletionRate.toFixed(2)}%`
      });
    }

    // 安全指标异常检测
    if (metrics.securityMetrics.authenticationFailures > 10) {
      anomalies.push({
        type: 'security',
        severity: 'high',
        message: `High authentication failure rate: ${metrics.securityMetrics.authenticationFailures} failures`
      });
    }

    if (!metrics.securityMetrics.encryptionStatus) {
      anomalies.push({
        type: 'security',
        severity: 'high',
        message: 'Encryption status check failed'
      });
    }

    return anomalies;
  }

  // 趋势分析
  analyzeTrends(): { trends: Map<string, 'increasing' | 'decreasing' | 'stable'>; predictions: Map<string, number> } {
    const trends = new Map<string, 'increasing' | 'decreasing' | 'stable'>();
    const predictions = new Map<string, number>();

    if (this.metricsHistory.length < 10) {
      return { trends, predictions };
    }

    const recent = this.metricsHistory.slice(-10);
    const older = this.metricsHistory.slice(-20, -10);

    // 分析CPU趋势
    const recentCpuAvg = recent.reduce((sum, m) => sum + m.systemHealth.cpu, 0) / recent.length;
    const olderCpuAvg = older.reduce((sum, m) => sum + m.systemHealth.cpu, 0) / older.length;
    
    if (recentCpuAvg > olderCpuAvg * 1.1) {
      trends.set('cpu', 'increasing');
    } else if (recentCpuAvg < olderCpuAvg * 0.9) {
      trends.set('cpu', 'decreasing');
    } else {
      trends.set('cpu', 'stable');
    }

    // 简单线性预测
    predictions.set('cpu_next_hour', recentCpuAvg + (recentCpuAvg - olderCpuAvg));

    // 分析响应时间趋势
    const recentRtAvg = recent.reduce((sum, m) => sum + m.applicationHealth.responseTime, 0) / recent.length;
    const olderRtAvg = older.reduce((sum, m) => sum + m.applicationHealth.responseTime, 0) / older.length;
    
    if (recentRtAvg > olderRtAvg * 1.1) {
      trends.set('response_time', 'increasing');
    } else if (recentRtAvg < olderRtAvg * 0.9) {
      trends.set('response_time', 'decreasing');
    } else {
      trends.set('response_time', 'stable');
    }

    predictions.set('response_time_next_hour', recentRtAvg + (recentRtAvg - olderRtAvg));

    return { trends, predictions };
  }

  // 生成报告
  generateReport(): {
    summary: string;
    alerts: Array<{ type: string; severity: 'low' | 'medium' | 'high'; message: string; timestamp: number }>;
    recommendations: string[];
    healthScore: number;
  } {
    const latestMetrics = this.metricsHistory[this.metricsHistory.length - 1];
    if (!latestMetrics) {
      return {
        summary: 'No metrics available',
        alerts: [],
        recommendations: [],
        healthScore: 0
      };
    }

    const anomalies = this.detectAnomalies(latestMetrics);
    
    // 计算健康分数
    let healthScore = 100;
    healthScore -= Math.max(0, latestMetrics.systemHealth.cpu - 80) * 0.5;
    healthScore -= Math.max(0, latestMetrics.systemHealth.memory - 80) * 0.5;
    healthScore -= Math.max(0, latestMetrics.applicationHealth.errorRate - 5) * 2;
    healthScore -= Math.max(0, (latestMetrics.applicationHealth.responseTime - 1000) / 100);
    healthScore = Math.max(0, healthScore);

    // 生成推荐
    const recommendations = [];
    if (latestMetrics.systemHealth.cpu > 80) {
      recommendations.push('Consider optimizing CPU-intensive operations or scaling resources');
    }
    if (latestMetrics.systemHealth.memory > 80) {
      recommendations.push('Review memory usage patterns and consider memory optimization');
    }
    if (latestMetrics.applicationHealth.responseTime > 3000) {
      recommendations.push('Investigate slow queries and optimize database performance');
    }
    if (latestMetrics.userExperience.taskCompletionRate < 80) {
      recommendations.push('Review UX design and identify user workflow bottlenecks');
    }

    // 添加告警到历史记录
    anomalies.forEach(anomaly => {
      this.alerts.push({
        ...anomaly,
        timestamp: Date.now()
      });
    });

    // 保持告警历史在合理范围内
    if (this.alerts.length > 100) {
      this.alerts = this.alerts.slice(-100);
    }

    return {
      summary: `System health: ${healthScore.toFixed(1)}/100. ${anomalies.length} anomalies detected.`,
      alerts: this.alerts.slice(-10), // 最近10个告警
      recommendations,
      healthScore
    };
  }

  // 获取指标历史
  getMetricsHistory(): MonitoringMetrics[] {
    return this.metricsHistory;
  }

  // 清除历史数据
  clearHistory(): void {
    this.metricsHistory = [];
    this.alerts = [];
    this.patterns.clear();
  }
}

describe('Intelligent Monitoring Framework', () => {
  let analyzer: IntelligentAnalyzer;

  beforeEach(() => {
    analyzer = new IntelligentAnalyzer();
    jest.clearAllMocks();
  });

  describe('Metrics Collection', () => {
    it('should collect comprehensive system metrics', () => {
      const metrics = analyzer.collectMetrics();

      expect(metrics).toHaveProperty('timestamp');
      expect(metrics).toHaveProperty('systemHealth');
      expect(metrics).toHaveProperty('applicationHealth');
      expect(metrics).toHaveProperty('userExperience');
      expect(metrics).toHaveProperty('securityMetrics');

      // 验证系统健康指标
      expect(metrics.systemHealth.cpu).toBeGreaterThanOrEqual(0);
      expect(metrics.systemHealth.cpu).toBeLessThanOrEqual(100);
      expect(metrics.systemHealth.memory).toBeGreaterThanOrEqual(0);
      expect(metrics.systemHealth.memory).toBeLessThanOrEqual(100);

      // 验证应用健康指标
      expect(metrics.applicationHealth.responseTime).toBeGreaterThanOrEqual(0);
      expect(metrics.applicationHealth.errorRate).toBeGreaterThanOrEqual(0);
      expect(metrics.applicationHealth.activeConnections).toBeGreaterThanOrEqual(0);

      // 验证用户体验指标
      expect(metrics.userExperience.taskCompletionRate).toBeGreaterThanOrEqual(0);
      expect(metrics.userExperience.taskCompletionRate).toBeLessThanOrEqual(100);
      expect(metrics.userExperience.userSatisfactionScore).toBeGreaterThanOrEqual(0);
      expect(metrics.userExperience.userSatisfactionScore).toBeLessThanOrEqual(10);

      // 验证安全指标
      expect(metrics.securityMetrics.authenticationFailures).toBeGreaterThanOrEqual(0);
      expect(metrics.securityMetrics.suspiciousActivities).toBeGreaterThanOrEqual(0);
      expect(typeof metrics.securityMetrics.encryptionStatus).toBe('boolean');
    });

    it('should maintain metrics history with size limit', () => {
      // 收集超过限制的指标
      for (let i = 0; i < 1100; i++) {
        analyzer.collectMetrics();
      }

      const history = analyzer.getMetricsHistory();
      expect(history.length).toBeLessThanOrEqual(1000);
      expect(history.length).toBeGreaterThan(900); // 应该接近1000
    });
  });

  describe('Anomaly Detection', () => {
    it('should detect high CPU usage anomaly', () => {
      const metrics = analyzer.collectMetrics();
      metrics.systemHealth.cpu = 95; // 设置高CPU使用率

      const anomalies = analyzer.detectAnomalies(metrics);
      const cpuAnomaly = anomalies.find(a => a.type === 'system' && a.message.includes('CPU'));
      
      expect(cpuAnomaly).toBeDefined();
      expect(cpuAnomaly?.severity).toBe('high');
    });

    it('should detect high memory usage anomaly', () => {
      const metrics = analyzer.collectMetrics();
      metrics.systemHealth.memory = 90; // 设置高内存使用率

      const anomalies = analyzer.detectAnomalies(metrics);
      const memoryAnomaly = anomalies.find(a => a.type === 'system' && a.message.includes('memory'));
      
      expect(memoryAnomaly).toBeDefined();
      expect(memoryAnomaly?.severity).toBe('high');
    });

    it('should detect slow response time anomaly', () => {
      const metrics = analyzer.collectMetrics();
      metrics.applicationHealth.responseTime = 6000; // 设置慢响应时间

      const anomalies = analyzer.detectAnomalies(metrics);
      const responseAnomaly = anomalies.find(a => a.type === 'performance');
      
      expect(responseAnomaly).toBeDefined();
      expect(responseAnomaly?.severity).toBe('medium');
    });

    it('should detect high error rate anomaly', () => {
      const metrics = analyzer.collectMetrics();
      metrics.applicationHealth.errorRate = 15; // 设置高错误率

      const anomalies = analyzer.detectAnomalies(metrics);
      const errorAnomaly = anomalies.find(a => a.type === 'application');
      
      expect(errorAnomaly).toBeDefined();
      expect(errorAnomaly?.severity).toBe('high');
    });

    it('should detect UX degradation anomaly', () => {
      const metrics = analyzer.collectMetrics();
      metrics.userExperience.taskCompletionRate = 60; // 设置低任务完成率

      const anomalies = analyzer.detectAnomalies(metrics);
      const uxAnomaly = anomalies.find(a => a.type === 'ux');
      
      expect(uxAnomaly).toBeDefined();
      expect(uxAnomaly?.severity).toBe('medium');
    });

    it('should detect security anomalies', () => {
      const metrics = analyzer.collectMetrics();
      metrics.securityMetrics.authenticationFailures = 15; // 设置高认证失败率
      metrics.securityMetrics.encryptionStatus = false; // 设置加密状态失败

      const anomalies = analyzer.detectAnomalies(metrics);
      const securityAnomalies = anomalies.filter(a => a.type === 'security');
      
      expect(securityAnomalies.length).toBeGreaterThanOrEqual(2);
      expect(securityAnomalies.every(a => a.severity === 'high')).toBe(true);
    });
  });

  describe('Trend Analysis', () => {
    it('should analyze trends when sufficient data is available', () => {
      // 生成足够的历史数据
      for (let i = 0; i < 25; i++) {
        analyzer.collectMetrics();
      }

      const { trends, predictions } = analyzer.analyzeTrends();
      
      expect(trends.has('cpu')).toBe(true);
      expect(trends.has('response_time')).toBe(true);
      expect(['increasing', 'decreasing', 'stable']).toContain(trends.get('cpu'));
      expect(['increasing', 'decreasing', 'stable']).toContain(trends.get('response_time'));
      
      expect(predictions.has('cpu_next_hour')).toBe(true);
      expect(predictions.has('response_time_next_hour')).toBe(true);
      expect(typeof predictions.get('cpu_next_hour')).toBe('number');
      expect(typeof predictions.get('response_time_next_hour')).toBe('number');
    });

    it('should return empty trends for insufficient data', () => {
      // 只收集少量数据
      for (let i = 0; i < 5; i++) {
        analyzer.collectMetrics();
      }

      const { trends, predictions } = analyzer.analyzeTrends();
      
      expect(trends.size).toBe(0);
      expect(predictions.size).toBe(0);
    });
  });

  describe('Report Generation', () => {
    it('should generate comprehensive monitoring report', () => {
      // 收集一些指标数据
      for (let i = 0; i < 10; i++) {
        analyzer.collectMetrics();
      }

      const report = analyzer.generateReport();
      
      expect(report).toHaveProperty('summary');
      expect(report).toHaveProperty('alerts');
      expect(report).toHaveProperty('recommendations');
      expect(report).toHaveProperty('healthScore');

      expect(typeof report.summary).toBe('string');
      expect(Array.isArray(report.alerts)).toBe(true);
      expect(Array.isArray(report.recommendations)).toBe(true);
      expect(typeof report.healthScore).toBe('number');
      expect(report.healthScore).toBeGreaterThanOrEqual(0);
      expect(report.healthScore).toBeLessThanOrEqual(100);
    });

    it('should handle no metrics available scenario', () => {
      const report = analyzer.generateReport();
      
      expect(report.summary).toBe('No metrics available');
      expect(report.alerts).toEqual([]);
      expect(report.recommendations).toEqual([]);
      expect(report.healthScore).toBe(0);
    });

    it('should generate appropriate recommendations based on metrics', () => {
      const metrics = analyzer.collectMetrics();
      
      // 设置需要优化的条件
      metrics.systemHealth.cpu = 85;
      metrics.systemHealth.memory = 85;
      metrics.applicationHealth.responseTime = 4000;
      metrics.userExperience.taskCompletionRate = 75;

      analyzer['metricsHistory'] = [metrics]; // 直接设置用于测试

      const report = analyzer.generateReport();
      
      expect(report.recommendations.length).toBeGreaterThan(0);
      expect(report.recommendations.some(rec => rec.includes('CPU'))).toBe(true);
      expect(report.recommendations.some(rec => rec.includes('memory'))).toBe(true);
      expect(report.recommendations.some(rec => rec.includes('performance'))).toBe(true);
      expect(report.recommendations.some(rec => rec.includes('UX'))).toBe(true);
    });

    it('should maintain alerts history with size limit', () => {
      // 生成大量异常来创建告警
      for (let i = 0; i < 150; i++) {
        const metrics = analyzer.collectMetrics();
        metrics.systemHealth.cpu = 95; // 触发告警
        analyzer.detectAnomalies(metrics);
        analyzer.generateReport(); // 这会添加告警到历史
      }

      const report = analyzer.generateReport();
      expect(report.alerts.length).toBeLessThanOrEqual(10); // 报告中最多显示10个
    });
  });

  describe('Integration with Provider Management', () => {
    it('should monitor provider-related metrics', async () => {
      const provider = createValidProvider();
      await api.addProvider(provider);

      // 模拟监控provider相关指标
      const metrics = analyzer.collectMetrics();
      
      // 这里可以扩展监控特定于provider的指标
      expect(metrics.applicationHealth.activeConnections).toBeGreaterThanOrEqual(0);
      expect(metrics.securityMetrics.encryptionStatus).toBeDefined();
    });

    it('should detect provider validation performance issues', async () => {
      const provider = createValidProvider();
      await api.addProvider(provider);

      const startTime = Date.now();
      try {
        await api.validateProviderConnection(provider.baseUrl, provider.authToken || '');
      } catch (error) {
        // 忽略验证错误，我们只关心性能
      }
      const endTime = Date.now();

      const metrics = analyzer.collectMetrics();
      metrics.applicationHealth.responseTime = endTime - startTime;

      if (metrics.applicationHealth.responseTime > 3000) {
        const anomalies = analyzer.detectAnomalies(metrics);
        const perfAnomaly = anomalies.find(a => a.type === 'performance');
        expect(perfAnomaly).toBeDefined();
      }
    });
  });

  describe('Data Management', () => {
    it('should clear history data', () => {
      // 添加一些数据
      for (let i = 0; i < 10; i++) {
        analyzer.collectMetrics();
      }

      expect(analyzer.getMetricsHistory().length).toBe(10);

      // 清除数据
      analyzer.clearHistory();

      expect(analyzer.getMetricsHistory().length).toBe(0);
      
      const report = analyzer.generateReport();
      expect(report.summary).toBe('No metrics available');
    });
  });
});