/**
 * Intelligent Monitoring Utilities
 * 智能监控工具类
 */

// 系统性能监控器
export class SystemMonitor {
  private static instance: SystemMonitor;
  private isMonitoring = false;
  private monitoringInterval?: NodeJS.Timeout;
  private callbacks: Array<(metrics: SystemMetrics) => void> = [];

  static getInstance(): SystemMonitor {
    if (!SystemMonitor.instance) {
      SystemMonitor.instance = new SystemMonitor();
    }
    return SystemMonitor.instance;
  }

  // 开始监控
  startMonitoring(interval: number = 5000): void {
    if (this.isMonitoring) {
      return;
    }

    this.isMonitoring = true;
    this.monitoringInterval = setInterval(() => {
      const metrics = this.collectSystemMetrics();
      this.callbacks.forEach(callback => callback(metrics));
    }, interval);
  }

  // 停止监控
  stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = undefined;
    }
    this.isMonitoring = false;
  }

  // 添加监控回调
  addCallback(callback: (metrics: SystemMetrics) => void): void {
    this.callbacks.push(callback);
  }

  // 移除监控回调
  removeCallback(callback: (metrics: SystemMetrics) => void): void {
    const index = this.callbacks.indexOf(callback);
    if (index > -1) {
      this.callbacks.splice(index, 1);
    }
  }

  // 收集系统指标
  private collectSystemMetrics(): SystemMetrics {
    // 在实际环境中，这些数据应该来自真实的系统API
    return {
      timestamp: Date.now(),
      cpu: {
        usage: this.simulateCpuUsage(),
        loadAverage: [1.2, 1.5, 1.8],
        cores: 8,
      },
      memory: {
        total: 16 * 1024 * 1024 * 1024, // 16GB
        used: this.simulateMemoryUsage(),
        free: 0, // 计算得出
        cached: 0,
      },
      disk: {
        total: 500 * 1024 * 1024 * 1024, // 500GB
        used: this.simulateDiskUsage(),
        free: 0, // 计算得出
        readSpeed: Math.random() * 100,
        writeSpeed: Math.random() * 80,
      },
      network: {
        inbound: Math.random() * 1000000, // bytes/sec
        outbound: Math.random() * 1000000,
        latency: Math.random() * 50 + 10, // 10-60ms
        packetsLost: Math.floor(Math.random() * 3),
      },
      processes: {
        total: Math.floor(Math.random() * 200 + 100),
        running: Math.floor(Math.random() * 50 + 20),
        sleeping: Math.floor(Math.random() * 150 + 80),
        zombie: Math.floor(Math.random() * 3),
      },
    };
  }

  private simulateCpuUsage(): number {
    // 模拟CPU使用率，带有一些波动
    const baseUsage = 20;
    const variation = Math.sin(Date.now() / 10000) * 30 + Math.random() * 20;
    return Math.max(0, Math.min(100, baseUsage + variation));
  }

  private simulateMemoryUsage(): number {
    const total = 16 * 1024 * 1024 * 1024;
    const baseUsage = 0.6; // 60%基础使用率
    const variation = Math.random() * 0.2; // ±20%变化
    return Math.floor(total * (baseUsage + variation));
  }

  private simulateDiskUsage(): number {
    const total = 500 * 1024 * 1024 * 1024;
    const baseUsage = 0.4; // 40%基础使用率
    const variation = Math.random() * 0.1; // ±10%变化
    return Math.floor(total * (baseUsage + variation));
  }
}

// 应用性能监控器
export class ApplicationMonitor {
  private static instance: ApplicationMonitor;
  private performanceEntries: PerformanceEntry[] = [];
  private customMetrics: Map<string, number[]> = new Map();
  private errorTracking: ApplicationError[] = [];

  static getInstance(): ApplicationMonitor {
    if (!ApplicationMonitor.instance) {
      ApplicationMonitor.instance = new ApplicationMonitor();
    }
    return ApplicationMonitor.instance;
  }

