import { performance } from 'perf_hooks';

// 性能监控指标
export interface PerformanceMetrics {
  name: string;
  duration: number;
  memory: {
    used: number;
    total: number;
    percentage: number;
  };
  timestamp: number;
  metadata?: Record<string, any>;
}

// 性能分析器
export class PerformanceProfiler {
  private metrics: PerformanceMetrics[] = [];
  private timers: Map<string, number> = new Map();
  private isEnabled: boolean = true;

  constructor(enabled: boolean = true) {
    this.isEnabled = enabled;
  }

  // 开始计时
  startTimer(name: string): void {
    if (!this.isEnabled) return;
    
    this.timers.set(name, performance.now());
  }

  // 结束计时并记录指标
  endTimer(name: string, metadata?: Record<string, any>): number {
    if (!this.isEnabled) return 0;
    
    const startTime = this.timers.get(name);
    if (!startTime) {
      console.warn(`No timer found for: ${name}`);
      return 0;
    }
    
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    const memoryUsage = process.memoryUsage();
    const metrics: PerformanceMetrics = {
      name,
      duration,
      memory: {
        used: memoryUsage.heapUsed,
        total: memoryUsage.heapTotal,
        percentage: (memoryUsage.heapUsed / memoryUsage.heapTotal) * 100,
      },
      timestamp: Date.now(),
      metadata,
    };
    
    this.metrics.push(metrics);
    this.timers.delete(name);
    
    return duration;
  }

  // 测量异步函数性能
  async measureAsync<T>(
    name: string,
    fn: () => Promise<T>,
    metadata?: Record<string, any>
  ): Promise<T> {
    if (!this.isEnabled) return fn();
    
    this.startTimer(name);
    
    try {
      const result = await fn();
      this.endTimer(name, metadata);
      return result;
    } catch (error) {
      this.endTimer(name, { ...metadata, error: error instanceof Error ? error.message : error });
      throw error;
    }
  }

  // 测量同步函数性能
  measureSync<T>(
    name: string,
    fn: () => T,
    metadata?: Record<string, any>
  ): T {
    if (!this.isEnabled) return fn();
    
    this.startTimer(name);
    
    try {
      const result = fn();
      this.endTimer(name, metadata);
      return result;
    } catch (error) {
      this.endTimer(name, { ...metadata, error: error instanceof Error ? error.message : error });
      throw error;
    }
  }

  // 获取性能指标
  getMetrics(name?: string): PerformanceMetrics[] {
    if (name) {
      return this.metrics.filter(m => m.name === name);
    }
    return [...this.metrics];
  }

  // 获取性能统计
  getStats(name?: string): {
    count: number;
    average: number;
    min: number;
    max: number;
    total: number;
    memory: {
      averageUsed: number;
      averageTotal: number;
      averagePercentage: number;
    };
  } {
    const metrics = name ? this.getMetrics(name) : this.metrics;
    
    if (metrics.length === 0) {
      return {
        count: 0,
        average: 0,
        min: 0,
        max: 0,
        total: 0,
        memory: {
          averageUsed: 0,
          averageTotal: 0,
          averagePercentage: 0,
        },
      };
    }
    
    const durations = metrics.map(m => m.duration);
    const memoryUsed = metrics.map(m => m.memory.used);
    const memoryTotal = metrics.map(m => m.memory.total);
    const memoryPercentage = metrics.map(m => m.memory.percentage);
    
    return {
      count: metrics.length,
      average: durations.reduce((a, b) => a + b, 0) / durations.length,
      min: Math.min(...durations),
      max: Math.max(...durations),
      total: durations.reduce((a, b) => a + b, 0),
      memory: {
        averageUsed: memoryUsed.reduce((a, b) => a + b, 0) / memoryUsed.length,
        averageTotal: memoryTotal.reduce((a, b) => a + b, 0) / memoryTotal.length,
        averagePercentage: memoryPercentage.reduce((a, b) => a + b, 0) / memoryPercentage.length,
      },
    };
  }

  // 清理指标
  clearMetrics(name?: string): void {
    if (name) {
      this.metrics = this.metrics.filter(m => m.name !== name);
    } else {
      this.metrics = [];
    }
  }

