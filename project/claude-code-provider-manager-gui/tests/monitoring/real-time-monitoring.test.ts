/**
 * Real-time Monitoring System Tests
 * 实时监控系统测试
 */

import {
  SystemMonitor,
  ApplicationMonitor,
  UserExperienceMonitor,
  AlertSystem,
  DEFAULT_ALERT_RULES,
  type SystemMetrics,
  type Alert,
} from './monitoring-utils';

describe('Real-time Monitoring System', () => {
  let systemMonitor: SystemMonitor;
  let applicationMonitor: ApplicationMonitor;
  let uxMonitor: UserExperienceMonitor;
  let alertSystem: AlertSystem;

  beforeEach(() => {
    systemMonitor = SystemMonitor.getInstance();
    applicationMonitor = ApplicationMonitor.getInstance();
    uxMonitor = UserExperienceMonitor.getInstance();
    alertSystem = AlertSystem.getInstance();
    
    // 清理之前的数据
    systemMonitor.stopMonitoring();
    applicationMonitor.clearHistory();
    alertSystem.clearHistory();
  });

  afterEach(() => {
    systemMonitor.stopMonitoring();
  });

  describe('System Monitor', () => {
    it('should start and stop monitoring correctly', (done) => {
      let callbackCount = 0;
      const callback = (metrics: SystemMetrics) => {
        callbackCount++;
        expect(metrics).toHaveProperty('timestamp');
        expect(metrics).toHaveProperty('cpu');
        expect(metrics).toHaveProperty('memory');
        expect(metrics).toHaveProperty('disk');
        expect(metrics).toHaveProperty('network');
        
        if (callbackCount >= 2) {
          systemMonitor.stopMonitoring();
          done();
        }
      };

      systemMonitor.addCallback(callback);
      systemMonitor.startMonitoring(100); // 快速间隔用于测试
    }, 10000);

    it('should not start monitoring twice', () => {
      systemMonitor.startMonitoring(1000);
      systemMonitor.startMonitoring(500); // 第二次调用应该被忽略
      
      // 验证监控正在运行
      expect(systemMonitor['isMonitoring']).toBe(true);
      systemMonitor.stopMonitoring();
    });

    it('should manage callbacks correctly', () => {
      const callback1 = jest.fn();
      const callback2 = jest.fn();

      systemMonitor.addCallback(callback1);
      systemMonitor.addCallback(callback2);
      
      expect(systemMonitor['callbacks'].length).toBe(2);

      systemMonitor.removeCallback(callback1);
      expect(systemMonitor['callbacks'].length).toBe(1);
      expect(systemMonitor['callbacks'][0]).toBe(callback2);
    });

    it('should generate realistic system metrics', () => {
      const metrics = systemMonitor['collectSystemMetrics']();
      
      // CPU指标验证
      expect(metrics.cpu.usage).toBeGreaterThanOrEqual(0);
      expect(metrics.cpu.usage).toBeLessThanOrEqual(100);
      expect(metrics.cpu.loadAverage).toHaveLength(3);
      expect(metrics.cpu.cores).toBe(8);

      // 内存指标验证
      expect(metrics.memory.total).toBeGreaterThan(0);
      expect(metrics.memory.used).toBeGreaterThanOrEqual(0);
      expect(metrics.memory.used).toBeLessThanOrEqual(metrics.memory.total);

      // 磁盘指标验证
      expect(metrics.disk.total).toBeGreaterThan(0);
      expect(metrics.disk.used).toBeGreaterThanOrEqual(0);
      expect(metrics.disk.used).toBeLessThanOrEqual(metrics.disk.total);
      expect(metrics.disk.readSpeed).toBeGreaterThanOrEqual(0);
      expect(metrics.disk.writeSpeed).toBeGreaterThanOrEqual(0);

      // 网络指标验证
      expect(metrics.network.inbound).toBeGreaterThanOrEqual(0);
      expect(metrics.network.outbound).toBeGreaterThanOrEqual(0);
      expect(metrics.network.latency).toBeGreaterThan(0);
      expect(metrics.network.packetsLost).toBeGreaterThanOrEqual(0);

      // 进程指标验证
      expect(metrics.processes.total).toBeGreaterThan(0);
      expect(metrics.processes.running).toBeGreaterThanOrEqual(0);
      expect(metrics.processes.sleeping).toBeGreaterThanOrEqual(0);
      expect(metrics.processes.zombie).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Application Monitor', () => {
    it('should record and retrieve performance metrics', () => {
      applicationMonitor.recordPerformance('api_call', 150, { endpoint: '/api/providers' });
      applicationMonitor.recordPerformance('api_call', 200, { endpoint: '/api/providers' });
      applicationMonitor.recordPerformance('ui_render', 50, { component: 'ProviderCard' });

      const apiStats = applicationMonitor.getPerformanceStats('api_call');
      expect(apiStats.count).toBe(2);
      expect(apiStats.average).toBe(175);
      expect(apiStats.min).toBe(150);
      expect(apiStats.max).toBe(200);

      const allStats = applicationMonitor.getPerformanceStats();
      expect(allStats.count).toBe(3);
    });

    it('should record and categorize errors correctly', () => {
      const networkError = new Error('Network connection failed');
      const validationError = new Error('Invalid input provided');
      const securityError = new Error('Unauthorized access attempt');
      
      applicationMonitor.recordError(networkError, { operation: 'fetchProviders' });
      applicationMonitor.recordError(validationError, { field: 'providerName' });
      applicationMonitor.recordError(securityError, { userId: 'test123' });

      const errorStats = applicationMonitor.getErrorStats();
      expect(errorStats.totalErrors).toBe(3);
      expect(errorStats.errorsByType).toHaveProperty('Network');
      expect(errorStats.errorsByType).toHaveProperty('Validation');
      expect(errorStats.errorsByType).toHaveProperty('Security');
      expect(errorStats.errorsBySeverity).toHaveProperty('high');
    });

    it('should calculate percentiles correctly', () => {
      // 生成已知分布的性能数据
      const durations = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100];
      durations.forEach(duration => {
        applicationMonitor.recordPerformance('test_operation', duration);
      });

      const stats = applicationMonitor.getPerformanceStats('test_operation');
      expect(stats.count).toBe(10);
      expect(stats.average).toBe(55);
      expect(stats.min).toBe(10);
      expect(stats.max).toBe(100);
      expect(stats.p95).toBe(100); // 95th percentile
      expect(stats.p99).toBe(100); // 99th percentile
    });

    it('should maintain performance history with size limit', () => {
      // 记录超过限制的性能条目
      for (let i = 0; i < 1100; i++) {
        applicationMonitor.recordPerformance(`operation_${i}`, 100);
      }

      const allStats = applicationMonitor.getPerformanceStats();
      expect(allStats.count).toBeLessThanOrEqual(1000);
    });

    it('should maintain error history with size limit', () => {
      // 记录超过限制的错误
      for (let i = 0; i < 600; i++) {
        applicationMonitor.recordError(new Error(`Error ${i}`));
      }

      const errorStats = applicationMonitor.getErrorStats();
      expect(errorStats.totalErrors).toBeLessThanOrEqual(500);
    });
  });

  describe('User Experience Monitor', () => {
    it('should track complete user session lifecycle', () => {
      const sessionId = 'test-session-123';
      
      uxMonitor.startSession(sessionId, 'Mozilla/5.0 Test Browser');
      
      uxMonitor.recordUserAction(sessionId, {
        type: 'navigation',
        target: '/dashboard',
        details: { page: 'dashboard' }
      });

      uxMonitor.recordUserAction(sessionId, {
        type: 'task_start',
        target: 'add-provider',
        details: { taskId: 'provider-creation' }
      });

      uxMonitor.recordUserAction(sessionId, {
        type: 'form_submit',
        target: 'provider-form',
        details: { formData: { name: 'Test Provider' } }
      });

      uxMonitor.recordUserAction(sessionId, {
        type: 'task_complete',
        target: 'add-provider',
        details: { taskId: 'provider-creation' }
      });

      const summary = uxMonitor.endSession(sessionId, true);
      
      expect(summary).toBeDefined();
      expect(summary!.sessionId).toBe(sessionId);
      expect(summary!.actionCount).toBe(4);
      expect(summary!.completed).toBe(true);
      expect(summary!.taskCompletionRate).toBe(100);
      expect(summary!.errorCount).toBe(0);
    });

    it('should calculate user experience statistics', () => {
      // 创建多个用户会话以获得统计数据
      const sessions = ['session1', 'session2', 'session3'];
      
      sessions.forEach((sessionId, index) => {
        uxMonitor.startSession(sessionId);
        
        uxMonitor.recordUserAction(sessionId, {
          type: 'task_start',
          target: 'test-task',
          details: { taskId: `task-${index}` }
        });

        if (index < 2) { // 前两个会话成功完成任务
          uxMonitor.recordUserAction(sessionId, {
            type: 'task_complete',
            target: 'test-task',
            details: { taskId: `task-${index}` }
          });
        } else { // 第三个会话包含错误
          uxMonitor.recordUserAction(sessionId, {
            type: 'error',
            target: 'test-task',
            details: { error: 'Validation failed' }
          });
        }

        uxMonitor.endSession(sessionId, index < 2);
      });

      const stats = uxMonitor.getUXStats();
      
      expect(stats.totalSessions).toBe(3);
      expect(stats.taskCompletionRate).toBeCloseTo(66.67, 1); // 2/3 = 66.67%
      expect(stats.errorRate).toBeCloseTo(16.67, 1); // 1/6 = 16.67%
    });

    it('should record and analyze usability metrics', () => {
      uxMonitor.recordUsabilityMetric({
        taskId: 'provider-creation',
        completionTime: 30000,
        errorCount: 0,
        satisfactionScore: 8,
        difficultyRating: 2,
      });

      uxMonitor.recordUsabilityMetric({
        taskId: 'provider-validation',
        completionTime: 15000,
        errorCount: 1,
        satisfactionScore: 6,
        difficultyRating: 4,
      });

      const stats = uxMonitor.getUXStats();
      expect(stats.userSatisfactionScore).toBe(7); // (8 + 6) / 2 = 7
    });

    it('should handle session not found gracefully', () => {
      const result = uxMonitor.recordUserAction('non-existent-session', {
        type: 'click',
        target: 'test-button'
      });

      // 应该不抛出错误，只是记录警告
      expect(result).toBeUndefined();
    });

    it('should calculate bounce rate correctly', () => {
      // 创建一个会话只有1个行为（反弹）
      uxMonitor.startSession('bounce-session');
      uxMonitor.recordUserAction('bounce-session', {
        type: 'navigation',
        target: '/dashboard'
      });
      uxMonitor.endSession('bounce-session', false);

      // 创建一个会话有多个行为（非反弹）
      uxMonitor.startSession('normal-session');
      uxMonitor.recordUserAction('normal-session', {
        type: 'navigation',
        target: '/dashboard'
      });
      uxMonitor.recordUserAction('normal-session', {
        type: 'click',
        target: 'add-provider'
      });
      uxMonitor.endSession('normal-session', true);

      const stats = uxMonitor.getUXStats();
      expect(stats.bounceRate).toBe(50); // 1 bounce out of 2 sessions = 50%
    });
  });

  describe('Alert System', () => {
    beforeEach(() => {
      // 添加默认告警规则
      DEFAULT_ALERT_RULES.forEach(rule => {
        alertSystem.addRule(rule);
      });
    });

    it('should trigger alerts based on rules', () => {
      const callback = jest.fn();
      alertSystem.addCallback(callback);

      // 创建触发高CPU使用率告警的指标
      const metrics = {
        systemHealth: { cpu: 95, memory: 50 },
        applicationHealth: { responseTime: 1000, errorRate: 2 },
        userExperience: { taskCompletionRate: 85 },
        securityMetrics: { authenticationFailures: 2 }
      };

      alertSystem.checkMetrics(metrics);

      expect(callback).toHaveBeenCalledTimes(1);
      
      const alerts = alertSystem.getUnacknowledgedAlerts();
      expect(alerts.length).toBe(1);
      expect(alerts[0].title).toBe('High CPU Usage');
      expect(alerts[0].severity).toBe('high');
    });

    it('should trigger multiple alerts for multiple threshold breaches', () => {
      const callback = jest.fn();
      alertSystem.addCallback(callback);

      // 创建触发多个告警的指标
      const metrics = {
        systemHealth: { cpu: 95, memory: 90 },
        applicationHealth: { responseTime: 6000, errorRate: 15 },
        userExperience: { taskCompletionRate: 60 },
        securityMetrics: { authenticationFailures: 15 }
      };

      alertSystem.checkMetrics(metrics);

      // 应该触发多个告警
      expect(callback).toHaveBeenCalledTimes(6); // 6个规则被触发
      
      const alerts = alertSystem.getUnacknowledgedAlerts();
      expect(alerts.length).toBe(6);
      
      const severities = alerts.map(a => a.severity);
      expect(severities).toContain('high');
      expect(severities).toContain('medium');
      expect(severities).toContain('critical');
    });

    it('should acknowledge alerts correctly', () => {
      const metrics = {
        systemHealth: { cpu: 95, memory: 50 },
        applicationHealth: { responseTime: 1000, errorRate: 2 },
        userExperience: { taskCompletionRate: 85 },
        securityMetrics: { authenticationFailures: 2 }
      };

      alertSystem.checkMetrics(metrics);
      
      const alerts = alertSystem.getUnacknowledgedAlerts();
      expect(alerts.length).toBe(1);
      
      const alertId = alerts[0].id;
      const acknowledged = alertSystem.acknowledgeAlert(alertId);
      
      expect(acknowledged).toBe(true);
      expect(alertSystem.getUnacknowledgedAlerts().length).toBe(0);
    });

    it('should manage alert rules correctly', () => {
      const customRule = {
        id: 'custom_rule',
        title: 'Custom Alert',
        message: 'Custom condition met',
        severity: 'medium' as const,
        condition: (metrics: any) => metrics.custom > 100
      };

      alertSystem.addRule(customRule);
      
      // 验证规则已添加
      expect(alertSystem['rules']).toContainEqual(customRule);
      
      // 触发自定义规则
      const metrics = { custom: 150 };
      alertSystem.checkMetrics(metrics);
      
      const alerts = alertSystem.getUnacknowledgedAlerts();
      expect(alerts.some(a => a.ruleId === 'custom_rule')).toBe(true);
      
      // 移除规则
      alertSystem.removeRule('custom_rule');
      expect(alertSystem['rules']).not.toContainEqual(customRule);
    });

    it('should maintain alert history with size limit', () => {
      const metrics = {
        systemHealth: { cpu: 95, memory: 50 },
        applicationHealth: { responseTime: 1000, errorRate: 2 },
        userExperience: { taskCompletionRate: 85 },
        securityMetrics: { authenticationFailures: 2 }
      };

      // 触发大量告警
      for (let i = 0; i < 600; i++) {
        alertSystem.checkMetrics(metrics);
      }

      const allAlerts = alertSystem.getAllAlerts();
      expect(allAlerts.length).toBeLessThanOrEqual(500);
    });

    it('should manage callbacks correctly', () => {
      const callback1 = jest.fn();
      const callback2 = jest.fn();

      alertSystem.addCallback(callback1);
      alertSystem.addCallback(callback2);

      const metrics = {
        systemHealth: { cpu: 95, memory: 50 },
        applicationHealth: { responseTime: 1000, errorRate: 2 },
        userExperience: { taskCompletionRate: 85 },
        securityMetrics: { authenticationFailures: 2 }
      };

      alertSystem.checkMetrics(metrics);

      expect(callback1).toHaveBeenCalledTimes(1);
      expect(callback2).toHaveBeenCalledTimes(1);

      alertSystem.removeCallback(callback1);
      alertSystem.checkMetrics(metrics);

      expect(callback1).toHaveBeenCalledTimes(1); // 仍然是1次
      expect(callback2).toHaveBeenCalledTimes(2); // 现在是2次
    });
  });

  describe('Integration Testing', () => {
    it('should integrate all monitoring components', (done) => {
      let alertCount = 0;
      
      // 设置告警系统
      DEFAULT_ALERT_RULES.forEach(rule => {
        alertSystem.addRule(rule);
      });

      alertSystem.addCallback((alert: Alert) => {
        alertCount++;
        expect(alert).toHaveProperty('id');
        expect(alert).toHaveProperty('severity');
        
        if (alertCount >= 1) {
          systemMonitor.stopMonitoring();
          done();
        }
      });

      // 设置系统监控
      systemMonitor.addCallback((metrics: SystemMetrics) => {
        // 记录应用性能
        applicationMonitor.recordPerformance('system_check', 100);
        
        // 模拟高CPU使用率以触发告警
        const testMetrics = {
          systemHealth: { cpu: 95, memory: metrics.memory.used / metrics.memory.total * 100 },
          applicationHealth: { responseTime: 1000, errorRate: 2 },
          userExperience: { taskCompletionRate: 85 },
          securityMetrics: { authenticationFailures: 2 }
        };

        alertSystem.checkMetrics(testMetrics);
      });

      systemMonitor.startMonitoring(200);
    }, 10000);

    it('should provide comprehensive monitoring data', () => {
      // 记录各种监控数据
      applicationMonitor.recordPerformance('api_call', 150);
      applicationMonitor.recordError(new Error('Test error'));

      uxMonitor.startSession('integration-session');
      uxMonitor.recordUserAction('integration-session', {
        type: 'task_start',
        target: 'test-task'
      });
      uxMonitor.recordUserAction('integration-session', {
        type: 'task_complete',
        target: 'test-task'
      });
      const sessionSummary = uxMonitor.endSession('integration-session', true);

      DEFAULT_ALERT_RULES.forEach(rule => {
        alertSystem.addRule(rule);
      });

      const highLoadMetrics = {
        systemHealth: { cpu: 95, memory: 90 },
        applicationHealth: { responseTime: 6000, errorRate: 15 },
        userExperience: { taskCompletionRate: 60 },
        securityMetrics: { authenticationFailures: 15 }
      };

      alertSystem.checkMetrics(highLoadMetrics);

      // 验证所有系统都有数据
      const perfStats = applicationMonitor.getPerformanceStats();
      const errorStats = applicationMonitor.getErrorStats();
      const uxStats = uxMonitor.getUXStats();
      const alerts = alertSystem.getUnacknowledgedAlerts();

      expect(perfStats.count).toBeGreaterThan(0);
      expect(errorStats.totalErrors).toBeGreaterThan(0);
      expect(uxStats.totalSessions).toBeGreaterThan(0);
      expect(alerts.length).toBeGreaterThan(0);
      expect(sessionSummary).toBeDefined();
    });
  });
});