  // 记录性能指标
  recordPerformance(name: string, duration: number, details?: any): void {
    const entry: PerformanceEntry = {
      name,
      duration,
      timestamp: Date.now(),
      details,
    };

    this.performanceEntries.push(entry);
    
    // 保持最近1000条记录
    if (this.performanceEntries.length > 1000) {
      this.performanceEntries.shift();
    }

    // 更新自定义指标
    if (!this.customMetrics.has(name)) {
      this.customMetrics.set(name, []);
    }
    const metrics = this.customMetrics.get(name)!;
    metrics.push(duration);
    if (metrics.length > 100) {
      metrics.shift();
    }
  }

  // 记录错误
  recordError(error: Error, context?: any): void {
    const appError: ApplicationError = {
      message: error.message,
      stack: error.stack,
      timestamp: Date.now(),
      context,
      severity: this.determineSeverity(error),
    };

    this.errorTracking.push(appError);
    
    // 保持最近500条错误记录
    if (this.errorTracking.length > 500) {
      this.errorTracking.shift();
    }
  }

  // 获取性能统计
  getPerformanceStats(name?: string): PerformanceStats {
    const entries = name 
      ? this.performanceEntries.filter(e => e.name === name)
      : this.performanceEntries;

    if (entries.length === 0) {
      return {
        count: 0,
        average: 0,
        min: 0,
        max: 0,
        p95: 0,
        p99: 0,
      };
    }

    const durations = entries.map(e => e.duration).sort((a, b) => a - b);
    const sum = durations.reduce((acc, val) => acc + val, 0);

    return {
      count: entries.length,
      average: sum / entries.length,
      min: durations[0],
      max: durations[durations.length - 1],
      p95: durations[Math.floor(durations.length * 0.95)],
      p99: durations[Math.floor(durations.length * 0.99)],
    };
  }

  // 获取错误统计
  getErrorStats(timeWindow?: number): ErrorStats {
    const now = Date.now();
    const windowStart = timeWindow ? now - timeWindow : 0;
    
    const recentErrors = this.errorTracking.filter(e => e.timestamp >= windowStart);
    
    const errorsByType = new Map<string, number>();
    const errorsBySeverity = new Map<string, number>();
    
    recentErrors.forEach(error => {
      const type = this.getErrorType(error.message);
      errorsByType.set(type, (errorsByType.get(type) || 0) + 1);
      errorsBySeverity.set(error.severity, (errorsBySeverity.get(error.severity) || 0) + 1);
    });

    return {
      totalErrors: recentErrors.length,
      errorRate: recentErrors.length / Math.max(1, this.performanceEntries.length) * 100,
      errorsByType: Object.fromEntries(errorsByType),
      errorsBySeverity: Object.fromEntries(errorsBySeverity),
      recentErrors: recentErrors.slice(-10), // 最近10个错误
    };
  }

  // 清除历史数据
  clearHistory(): void {
    this.performanceEntries = [];
    this.customMetrics.clear();
    this.errorTracking = [];
  }

  private determineSeverity(error: Error): 'low' | 'medium' | 'high' | 'critical' {
    const message = error.message.toLowerCase();
    
    if (message.includes('critical') || message.includes('fatal') || message.includes('security')) {
      return 'critical';
    }
    if (message.includes('error') || message.includes('failed') || message.includes('exception')) {
      return 'high';
    }
    if (message.includes('warning') || message.includes('deprecated')) {
      return 'medium';
    }
    return 'low';
  }

  private getErrorType(message: string): string {
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('network') || lowerMessage.includes('connection')) {
      return 'Network';
    }
    if (lowerMessage.includes('validation') || lowerMessage.includes('invalid')) {
      return 'Validation';
    }
    if (lowerMessage.includes('permission') || lowerMessage.includes('unauthorized')) {
      return 'Security';
    }
    if (lowerMessage.includes('timeout') || lowerMessage.includes('slow')) {
      return 'Performance';
    }
    return 'Application';
  }
}

// 用户体验监控器
export class UserExperienceMonitor {
  private static instance: UserExperienceMonitor;
  private userSessions: Map<string, UserSession> = new Map();
  private userActions: UserAction[] = [];
  private usabilityMetrics: UsabilityMetrics[] = [];

  static getInstance(): UserExperienceMonitor {
    if (!UserExperienceMonitor.instance) {
      UserExperienceMonitor.instance = new UserExperienceMonitor();
    }
    return UserExperienceMonitor.instance;
  }