  // 导出性能报告
  exportReport(): string {
    const report = {
      timestamp: new Date().toISOString(),
      metrics: this.metrics,
      stats: {
        overall: this.getStats(),
        byName: this.getMetricNames().reduce((acc, name) => {
          acc[name] = this.getStats(name);
          return acc;
        }, {} as Record<string, any>),
      },
    };
    
    return JSON.stringify(report, null, 2);
  }

  // 获取所有指标名称
  private getMetricNames(): string[] {
    return Array.from(new Set(this.metrics.map(m => m.name)));
  }

  // 启用/禁用性能分析
  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
  }

  // 检查是否启用
  isEnabledProfiler(): boolean {
    return this.isEnabled;
  }
}

// 创建全局性能分析器实例
export const performanceProfiler = new PerformanceProfiler(process.env.NODE_ENV === 'development');

// 性能装饰器
export function profile(name: string, metadata?: Record<string, any>) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      return await performanceProfiler.measureAsync(
        name,
        () => originalMethod.apply(this, args),
        metadata
      );
    };

    return descriptor;
  };
}

// 同步性能装饰器
export function profileSync(name: string, metadata?: Record<string, any>) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = function (...args: any[]) {
      return performanceProfiler.measureSync(
        name,
        () => originalMethod.apply(this, args),
        metadata
      );
    };

    return descriptor;
  };
}

// 性能监控工具
export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: Map<string, number[]> = new Map();
  private thresholds: Map<string, number> = new Map();
  private alerts: ((metric: string, value: number, threshold: number) => void)[] = [];

  private constructor() {
    this.setupDefaultThresholds();
    this.startMonitoring();
  }

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  private setupDefaultThresholds(): void {
    this.thresholds.set('memoryUsage', 90); // 90% memory usage
    this.thresholds.set('responseTime', 1000); // 1 second response time
    this.thresholds.set('cpuUsage', 80); // 80% CPU usage
  }

  private startMonitoring(): void {
    // 监控内存使用
    setInterval(() => {
      const memoryUsage = process.memoryUsage();
      const memoryPercentage = (memoryUsage.heapUsed / memoryUsage.heapTotal) * 100;
      
      this.recordMetric('memoryUsage', memoryPercentage);
      this.checkThreshold('memoryUsage', memoryPercentage);
    }, 5000);

    // 监控事件循环延迟
    setInterval(() => {
      const start = performance.now();
      setImmediate(() => {
        const delay = performance.now() - start;
        this.recordMetric('eventLoopDelay', delay);
        this.checkThreshold('eventLoopDelay', delay);
      });
    }, 1000);
  }

  private recordMetric(name: string, value: number): void {
    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }
    
    const values = this.metrics.get(name)!;
    values.push(value);
    
    // 保留最近100个值
    if (values.length > 100) {
      values.shift();
    }
  }

  private checkThreshold(name: string, value: number): void {
    const threshold = this.thresholds.get(name);
    if (threshold && value > threshold) {
      this.alerts.forEach(callback => callback(name, value, threshold));
    }
  }

  // 设置阈值
  setThreshold(name: string, value: number): void {
    this.thresholds.set(name, value);
  }

  // 添加警报回调
  addAlert(callback: (metric: string, value: number, threshold: number) => void): void {
    this.alerts.push(callback);
  }

  // 获取指标统计
  getMetricStats(name: string): {
    current: number;
    average: number;
    min: number;
    max: number;
    count: number;
  } | null {
    const values = this.metrics.get(name);
    if (!values || values.length === 0) {
      return null;
    }
    
    return {
      current: values[values.length - 1],
      average: values.reduce((a, b) => a + b, 0) / values.length,
      min: Math.min(...values),
      max: Math.max(...values),
      count: values.length,
    };
  }

  // 获取所有指标状态
  getSystemStatus(): Record<string, any> {
    const status: Record<string, any> = {
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      cpu: process.cpuUsage(),
      metrics: {},
    };
    
    this.metrics.forEach((values, name) => {
      status.metrics[name] = this.getMetricStats(name);
    });
    
    return status;
  }
}

// 创建性能监控实例
export const performanceMonitor = PerformanceMonitor.getInstance();

