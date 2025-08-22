/**
 * Optimized Performance Tests - Memory Profiling and Leak Detection
 * 优化的内存分析和泄漏检测测试
 */

import { api } from '@/services/api.mock';
import { createValidProvider } from '../fixtures/providers.factory';
import type { Provider } from '@/types';
import {
  getDetailedMemoryUsage,
  formatMemoryUsage,
  forceGarbageCollection,
  measurePerformance,
  ResourceMonitor,
  UserSimulator,
  BenchmarkSuite
} from './performance-utils';

describe('Performance: Optimized Memory Profiling', () => {
  // 设置合理的超时时间
  jest.setTimeout(30000);
  
  beforeEach(async () => {
    jest.clearAllMocks();
    await forceGarbageCollection();
  });

  afterEach(async () => {
    await forceGarbageCollection();
  });

  describe('Memory Leak Detection', () => {
    it('should not leak memory during provider CRUD operations', async () => {
      const result = await measurePerformance(async () => {
        const iterations = 3; // 保守的迭代次数
        const providers: string[] = [];
        
        for (let i = 0; i < iterations; i++) {
          // 创建provider
          const provider = await api.addProvider(createValidProvider({
            name: `Test Provider ${i}`,
            description: 'Test description',
          }));
          providers.push(provider.id);
          
          // 读取provider
          await api.getProviderById(provider.id);
          
          // 更新provider
          await api.updateProvider(provider.id, {
            name: `Updated Provider ${i}`,
          });
        }
        
        // 批量删除
        for (const id of providers) {
          await api.deleteProvider(id);
        }
        
        return iterations;
      }, {
        name: 'Provider CRUD Memory Test',
        iterations: 1
      });
      
      // 验证性能指标
      expect(result.metrics.executionTime).toBeLessThan(5000); // < 5秒
      expect(result.metrics.memoryLeakDetected).toBe(false);
      expect(result.result).toBe(3);
      
      console.log(`✅ CRUD test: ${result.metrics.executionTime.toFixed(2)}ms, leak detected: ${result.metrics.memoryLeakDetected}`);
    }, 10000);

    it('should handle closure-related memory patterns', async () => {
      const result = await measurePerformance(async () => {
        const closures: Array<() => string> = [];
        
        // 创建少量闭包
        for (let i = 0; i < 50; i++) {
          const data = `data-${i}`;
          const closure = () => data;
          closures.push(closure);
          
          // 使用闭包
          const result = closure();
          expect(result).toBe(`data-${i}`);
        }
        
        // 清理引用
        closures.length = 0;
        return 50;
      }, {
        name: 'Closure Memory Test',
        iterations: 1
      });
      
      expect(result.metrics.memoryLeakDetected).toBe(false);
      expect(result.result).toBe(50);
    }, 5000);

    it('should monitor memory usage during operations', async () => {
      const monitor = new ResourceMonitor();
      monitor.start(100); // 每100ms记录一次
      
      try {
        // 执行一些操作
        for (let i = 0; i < 5; i++) {
          const provider = await api.addProvider(createValidProvider({
            name: `Monitor Test ${i}`,
          }));
          await api.deleteProvider(provider.id);
          await new Promise(resolve => setTimeout(resolve, 200));
        }
        
        await new Promise(resolve => setTimeout(resolve, 500));
      } finally {
        monitor.stop();
      }
      
      const report = monitor.generateReport();
      
      expect(report.duration).toBeGreaterThan(1000); // 至少1秒
      expect(report.leakDetection.leaked).toBe(false);
      expect(report.averageMemory).toBeGreaterThan(0);
      
      console.log(`📊 Monitor report: ${report.duration}ms, avg memory: ${(report.averageMemory / 1024 / 1024).toFixed(2)}MB`);
    }, 10000);
  });

  describe('Performance Benchmarks', () => {
    it('should run performance benchmark suite', async () => {
      const suite = new BenchmarkSuite();
      
      suite
        .add('Provider Creation', async () => {
          const provider = await api.addProvider(createValidProvider({
            name: 'Benchmark Provider',
          }));
          await api.deleteProvider(provider.id);
        })
        .add('Provider Listing', async () => {
          await api.getProviders();
        })
        .add('Provider Validation', async () => {
          await api.validateUrlFormat('https://api.example.com');
          await api.validateAuthTokenFormat('sk-test-token-123');
        })
        .add('Memory Operations', async () => {
          const data = new Array(1000).fill('test');
          return data.length;
        });
      
      const results = await suite.run({
        iterations: 3,
        warmupIterations: 1
      });
      
      expect(results.size).toBe(4);
      
      // 验证所有基准测试都成功
      for (const [name, metrics] of results) {
        expect(metrics.executionTime).toBeGreaterThan(0);
        expect(metrics.memoryLeakDetected).toBe(false);
        console.log(`📈 ${name}: ${metrics.executionTime.toFixed(2)}ms`);
      }
    }, 15000);

    it('should simulate user interactions', async () => {
      const simulator = new UserSimulator();
      
      simulator
        .addAction(async () => {
          await api.getProviders();
        })
        .addAction(async () => {
          const provider = await api.addProvider(createValidProvider({
            name: 'Simulation Provider',
          }));
          return provider.id;
        })
        .addAction(async () => {
          const providers = await api.getProviders();
          if (providers.length > 0) {
            await api.deleteProvider(providers[0].id);
          }
        });
      
      const result = await simulator.simulate({
        iterations: 2,
        delayBetweenActions: 50,
        delayBetweenIterations: 100
      });
      
      expect(result.executionTime).toBeGreaterThan(0);
      expect(result.memoryLeakDetected).toBe(false);
      expect(result.operationsPerSecond).toBeGreaterThan(0);
      
      console.log(`🎭 User simulation: ${result.executionTime.toFixed(2)}ms, ${result.operationsPerSecond?.toFixed(2)} ops/sec`);
    }, 10000);
  });

  describe('Memory Pressure Tests', () => {
    it('should handle moderate memory pressure', async () => {
      const result = await measurePerformance(async () => {
        let successfulOperations = 0;
        
        try {
          // 创建适度的内存压力
          const arrays: number[][] = [];
          
          for (let i = 0; i < 5; i++) {
            // 小内存分配
            arrays.push(new Array(1000).fill(i));
            
            // 执行Provider操作
            const provider = await api.addProvider(createValidProvider({
              name: `Pressure Test ${i}`,
            }));
            
            await api.deleteProvider(provider.id);
            successfulOperations++;
          }
          
          // 清理
          arrays.length = 0;
          
        } catch (error) {
          console.log('Memory pressure caused error:', error);
        }
        
        return successfulOperations;
      }, {
        name: 'Memory Pressure Test',
        iterations: 1
      });
      
      expect(result.result).toBeGreaterThanOrEqual(3); // 至少成功3次操作
      expect(result.metrics.memoryLeakDetected).toBe(false);
      
      console.log(`💪 Pressure test: ${result.result} successful operations`);
    }, 10000);
  });

  describe('Memory Fragmentation Analysis', () => {
    it('should analyze memory fragmentation patterns', async () => {
      const snapshots = [];
      
      // 收集内存快照
      for (let i = 0; i < 10; i++) {
        const snapshot = getDetailedMemoryUsage();
        snapshots.push(snapshot);
        
        // 创建一些临时对象
        const tempData = new Array(100).fill(`temp-${i}`);
        
        // 模拟内存分配和释放
        await api.getProviders();
        
        // 让出控制权
        await new Promise(resolve => setTimeout(resolve, 50));
      }
      
      // 分析内存模式
      const first = snapshots[0];
      const last = snapshots[snapshots.length - 1];
      const totalGrowth = last.heapUsed - first.heapUsed;
      
      expect(snapshots.length).toBe(10);
      expect(totalGrowth).toBeLessThan(50 * 1024 * 1024); // < 50MB growth
      
      console.log(`🧩 Fragmentation analysis: ${snapshots.length} snapshots, ${(totalGrowth / 1024 / 1024).toFixed(2)}MB growth`);
    }, 8000);
  });
});