  // 开始用户会话
  startSession(sessionId: string, userAgent?: string): void {
    const session: UserSession = {
      id: sessionId,
      startTime: Date.now(),
      userAgent,
      actions: [],
      completed: false,
    };
    
    this.userSessions.set(sessionId, session);
  }

  // 记录用户行为
  recordUserAction(sessionId: string, action: Omit<UserAction, 'timestamp' | 'sessionId'>): void {
    const session = this.userSessions.get(sessionId);
    if (!session) {
      console.warn(`Session ${sessionId} not found`);
      return;
    }

    const userAction: UserAction = {
      ...action,
      sessionId,
      timestamp: Date.now(),
    };

    session.actions.push(userAction);
    this.userActions.push(userAction);
    
    // 保持最近1000条用户行为记录
    if (this.userActions.length > 1000) {
      this.userActions.shift();
    }
  }

  // 结束用户会话
  endSession(sessionId: string, completed: boolean = true): UserSessionSummary | null {
    const session = this.userSessions.get(sessionId);
    if (!session) {
      return null;
    }

    session.endTime = Date.now();
    session.completed = completed;

    const summary: UserSessionSummary = {
      sessionId,
      duration: session.endTime - session.startTime,
      actionCount: session.actions.length,
      completed,
      taskCompletionRate: this.calculateTaskCompletionRate(session),
      averageActionTime: this.calculateAverageActionTime(session),
      errorCount: session.actions.filter(a => a.type === 'error').length,
    };

    // 移除会话以节省内存
    this.userSessions.delete(sessionId);

    return summary;
  }

  // 记录可用性指标
  recordUsabilityMetric(metric: Omit<UsabilityMetrics, 'timestamp'>): void {
    const usabilityMetric: UsabilityMetrics = {
      ...metric,
      timestamp: Date.now(),
    };

    this.usabilityMetrics.push(usabilityMetric);
    
    // 保持最近100条可用性指标
    if (this.usabilityMetrics.length > 100) {
      this.usabilityMetrics.shift();
    }
  }

  // 获取用户体验统计
  getUXStats(timeWindow?: number): UXStats {
    const now = Date.now();
    const windowStart = timeWindow ? now - timeWindow : 0;
    
    const recentActions = this.userActions.filter(a => a.timestamp >= windowStart);
    const recentMetrics = this.usabilityMetrics.filter(m => m.timestamp >= windowStart);
    
    const totalSessions = new Set(recentActions.map(a => a.sessionId)).size;
    const completedTasks = recentActions.filter(a => a.type === 'task_complete').length;
    const totalTasks = recentActions.filter(a => a.type === 'task_start').length;
    const errors = recentActions.filter(a => a.type === 'error').length;

    return {
      totalSessions,
      averageSessionDuration: this.calculateAverageSessionDuration(recentActions),
      taskCompletionRate: totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0,
      errorRate: recentActions.length > 0 ? (errors / recentActions.length) * 100 : 0,
      averageTaskTime: this.calculateAverageTaskDuration(recentActions),
      userSatisfactionScore: this.calculateAverageSatisfaction(recentMetrics),
      bounceRate: this.calculateBounceRate(recentActions),
    };
  }

  private calculateTaskCompletionRate(session: UserSession): number {
    const taskStarts = session.actions.filter(a => a.type === 'task_start').length;
    const taskCompletes = session.actions.filter(a => a.type === 'task_complete').length;
    return taskStarts > 0 ? (taskCompletes / taskStarts) * 100 : 0;
  }

  private calculateAverageActionTime(session: UserSession): number {
    if (session.actions.length < 2) return 0;
    
    const intervals = [];
    for (let i = 1; i < session.actions.length; i++) {
      intervals.push(session.actions[i].timestamp - session.actions[i - 1].timestamp);
    }
    
    return intervals.reduce((sum, interval) => sum + interval, 0) / intervals.length;
  }

