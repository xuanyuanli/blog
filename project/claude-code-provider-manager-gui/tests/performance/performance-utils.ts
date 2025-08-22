/**
 * Performance Testing Utilities
 * 性能测试工具函数
 */

export interface MemorySnapshot {
  heapUsed: number;
  heapTotal: number;
  external: number;
  rss: number;
  timestamp: number;
}

export interface PerformanceMetrics {
  executionTime: number;
  memoryUsage: MemorySnapshot;
  operationsPerSecond?: number;
  memoryLeakDetected?: boolean;
}

/**
 * 获取详细内存使用情况
 */
export function getDetailedMemoryUsage(): MemorySnapshot {
  const memUsage = process.memoryUsage();
  return {
    heapUsed: memUsage.heapUsed,
    heapTotal: memUsage.heapTotal,
    external: memUsage.external,
    rss: memUsage.rss,
    timestamp: Date.now(),
  };
}

/**
 * 格式化内存使用情况显示
 */
export function formatMemoryUsage(snapshot: MemorySnapshot): string {
  const formatBytes = (bytes: number) => {
    const mb = bytes / 1024 / 1024;
    return `${mb.toFixed(2)}MB`;
  };

  return `Heap: ${formatBytes(snapshot.heapUsed)}/${formatBytes(snapshot.heapTotal)}, RSS: ${formatBytes(snapshot.rss)}, External: ${formatBytes(snapshot.external)}`;
}

/**
 * 计算内存变化
 */
export function calculateMemoryDelta(before: MemorySnapshot, after: MemorySnapshot): {
  heapUsedDelta: number;
  heapTotalDelta: number;
  rssDelta: number;
  timeDelta: number;
} {
  return {
    heapUsedDelta: after.heapUsed - before.heapUsed,
    heapTotalDelta: after.heapTotal - before.heapTotal,
    rssDelta: after.rss - before.rss,
    timeDelta: after.timestamp - before.timestamp,
  };
}

/**
 * 检测内存泄漏
 */
export function detectMemoryLeak(
  snapshots: MemorySnapshot[],
  thresholdMB: number = 50
): {
  leaked: boolean;
  growthRate: number;
  totalGrowth: number;
} {
  if (snapshots.length < 3) {
    return { leaked: false, growthRate: 0, totalGrowth: 0 };
  }

  const first = snapshots[0];
  const last = snapshots[snapshots.length - 1];
  const totalGrowth = (last.heapUsed - first.heapUsed) / 1024 / 1024; // MB
  const timeSpan = (last.timestamp - first.timestamp) / 1000; // seconds
  const growthRate = totalGrowth / timeSpan; // MB/second

  return {
    leaked: totalGrowth > thresholdMB && growthRate > 0.1, // >0.1MB/s growth
    growthRate,
    totalGrowth,
  };
}

/**
 * 强制垃圾回收（如果可用）
 */
export async function forceGarbageCollection(): Promise<void> {
  if (global.gc) {
    // 多次调用确保彻底清理
    global.gc();
    await new Promise(resolve => setTimeout(resolve, 100));
    global.gc();
    await new Promise(resolve => setTimeout(resolve, 100));
    global.gc();
  }
}

/**
 * 测量函数执行性能
 */
export async function measurePerformance<T>(
  fn: () => Promise<T> | T,
  options: {
    name?: string;
    iterations?: number;
    warmupIterations?: number;
  } = {}
): Promise<{
  result: T;
  metrics: PerformanceMetrics;
  iterations: Array<{ time: number; memory: MemorySnapshot }>;
}> {
  const { name = 'function', iterations = 1, warmupIterations = 0 } = options;

  // 预热运行
  for (let i = 0; i < warmupIterations; i++) {
    await fn();
  }

  await forceGarbageCollection();
  const startMemory = getDetailedMemoryUsage();
  const startTime = performance.now();

  const iterationResults: Array<{ time: number; memory: MemorySnapshot }> = [];
  let result: T;

  // 主要测试运行
  for (let i = 0; i < iterations; i++) {
    const iterStartTime = performance.now();
    result = await fn();
    const iterEndTime = performance.now();
    const iterMemory = getDetailedMemoryUsage();

    iterationResults.push({
      time: iterEndTime - iterStartTime,
      memory: iterMemory,
    });

    // 防止内存累积
    if (i % 10 === 9) {
      await forceGarbageCollection();
    }
  }

  const endTime = performance.now();
  await forceGarbageCollection();
  const endMemory = getDetailedMemoryUsage();

  const totalTime = endTime - startTime;
  const memoryDelta = calculateMemoryDelta(startMemory, endMemory);

  console.log(`[${name}] Completed ${iterations} iterations in ${totalTime.toFixed(2)}ms`);
  console.log(`[${name}] Memory delta: ${formatMemoryUsage(startMemory)} -> ${formatMemoryUsage(endMemory)}`);
  console.log(`[${name}] Heap growth: ${(memoryDelta.heapUsedDelta / 1024 / 1024).toFixed(2)}MB`);

  return {
    result: result!,
    metrics: {
      executionTime: totalTime,
      memoryUsage: endMemory,
      operationsPerSecond: iterations / (totalTime / 1000),
      memoryLeakDetected: memoryDelta.heapUsedDelta > 50 * 1024 * 1024, // >50MB growth
    },
    iterations: iterationResults,
  };
}

/**
 * 创建内存压力测试
 */