// 响应式优化工具
export class ResponsiveOptimizer {
  private debounceTimers: Map<string, NodeJS.Timeout> = new Map();
  private throttleFlags: Map<string, boolean> = new Map();
  private intersectionObservers: Map<string, IntersectionObserver> = new Map();

  // 防抖函数
  debounce<T extends (...args: any[]) => any>(
    name: string,
    func: T,
    wait: number
  ): T {
    return ((...args: any[]) => {
      if (this.debounceTimers.has(name)) {
        clearTimeout(this.debounceTimers.get(name)!);
      }
      
      this.debounceTimers.set(
        name,
        setTimeout(() => {
          func(...args);
          this.debounceTimers.delete(name);
        }, wait)
      );
    }) as T;
  }

  // 节流函数
  throttle<T extends (...args: any[]) => any>(
    name: string,
    func: T,
    limit: number
  ): T {
    return ((...args: any[]) => {
      if (this.throttleFlags.get(name)) {
        return;
      }
      
      this.throttleFlags.set(name, true);
      func(...args);
      
      setTimeout(() => {
        this.throttleFlags.delete(name);
      }, limit);
    }) as T;
  }

  // 懒加载观察器
  createIntersectionObserver(
    name: string,
    callback: IntersectionObserverCallback,
    options?: IntersectionObserverInit
  ): IntersectionObserver {
    if (this.intersectionObservers.has(name)) {
      return this.intersectionObservers.get(name)!;
    }
    
    const observer = new IntersectionObserver(callback, options);
    this.intersectionObservers.set(name, observer);
    
    return observer;
  }

  // 清理资源
  cleanup(): void {
    // 清理定时器
    this.debounceTimers.forEach(timer => clearTimeout(timer));
    this.debounceTimers.clear();
    
    // 清理观察器
    this.intersectionObservers.forEach(observer => observer.disconnect());
    this.intersectionObservers.clear();
  }
}

// 创建响应式优化器实例
export const responsiveOptimizer = new ResponsiveOptimizer();

// 缓存工具
export class CacheManager<K, V> {
  private cache: Map<K, { value: V; timestamp: number; ttl: number }> = new Map();
  private maxSize: number;
  private defaultTTL: number;

  constructor(maxSize: number = 1000, defaultTTL: number = 5 * 60 * 1000) {
    this.maxSize = maxSize;
    this.defaultTTL = defaultTTL;
  }

  // 设置缓存
  set(key: K, value: V, ttl: number = this.defaultTTL): void {
    // 如果缓存已满，删除最旧的条目
    if (this.cache.size >= this.maxSize) {
      const oldestKey = this.cache.keys().next().value;
      this.cache.delete(oldestKey);
    }
    
    this.cache.set(key, {
      value,
      timestamp: Date.now(),
      ttl,
    });
  }

  // 获取缓存
  get(key: K): V | undefined {
    const item = this.cache.get(key);
    
    if (!item) {
      return undefined;
    }
    
    // 检查是否过期
    if (Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(key);
      return undefined;
    }
    
    return item.value;
  }

  // 删除缓存
  delete(key: K): boolean {
    return this.cache.delete(key);
  }

  // 清空缓存
  clear(): void {
    this.cache.clear();
  }

  // 获取缓存大小
  size(): number {
    return this.cache.size;
  }

  // 清理过期缓存
  cleanup(): void {
    const now = Date.now();
    for (const [key, item] of this.cache.entries()) {
      if (now - item.timestamp > item.ttl) {
        this.cache.delete(key);
      }
    }
  }

  // 获取缓存统计
  getStats(): {
    size: number;
    maxSize: number;
    hitRate: number;
    expired: number;
  } {
    const now = Date.now();
    let expired = 0;
    
    for (const item of this.cache.values()) {
      if (now - item.timestamp > item.ttl) {
        expired++;
      }
    }
    
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      hitRate: 0, // 需要在实际使用中跟踪命中率
      expired,
    };
  }
}

// 创建内存缓存实例
export const memoryCache = new CacheManager<string, any>(1000, 5 * 60 * 1000);

// 定期清理缓存
setInterval(() => {
  memoryCache.cleanup();
}, 60 * 1000);