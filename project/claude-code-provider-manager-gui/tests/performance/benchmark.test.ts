/**
 * Performance Tests - Comprehensive Benchmarks
 * 综合性能基准测试和回归检测
 */

import { api } from '@/services/api.mock';
import { createValidProvider, createProviderArray } from '../fixtures/providers.factory';
import type { Provider, CreateProviderRequest } from '@/types';

describe('Performance: Comprehensive Benchmarks', () => {
  // 性能基准阈值配置
  const PERFORMANCE_THRESHOLDS = {
    // API响应时间（毫秒）
    api: {
      getProviders: 100,
      addProvider: 200,
      updateProvider: 150,
      deleteProvider: 100,
      validateProvider: 1500,
      exportConfig: 500,
      importConfig: 800,
      launchClaudeCode: 2000,
    },
    
    // 批量操作时间（毫秒）
    batch: {
      add100Providers: 10000,
      validate10Providers: 8000,
      delete50Providers: 3000,
    },
    
    // 内存使用（MB）
    memory: {
      maxHeapIncrease: 50,
      maxMemoryLeak: 10,
      maxFragmentation: 20,
    },
    
    // 并发操作
    concurrency: {
      maxResponseTime: 2000,
      minThroughput: 50, // operations per second
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Core API Benchmarks', () => {
    it('should benchmark all core API operations', async () => {
      const benchmarks: Record<string, number[]> = {};
      const iterations = 20;
      
      console.log(`Running API benchmarks with ${iterations} iterations each...`);
      
      for (let i = 0; i < iterations; i++) {
        // getProviders benchmark
        let start = performance.now();
        await api.getProviders();
        recordBenchmark(benchmarks, 'getProviders', performance.now() - start);
        
        // addProvider benchmark
        start = performance.now();
        const provider = await api.addProvider(createValidProvider({
          name: `Benchmark Provider ${i}`,
        }));
        recordBenchmark(benchmarks, 'addProvider', performance.now() - start);
        
        // updateProvider benchmark
        start = performance.now();
        await api.updateProvider(provider.id, {
          description: `Updated benchmark description ${i}`,
        });
        recordBenchmark(benchmarks, 'updateProvider', performance.now() - start);
        
        // validateProvider benchmark
        start = performance.now();
        try {
          await api.validateProviderFull(
            provider.id,
            provider.baseUrl,
            provider.authToken || '',
            provider.model
          );
        } catch (error) {
          // 验证失败是正常的，只测量时间
        }
        recordBenchmark(benchmarks, 'validateProvider', performance.now() - start);
        
        // deleteProvider benchmark
        start = performance.now();
        await api.deleteProvider(provider.id);
        recordBenchmark(benchmarks, 'deleteProvider', performance.now() - start);
      }
      
      // 分析并报告结果
      console.log('\n=== Core API Benchmark Results ===');
      Object.entries(benchmarks).forEach(([operation, times]) => {
        const stats = calculateStatistics(times);
        const threshold = PERFORMANCE_THRESHOLDS.api[operation as keyof typeof PERFORMANCE_THRESHOLDS.api];
        
        console.log(`${operation}:`);
        console.log(`  Average: ${stats.mean.toFixed(2)}ms (threshold: ${threshold}ms)`);
        console.log(`  Median: ${stats.median.toFixed(2)}ms`);
        console.log(`  95th percentile: ${stats.p95.toFixed(2)}ms`);
        console.log(`  Min/Max: ${stats.min.toFixed(2)}ms / ${stats.max.toFixed(2)}ms`);
        console.log(`  Standard Deviation: ${stats.stdDev.toFixed(2)}ms`);
        
        // 验证性能阈值
        expect(stats.mean).toBeLessThan(threshold);
        expect(stats.p95).toBeLessThan(threshold * 1.5); // 95%的操作在阈值1.5倍内
      });
    });

    it('should benchmark configuration operations', async () => {
      // 准备测试数据
      const providers = await Promise.all(
        createProviderArray(25).map(p => api.addProvider(p))
      );
      
      const benchmarks: Record<string, number[]> = {};
      const iterations = 10;
      
      for (let i = 0; i < iterations; i++) {
        // exportConfig benchmark
        let start = performance.now();
        await api.exportConfig(true);
        recordBenchmark(benchmarks, 'exportConfig', performance.now() - start);
        
        // 创建导入测试配置
        const configData = {
          providers: createProviderArray(15),
          settings: { theme: 'dark', language: 'zh-CN' },
        };
        
        // importConfig benchmark
        start = performance.now();
        await api.importConfig(JSON.stringify(configData));
        recordBenchmark(benchmarks, 'importConfig', performance.now() - start);
      }
      
      // 报告结果
      console.log('\n=== Configuration Benchmark Results ===');
      Object.entries(benchmarks).forEach(([operation, times]) => {
        const stats = calculateStatistics(times);
        const threshold = PERFORMANCE_THRESHOLDS.api[operation as keyof typeof PERFORMANCE_THRESHOLDS.api];
        
        console.log(`${operation}: ${stats.mean.toFixed(2)}ms avg, ${stats.p95.toFixed(2)}ms p95 (threshold: ${threshold}ms)`);
        
        expect(stats.mean).toBeLessThan(threshold);
      });
      
      // 清理
      await Promise.all(providers.map(p => api.deleteProvider(p.id)));
    });
  });

  describe('Batch Operations Benchmarks', () => {
    it('should benchmark large batch operations', async () => {
      console.log('\n=== Batch Operations Benchmark ===');
      
      // 批量添加providers
      const batchSizes = [10, 25, 50, 100];
      
      for (const batchSize of batchSizes) {
        const providers = createProviderArray(batchSize);
        
        // 批量添加
        const addStart = performance.now();
        const addedProviders = await Promise.all(
          providers.map(p => api.addProvider(p))
        );
        const addTime = performance.now() - addStart;
        
        console.log(`Batch add ${batchSize} providers: ${addTime.toFixed(2)}ms (${(addTime/batchSize).toFixed(2)}ms per item)`);
        
        // 批量验证（部分）
        const validateCount = Math.min(batchSize, 10);
        const validateStart = performance.now();
        await Promise.all(
          addedProviders.slice(0, validateCount).map(provider =>
            api.validateProviderFull(
              provider.id,
              provider.baseUrl,
              provider.authToken || '',
              provider.model
            ).catch(() => null)
          )
        );
        const validateTime = performance.now() - validateStart;
        
        console.log(`Batch validate ${validateCount} providers: ${validateTime.toFixed(2)}ms (${(validateTime/validateCount).toFixed(2)}ms per item)`);
        
        // 批量删除
        const deleteStart = performance.now();
        await Promise.all(
          addedProviders.map(p => api.deleteProvider(p.id))
        );
        const deleteTime = performance.now() - deleteStart;
        
        console.log(`Batch delete ${batchSize} providers: ${deleteTime.toFixed(2)}ms (${(deleteTime/batchSize).toFixed(2)}ms per item)`);
        
        // 验证性能阈值
        if (batchSize === 100) {
          expect(addTime).toBeLessThan(PERFORMANCE_THRESHOLDS.batch.add100Providers);
        }
        if (validateCount === 10) {
          expect(validateTime).toBeLessThan(PERFORMANCE_THRESHOLDS.batch.validate10Providers);
        }
        if (batchSize === 50) {
          expect(deleteTime).toBeLessThan(PERFORMANCE_THRESHOLDS.batch.delete50Providers);
        }
      }
    });

    it('should benchmark streaming operations', async () => {
      const streamSize = 200;
      const batchSize = 20;
      
      console.log(`\nStreaming ${streamSize} operations in batches of ${batchSize}...`);
      
      const totalStart = performance.now();
      const batchTimes: number[] = [];
      
      for (let i = 0; i < streamSize; i += batchSize) {
        const batchStart = performance.now();
        
        // 创建当前批次
        const batch = Array.from({ length: Math.min(batchSize, streamSize - i) }, (_, j) =>
          createValidProvider({ name: `Stream Test ${i + j}` })
        );
        
        // 执行批次操作
        const addedBatch = await Promise.all(
          batch.map(p => api.addProvider(p))
        );
        
        // 立即删除以保持内存使用稳定
        await Promise.all(
          addedBatch.map(p => api.deleteProvider(p.id))
        );
        
        const batchTime = performance.now() - batchStart;
        batchTimes.push(batchTime);
        
        console.log(`Batch ${Math.floor(i/batchSize) + 1}: ${batchTime.toFixed(2)}ms`);
      }
      
      const totalTime = performance.now() - totalStart;
      const avgBatchTime = batchTimes.reduce((a, b) => a + b) / batchTimes.length;
      const throughput = streamSize / (totalTime / 1000); // operations per second
      
      console.log(`Streaming completed: ${totalTime.toFixed(2)}ms total, ${avgBatchTime.toFixed(2)}ms avg batch, ${throughput.toFixed(2)} ops/sec`);
      
      // 验证吞吐量
      expect(throughput).toBeGreaterThan(PERFORMANCE_THRESHOLDS.concurrency.minThroughput);
    });
  });

  describe('Concurrency Benchmarks', () => {
    it('should benchmark concurrent operations', async () => {
      const concurrencyLevels = [1, 5, 10, 20, 50];
      
      console.log('\n=== Concurrency Benchmark ===');
      
      for (const concurrency of concurrencyLevels) {
        const operations: Promise<any>[] = [];
        
        const start = performance.now();
        
        // 创建并发操作
        for (let i = 0; i < concurrency; i++) {
          const operation = (async () => {
            const provider = await api.addProvider(createValidProvider({
              name: `Concurrent Test ${concurrency}-${i}`,
            }));
            
            await api.updateProvider(provider.id, {
              description: `Updated concurrent ${i}`,
            });
            
            try {
              await api.validateProviderFull(
                provider.id,
                provider.baseUrl,
                provider.authToken || '',
                provider.model
              );
            } catch (error) {
              // 忽略验证错误
            }
            
            await api.deleteProvider(provider.id);
            
            return provider;
          })();
          
          operations.push(operation);
        }
        
        // 等待所有操作完成
        await Promise.all(operations);
        
        const duration = performance.now() - start;
        const throughput = concurrency / (duration / 1000);
        
        console.log(`Concurrency ${concurrency}: ${duration.toFixed(2)}ms, ${throughput.toFixed(2)} ops/sec`);
        
        // 验证性能不因并发而显著下降
        expect(duration).toBeLessThan(PERFORMANCE_THRESHOLDS.concurrency.maxResponseTime);
      }
    });

    it('should benchmark mixed workload', async () => {
      const duration = 5000; // 5秒测试
      const operations = {
        get: 0,
        add: 0,
        update: 0,
        delete: 0,
        validate: 0,
      };
      
      console.log(`\nRunning mixed workload for ${duration}ms...`);
      
      const providers: Provider[] = [];
      const startTime = performance.now();
      
      // 混合工作负载
      while (performance.now() - startTime < duration) {
        const rand = Math.random();
        
        try {
          if (rand < 0.3) {
            // 30% GET操作
            await api.getProviders();
            operations.get++;
            
          } else if (rand < 0.5) {
            // 20% ADD操作
            const provider = await api.addProvider(createValidProvider({
              name: `Mixed Workload ${Date.now()}`,
            }));
            providers.push(provider);
            operations.add++;
            
          } else if (rand < 0.7 && providers.length > 0) {
            // 20% UPDATE操作
            const provider = providers[Math.floor(Math.random() * providers.length)];
            await api.updateProvider(provider.id, {
              description: `Updated ${Date.now()}`,
            });
            operations.update++;
            
          } else if (rand < 0.85 && providers.length > 0) {
            // 15% DELETE操作
            const index = Math.floor(Math.random() * providers.length);
            const provider = providers.splice(index, 1)[0];
            await api.deleteProvider(provider.id);
            operations.delete++;
            
          } else if (providers.length > 0) {
            // 15% VALIDATE操作
            const provider = providers[Math.floor(Math.random() * providers.length)];
            try {
              await api.validateProviderFull(
                provider.id,
                provider.baseUrl,
                provider.authToken || '',
                provider.model
              );
            } catch (error) {
              // 忽略验证错误
            }
            operations.validate++;
          }
        } catch (error) {
          // 忽略操作错误，继续测试
        }
      }
      
      const actualDuration = performance.now() - startTime;
      const totalOperations = Object.values(operations).reduce((a, b) => a + b);
      const opsPerSecond = totalOperations / (actualDuration / 1000);
      
      console.log('Mixed workload results:');
      console.log(`  Total operations: ${totalOperations} in ${actualDuration.toFixed(0)}ms`);
      console.log(`  Throughput: ${opsPerSecond.toFixed(2)} ops/sec`);
      console.log(`  Operation breakdown:`, operations);
      
      // 清理剩余的providers
      await Promise.all(providers.map(p => api.deleteProvider(p.id).catch(() => {})));
      
      // 验证混合工作负载性能
      expect(opsPerSecond).toBeGreaterThan(20); // 至少20 ops/sec
      expect(totalOperations).toBeGreaterThan(50); // 应该完成足够多的操作
    });
  });

  describe('Memory Benchmark', () => {
    it('should benchmark memory usage patterns', async () => {
      const baseline = getMemoryUsage();
      const memorySnapshots: Array<{ operation: string; memory: number; time: number }> = [];
      
      console.log('\n=== Memory Usage Benchmark ===');
      console.log(`Baseline memory: ${(baseline / 1024 / 1024).toFixed(2)}MB`);
      
      // 不同规模的操作
      const scales = [10, 50, 100, 200];
      
      for (const scale of scales) {
        const scaleStart = performance.now();
        
        // 创建providers
        const providers = await Promise.all(
          Array.from({ length: scale }, (_, i) => 
            api.addProvider(createValidProvider({
              name: `Memory Test ${scale}-${i}`,
              description: 'X'.repeat(1000), // 1KB描述
            }))
          )
        );
        
        const afterCreate = getMemoryUsage();
        memorySnapshots.push({
          operation: `create_${scale}`,
          memory: afterCreate,
          time: performance.now() - scaleStart,
        });
        
        // 更新所有providers
        await Promise.all(
          providers.map((provider, i) => 
            api.updateProvider(provider.id, {
              description: 'Y'.repeat(1500), // 1.5KB描述
            })
          )
        );
        
        const afterUpdate = getMemoryUsage();
        memorySnapshots.push({
          operation: `update_${scale}`,
          memory: afterUpdate,
          time: performance.now() - scaleStart,
        });
        
        // 删除所有providers
        await Promise.all(providers.map(p => api.deleteProvider(p.id)));
        
        // 强制垃圾回收
        if (global.gc) {
          global.gc();
        }
        
        const afterDelete = getMemoryUsage();
        memorySnapshots.push({
          operation: `delete_${scale}`,
          memory: afterDelete,
          time: performance.now() - scaleStart,
        });
        
        const memoryIncrease = afterDelete - baseline;
        
        console.log(`Scale ${scale}: ${(memoryIncrease / 1024 / 1024).toFixed(2)}MB increase after cleanup`);
        
        // 验证内存泄漏
        expect(memoryIncrease).toBeLessThan(PERFORMANCE_THRESHOLDS.memory.maxMemoryLeak * 1024 * 1024);
      }
      
      // 分析内存使用模式
      console.log('\nMemory usage pattern:');
      memorySnapshots.forEach(snapshot => {
        const increase = snapshot.memory - baseline;
        console.log(`  ${snapshot.operation}: ${(increase / 1024 / 1024).toFixed(2)}MB (+${(increase / 1024 / 1024).toFixed(2)}MB)`);
      });
    });

    it('should benchmark garbage collection impact', async () => {
      if (!global.gc) {
        console.log('Skipping GC benchmark - garbage collection not available');
        return;
      }
      
      const gcTimes: number[] = [];
      const memoryBeforeGC: number[] = [];
      const memoryAfterGC: number[] = [];
      
      console.log('\n=== Garbage Collection Benchmark ===');
      
      for (let i = 0; i < 10; i++) {
        // 创建垃圾
        const garbage = Array.from({ length: 1000 }, (_, j) => ({
          id: `garbage-${i}-${j}`,
          data: 'X'.repeat(1000),
          nested: Array.from({ length: 100 }, (_, k) => `nested-${k}`),
        }));
        
        // 创建一些providers（真实操作）
        const providers = await Promise.all(
          Array.from({ length: 10 }, (_, j) => 
            api.addProvider(createValidProvider({
              name: `GC Test ${i}-${j}`,
              description: JSON.stringify(garbage.slice(0, 10)),
            }))
          )
        );
        
        const beforeGC = getMemoryUsage();
        memoryBeforeGC.push(beforeGC);
        
        // 执行垃圾回收
        const gcStart = performance.now();
        global.gc();
        const gcTime = performance.now() - gcStart;
        gcTimes.push(gcTime);
        
        const afterGC = getMemoryUsage();
        memoryAfterGC.push(afterGC);
        
        console.log(`GC ${i + 1}: ${gcTime.toFixed(2)}ms, ${((beforeGC - afterGC) / 1024 / 1024).toFixed(2)}MB reclaimed`);
        
        // 清理providers
        await Promise.all(providers.map(p => api.deleteProvider(p.id)));
      }
      
      const avgGCTime = gcTimes.reduce((a, b) => a + b) / gcTimes.length;
      const avgMemoryReclaimed = memoryBeforeGC
        .map((before, i) => before - memoryAfterGC[i])
        .reduce((a, b) => a + b) / memoryBeforeGC.length;
      
      console.log(`Average GC time: ${avgGCTime.toFixed(2)}ms`);
      console.log(`Average memory reclaimed: ${(avgMemoryReclaimed / 1024 / 1024).toFixed(2)}MB`);
      
      // 垃圾回收应该高效
      expect(avgGCTime).toBeLessThan(100); // 100ms内
      expect(avgMemoryReclaimed).toBeGreaterThan(1024 * 1024); // 至少1MB回收
    });
  });

  describe('Performance Regression Detection', () => {
    it('should establish performance baselines', async () => {
      const results: Record<string, any> = {};
      
      console.log('\n=== Performance Regression Baseline ===');
      
      // 建立各种操作的基准
      const baselineTests = {
        'single_provider_crud': async () => {
          const provider = await api.addProvider(createValidProvider());
          await api.updateProvider(provider.id, { description: 'Updated' });
          await api.deleteProvider(provider.id);
        },
        
        'batch_operations': async () => {
          const providers = await Promise.all(
            Array.from({ length: 20 }, () => 
              api.addProvider(createValidProvider())
            )
          );
          await Promise.all(providers.map(p => api.deleteProvider(p.id)));
        },
        
        'configuration_export_import': async () => {
          const exported = await api.exportConfig(false);
          await api.importConfig(exported);
        },
        
        'concurrent_operations': async () => {
          const operations = Array.from({ length: 10 }, () => 
            api.getProviders()
          );
          await Promise.all(operations);
        },
      };
      
      for (const [testName, testFn] of Object.entries(baselineTests)) {
        const times: number[] = [];
        
        // 运行多次获取稳定的基准
        for (let i = 0; i < 10; i++) {
          const start = performance.now();
          await testFn();
          times.push(performance.now() - start);
        }
        
        const stats = calculateStatistics(times);
        results[testName] = stats;
        
        console.log(`${testName}:`);
        console.log(`  Mean: ${stats.mean.toFixed(2)}ms`);
        console.log(`  P95: ${stats.p95.toFixed(2)}ms`);
        console.log(`  Std Dev: ${stats.stdDev.toFixed(2)}ms`);
      }
      
      // 保存基准数据（在真实环境中可以存储到文件）
      console.log('\nBaseline results:', JSON.stringify(results, null, 2));
      
      // 验证基准数据的合理性
      expect(results.single_provider_crud.mean).toBeLessThan(1000);
      expect(results.batch_operations.mean).toBeLessThan(5000);
      expect(results.configuration_export_import.mean).toBeLessThan(1500);
      expect(results.concurrent_operations.mean).toBeLessThan(500);
    });
  });
});

// 辅助函数
function recordBenchmark(benchmarks: Record<string, number[]>, operation: string, time: number): void {
  if (!benchmarks[operation]) {
    benchmarks[operation] = [];
  }
  benchmarks[operation].push(time);
}

function calculateStatistics(values: number[]) {
  const sorted = [...values].sort((a, b) => a - b);
  const mean = values.reduce((a, b) => a + b) / values.length;
  const variance = values.reduce((sum, value) => sum + Math.pow(value - mean, 2), 0) / values.length;
  
  return {
    mean,
    median: sorted[Math.floor(sorted.length / 2)],
    min: sorted[0],
    max: sorted[sorted.length - 1],
    p95: sorted[Math.floor(sorted.length * 0.95)],
    p99: sorted[Math.floor(sorted.length * 0.99)],
    stdDev: Math.sqrt(variance),
  };
}

function getMemoryUsage(): number {
  if (typeof process !== 'undefined' && process.memoryUsage) {
    return process.memoryUsage().heapUsed;
  }
  
  if (typeof performance !== 'undefined' && 'memory' in performance) {
    return (performance as any).memory?.usedJSHeapSize || 0;
  }
  
  return 0;
}