  private calculateAverageSessionDuration(actions: UserAction[]): number {
    const sessionDurations = new Map<string, { start: number; end: number }>();
    
    actions.forEach(action => {
      if (!sessionDurations.has(action.sessionId)) {
        sessionDurations.set(action.sessionId, { start: action.timestamp, end: action.timestamp });
      } else {
        const session = sessionDurations.get(action.sessionId)!;
        session.start = Math.min(session.start, action.timestamp);
        session.end = Math.max(session.end, action.timestamp);
      }
    });

    const durations = Array.from(sessionDurations.values()).map(s => s.end - s.start);
    return durations.length > 0 ? durations.reduce((sum, d) => sum + d, 0) / durations.length : 0;
  }

  private calculateAverageTaskDuration(actions: UserAction[]): number {
    const taskDurations: number[] = [];
    const taskStarts = new Map<string, number>();
    
    actions.forEach(action => {
      if (action.type === 'task_start') {
        taskStarts.set(`${action.sessionId}_${action.details?.taskId || 'default'}`, action.timestamp);
      } else if (action.type === 'task_complete') {
        const key = `${action.sessionId}_${action.details?.taskId || 'default'}`;
        const startTime = taskStarts.get(key);
        if (startTime) {
          taskDurations.push(action.timestamp - startTime);
          taskStarts.delete(key);
        }
      }
    });

    return taskDurations.length > 0 ? taskDurations.reduce((sum, d) => sum + d, 0) / taskDurations.length : 0;
  }

  private calculateAverageSatisfaction(metrics: UsabilityMetrics[]): number {
    const satisfactionScores = metrics
      .filter(m => m.satisfactionScore !== undefined)
      .map(m => m.satisfactionScore!);
    
    return satisfactionScores.length > 0 
      ? satisfactionScores.reduce((sum, score) => sum + score, 0) / satisfactionScores.length 
      : 0;
  }

  private calculateBounceRate(actions: UserAction[]): number {
    const sessionActionCounts = new Map<string, number>();
    
    actions.forEach(action => {
      sessionActionCounts.set(action.sessionId, (sessionActionCounts.get(action.sessionId) || 0) + 1);
    });

    const totalSessions = sessionActionCounts.size;
    const bouncedSessions = Array.from(sessionActionCounts.values()).filter(count => count <= 1).length;
    
    return totalSessions > 0 ? (bouncedSessions / totalSessions) * 100 : 0;
  }
}

// 智能告警系统
export class AlertSystem {
  private static instance: AlertSystem;
  private alerts: Alert[] = [];
  private rules: AlertRule[] = [];
  private callbacks: Array<(alert: Alert) => void> = [];

  static getInstance(): AlertSystem {
    if (!AlertSystem.instance) {
      AlertSystem.instance = new AlertSystem();
    }
    return AlertSystem.instance;
  }

  // 添加告警规则
  addRule(rule: AlertRule): void {
    this.rules.push(rule);
  }

  // 移除告警规则
  removeRule(ruleId: string): void {
    this.rules = this.rules.filter(rule => rule.id !== ruleId);
  }

  // 检查指标并触发告警
  checkMetrics(metrics: any): void {
    this.rules.forEach(rule => {
      const shouldAlert = rule.condition(metrics);
      if (shouldAlert) {
        this.createAlert(rule, metrics);
      }
    });
  }

  // 创建告警
  private createAlert(rule: AlertRule, metrics: any): void {
    const alert: Alert = {
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ruleId: rule.id,
      title: rule.title,
      message: rule.message,
      severity: rule.severity,
      timestamp: Date.now(),
      metrics,
      acknowledged: false,
    };

    this.alerts.push(alert);
    
    // 保持最近500条告警
    if (this.alerts.length > 500) {
      this.alerts.shift();
    }

    // 通知回调
    this.callbacks.forEach(callback => callback(alert));
  }

  // 确认告警
  acknowledgeAlert(alertId: string): boolean {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert) {
      alert.acknowledged = true;
      return true;
    }
    return false;
  }

  // 获取未确认的告警
  getUnacknowledgedAlerts(): Alert[] {
    return this.alerts.filter(alert => !alert.acknowledged);
  }

  // 获取所有告警
  getAllAlerts(limit?: number): Alert[] {
    const sortedAlerts = this.alerts.sort((a, b) => b.timestamp - a.timestamp);
    return limit ? sortedAlerts.slice(0, limit) : sortedAlerts;
  }

  // 添加告警回调
  addCallback(callback: (alert: Alert) => void): void {
    this.callbacks.push(callback);
  }

  // 移除告警回调
  removeCallback(callback: (alert: Alert) => void): void {
    const index = this.callbacks.indexOf(callback);
    if (index > -1) {
      this.callbacks.splice(index, 1);
    }
  }

  // 清除历史告警
  clearHistory(): void {
    this.alerts = [];
  }
}