export async function createMemoryPressure(
  targetMB: number,
  duration: number = 1000
): Promise<() => void> {
  const arrays: number[][] = [];
  const targetBytes = targetMB * 1024 * 1024;
  const chunkSize = 1024 * 1024; // 1MB chunks
  const chunksNeeded = Math.ceil(targetBytes / chunkSize);

  console.log(`Creating ${targetMB}MB memory pressure with ${chunksNeeded} chunks`);

  for (let i = 0; i < chunksNeeded; i++) {
    arrays.push(new Array(chunkSize / 8).fill(Math.random())); // 8 bytes per number
    
    // 让出控制权避免阻塞
    if (i % 10 === 9) {
      await new Promise(resolve => setTimeout(resolve, 1));
    }
  }

  // 返回清理函数
  return () => {
    arrays.length = 0;
  };
}

/**
 * 监控系统资源使用
 */
export class ResourceMonitor {
  private snapshots: MemorySnapshot[] = [];
  private interval: NodeJS.Timeout | null = null;
  private isMonitoring = false;

  start(intervalMs: number = 1000): void {
    if (this.isMonitoring) return;

    this.isMonitoring = true;
    this.snapshots = [];
    
    this.interval = setInterval(() => {
      this.snapshots.push(getDetailedMemoryUsage());
      
      // 限制快照数量避免内存泄漏
      if (this.snapshots.length > 1000) {
        this.snapshots = this.snapshots.slice(-500);
      }
    }, intervalMs);
  }

  stop(): void {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
    this.isMonitoring = false;
  }

  getSnapshots(): MemorySnapshot[] {
    return [...this.snapshots];
  }

  generateReport(): {
    duration: number;
    peakMemory: MemorySnapshot;
    averageMemory: number;
    memoryGrowth: number;
    leakDetection: ReturnType<typeof detectMemoryLeak>;
  } {
    if (this.snapshots.length === 0) {
      throw new Error('No monitoring data available');
    }

    const first = this.snapshots[0];
    const last = this.snapshots[this.snapshots.length - 1];
    const duration = last.timestamp - first.timestamp;

    const peakMemory = this.snapshots.reduce((peak, current) => 
      current.heapUsed > peak.heapUsed ? current : peak
    );

    const averageMemory = this.snapshots.reduce((sum, snapshot) => 
      sum + snapshot.heapUsed, 0
    ) / this.snapshots.length;

    const memoryGrowth = last.heapUsed - first.heapUsed;
    const leakDetection = detectMemoryLeak(this.snapshots);

    return {
      duration,
      peakMemory,
      averageMemory,
      memoryGrowth,
      leakDetection,
    };
  }
}

/**
 * 模拟真实用户操作的性能测试
 */
export class UserSimulator {
  private actions: Array<() => Promise<void>> = [];

  addAction(action: () => Promise<void>): this {
    this.actions.push(action);
    return this;
  }

  async simulate(options: {
    iterations?: number;
    delayBetweenActions?: number;
    delayBetweenIterations?: number;
  } = {}): Promise<PerformanceMetrics> {
    const { 
      iterations = 1, 
      delayBetweenActions = 100, 
      delayBetweenIterations = 500 
    } = options;

    return measurePerformance(async () => {
      for (let i = 0; i < iterations; i++) {
        for (const action of this.actions) {
          await action();
          if (delayBetweenActions > 0) {
            await new Promise(resolve => setTimeout(resolve, delayBetweenActions));
          }
        }
        
        if (i < iterations - 1 && delayBetweenIterations > 0) {
          await new Promise(resolve => setTimeout(resolve, delayBetweenIterations));
        }
      }
    }, {
      name: `UserSimulator(${this.actions.length} actions, ${iterations} iterations)`,
    });
  }
}

/**
 * 性能基准测试工具
 */
export class BenchmarkSuite {
  private benchmarks: Map<string, () => Promise<any>> = new Map();
  private results: Map<string, PerformanceMetrics> = new Map();

  add(name: string, fn: () => Promise<any>): this {
    this.benchmarks.set(name, fn);
    return this;
  }

  async run(options: {
    iterations?: number;
    warmupIterations?: number;
  } = {}): Promise<Map<string, PerformanceMetrics>> {
    console.log(`\n🏃 Running benchmark suite with ${this.benchmarks.size} tests...\n`);

    for (const [name, fn] of this.benchmarks) {
      try {
        const result = await measurePerformance(fn, {
          name,
          ...options,
        });
        this.results.set(name, result.metrics);
      } catch (error) {
        console.error(`❌ Benchmark ${name} failed:`, error);
        this.results.set(name, {
          executionTime: -1,
          memoryUsage: getDetailedMemoryUsage(),
          operationsPerSecond: 0,
          memoryLeakDetected: false,
        });
      }
    }

    this.printResults();
    return new Map(this.results);
  }

  private printResults(): void {
    console.log('\n📊 Benchmark Results:\n');
    console.log('| Test Name | Execution Time | Ops/sec | Memory Used | Leak Detected |');
    console.log('|-----------|----------------|---------|-------------|---------------|');

    for (const [name, metrics] of this.results) {
      const time = metrics.executionTime >= 0 ? `${metrics.executionTime.toFixed(2)}ms` : 'FAILED';
      const ops = metrics.operationsPerSecond ? metrics.operationsPerSecond.toFixed(2) : 'N/A';
      const memory = `${(metrics.memoryUsage.heapUsed / 1024 / 1024).toFixed(2)}MB`;
      const leak = metrics.memoryLeakDetected ? '⚠️ YES' : '✅ NO';
      
      console.log(`| ${name.padEnd(9)} | ${time.padEnd(14)} | ${ops.padEnd(7)} | ${memory.padEnd(11)} | ${leak.padEnd(13)} |`);
    }
    console.log('\n');
  }
}