// 类型定义
export interface SystemMetrics {
  timestamp: number;
  cpu: {
    usage: number;
    loadAverage: number[];
    cores: number;
  };
  memory: {
    total: number;
    used: number;
    free: number;
    cached: number;
  };
  disk: {
    total: number;
    used: number;
    free: number;
    readSpeed: number;
    writeSpeed: number;
  };
  network: {
    inbound: number;
    outbound: number;
    latency: number;
    packetsLost: number;
  };
  processes: {
    total: number;
    running: number;
    sleeping: number;
    zombie: number;
  };
}

export interface PerformanceEntry {
  name: string;
  duration: number;
  timestamp: number;
  details?: any;
}

export interface ApplicationError {
  message: string;
  stack?: string;
  timestamp: number;
  context?: any;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export interface PerformanceStats {
  count: number;
  average: number;
  min: number;
  max: number;
  p95: number;
  p99: number;
}

export interface ErrorStats {
  totalErrors: number;
  errorRate: number;
  errorsByType: Record<string, number>;
  errorsBySeverity: Record<string, number>;
  recentErrors: ApplicationError[];
}

export interface UserSession {
  id: string;
  startTime: number;
  endTime?: number;
  userAgent?: string;
  actions: UserAction[];
  completed: boolean;
}

export interface UserAction {
  sessionId: string;
  type: 'click' | 'navigation' | 'task_start' | 'task_complete' | 'error' | 'form_submit';
  target?: string;
  timestamp: number;
  details?: any;
}

export interface UserSessionSummary {
  sessionId: string;
  duration: number;
  actionCount: number;
  completed: boolean;
  taskCompletionRate: number;
  averageActionTime: number;
  errorCount: number;
}

export interface UsabilityMetrics {
  timestamp: number;
  taskId?: string;
  completionTime?: number;
  errorCount?: number;
  satisfactionScore?: number; // 1-10
  difficultyRating?: number; // 1-5
}

export interface UXStats {
  totalSessions: number;
  averageSessionDuration: number;
  taskCompletionRate: number;
  errorRate: number;
  averageTaskTime: number;
  userSatisfactionScore: number;
  bounceRate: number;
}

export interface Alert {
  id: string;
  ruleId: string;
  title: string;
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: number;
  metrics: any;
  acknowledged: boolean;
}

export interface AlertRule {
  id: string;
  title: string;
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  condition: (metrics: any) => boolean;
}

// 预定义的告警规则
export const DEFAULT_ALERT_RULES: AlertRule[] = [
  {
    id: 'high_cpu_usage',
    title: 'High CPU Usage',
    message: 'CPU usage is above 90%',
    severity: 'high',
    condition: (metrics) => metrics.systemHealth?.cpu > 90,
  },
  {
    id: 'high_memory_usage',
    title: 'High Memory Usage',
    message: 'Memory usage is above 85%',
    severity: 'high',
    condition: (metrics) => metrics.systemHealth?.memory > 85,
  },
  {
    id: 'slow_response_time',
    title: 'Slow Response Time',
    message: 'Response time is above 5 seconds',
    severity: 'medium',
    condition: (metrics) => metrics.applicationHealth?.responseTime > 5000,
  },
  {
    id: 'high_error_rate',
    title: 'High Error Rate',
    message: 'Error rate is above 10%',
    severity: 'high',
    condition: (metrics) => metrics.applicationHealth?.errorRate > 10,
  },
  {
    id: 'low_task_completion',
    title: 'Low Task Completion Rate',
    message: 'Task completion rate is below 70%',
    severity: 'medium',
    condition: (metrics) => metrics.userExperience?.taskCompletionRate < 70,
  },
  {
    id: 'security_breach',
    title: 'Security Breach Detected',
    message: 'High number of authentication failures',
    severity: 'critical',
    condition: (metrics) => metrics.securityMetrics?.authenticationFailures > 10,
  },
];