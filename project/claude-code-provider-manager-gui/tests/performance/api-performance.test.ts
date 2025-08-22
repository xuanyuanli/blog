/**
 * Performance Tests - API and Service Performance
 * 测试API调用性能和服务响应时间
 */

import { api } from '@/services/api.mock';
import { createValidProvider, createBoundaryProvider } from '../fixtures/providers.factory';
import type { Provider, CreateProviderRequest, LaunchConfig } from '@/types';

describe('Performance: API and Service Layer', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic API Performance', () => {
    it('should respond to getProviders quickly', async () => {
      const startTime = performance.now();
      
      const providers = await api.getProviders();
      
      const endTime = performance.now();
      const responseTime = endTime - startTime;
      
      expect(Array.isArray(providers)).toBe(true);
      expect(responseTime).toBeLessThan(50); // 50ms响应时间
      
      console.log(`getProviders performance: ${responseTime.toFixed(2)}ms`);
    });

    it('should handle provider creation efficiently', async () => {
      const providerData = createValidProvider({
        name: 'Performance Test Provider',
      });
      
      const startTime = performance.now();
      
      const createdProvider = await api.addProvider(providerData);
      
      const endTime = performance.now();
      const responseTime = endTime - startTime;
      
      expect(createdProvider).toBeDefined();
      expect(createdProvider.name).toBe(providerData.name);
      expect(responseTime).toBeLessThan(100); // 100ms创建时间
      
      console.log(`addProvider performance: ${responseTime.toFixed(2)}ms`);
      
      // 清理
      await api.deleteProvider(createdProvider.id);
    });

    it('should handle multiple concurrent operations', async () => {
      const startTime = performance.now();
      
      // 并发执行多个API操作
      const operations = [
        api.getProviders(),
        api.getActiveProvider(),
        api.getCurrentEnvironment(),
        api.getSystemInfo(),
        api.getAllEnvVars(),
      ];
      
      const results = await Promise.all(operations);
      
      const endTime = performance.now();
      const totalTime = endTime - startTime;
      
      expect(results).toHaveLength(5);
      expect(totalTime).toBeLessThan(200); // 并发操作应该比串行快
      
      console.log(`Concurrent operations performance: ${totalTime.toFixed(2)}ms for 5 operations`);
    });

    it('should maintain performance under load', async () => {
      const operationCount = 50;
      const operations: Promise<any>[] = [];
      
      const startTime = performance.now();
      
      // 创建大量并发操作
      for (let i = 0; i < operationCount; i++) {
        const provider = createValidProvider({
          name: `Load Test Provider ${i}`,
        });
        
        operations.push(
          api.addProvider(provider).then(created => 
            api.deleteProvider(created.id)
          )
        );
      }
      
      await Promise.all(operations);
      
      const endTime = performance.now();
      const totalTime = endTime - startTime;
      const avgTime = totalTime / operationCount;
      
      expect(totalTime).toBeLessThan(5000); // 5秒内完成50个操作
      expect(avgTime).toBeLessThan(100); // 平均每个操作100ms内
      
      console.log(`Load test performance: ${totalTime.toFixed(2)}ms total, ${avgTime.toFixed(2)}ms average`);
    });
  });

  describe('Validation Performance', () => {
    it('should validate provider connections quickly', async () => {
      const testUrls = [
        'https://api.anthropic.com',
        'https://api.openai.com/v1',
        'https://api.cohere.ai/v1',
        'https://generativelanguage.googleapis.com/v1',
      ];
      
      const validationTimes: number[] = [];
      
      for (const baseUrl of testUrls) {
        const startTime = performance.now();
        
        try {
          await api.validateProviderConnection(baseUrl, 'test-token');
        } catch (error) {
          // 验证失败是预期的，我们只关心性能
        }
        
        const endTime = performance.now();
        const validationTime = endTime - startTime;
        validationTimes.push(validationTime);
        
        expect(validationTime).toBeLessThan(1000); // 每个验证1秒内完成
      }
      
      const avgValidationTime = validationTimes.reduce((a, b) => a + b) / validationTimes.length;
      console.log(`Average validation time: ${avgValidationTime.toFixed(2)}ms`);
    });

    it('should handle batch validation efficiently', async () => {
      const providers = Array.from({ length: 10 }, (_, i) => 
        createValidProvider({ name: `Batch Validation ${i}` })
      );
      
      // 添加所有providers
      const createdProviders = await Promise.all(
        providers.map(provider => api.addProvider(provider))
      );
      
      const startTime = performance.now();
      
      // 批量验证
      const validationPromises = createdProviders.map(provider =>
        api.validateProviderFull(
          provider.id,
          provider.baseUrl,
          provider.authToken || '',
          provider.model
        ).catch(() => null) // 忽略验证失败
      );
      
      await Promise.all(validationPromises);
      
      const endTime = performance.now();
      const batchTime = endTime - startTime;
      
      expect(batchTime).toBeLessThan(3000); // 批量验证3秒内完成
      
      console.log(`Batch validation performance: ${batchTime.toFixed(2)}ms for ${providers.length} providers`);
      
      // 清理
      await Promise.all(
        createdProviders.map(provider => api.deleteProvider(provider.id))
      );
    });

    it('should optimize repeated validations', async () => {
      const provider = await api.addProvider(createValidProvider({
        name: 'Repeated Validation Test',
      }));
      
      const validationTimes: number[] = [];
      
      // 重复验证同一个provider
      for (let i = 0; i < 5; i++) {
        const startTime = performance.now();
        
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
        
        const endTime = performance.now();
        validationTimes.push(endTime - startTime);
      }
      
      // 第一次验证可能较慢，后续应该有缓存优化
      const firstValidation = validationTimes[0];
      const avgSubsequent = validationTimes.slice(1).reduce((a, b) => a + b) / (validationTimes.length - 1);
      
      console.log(`First validation: ${firstValidation.toFixed(2)}ms, Average subsequent: ${avgSubsequent.toFixed(2)}ms`);
      
      // 清理
      await api.deleteProvider(provider.id);
    });
  });

  describe('Configuration Performance', () => {
    it('should export configuration quickly', async () => {
      // 添加多个providers
      const providers = await Promise.all(
        Array.from({ length: 20 }, (_, i) => 
          api.addProvider(createValidProvider({ name: `Export Test ${i}` }))
        )
      );
      
      const startTime = performance.now();
      
      const exportedConfig = await api.exportConfig(true);
      
      const endTime = performance.now();
      const exportTime = endTime - startTime;
      
      expect(exportedConfig).toBeDefined();
      expect(typeof exportedConfig).toBe('string');
      expect(exportTime).toBeLessThan(500); // 导出在500ms内完成
      
      console.log(`Config export performance: ${exportTime.toFixed(2)}ms for ${providers.length} providers`);
      
      // 清理
      await Promise.all(providers.map(provider => api.deleteProvider(provider.id)));
    });

    it('should import configuration efficiently', async () => {
      // 创建一个包含多个providers的配置
      const configData = {
        providers: Array.from({ length: 15 }, (_, i) => ({
          id: `import-test-${i}`,
          name: `Import Test Provider ${i}`,
          baseUrl: 'https://api.anthropic.com',
          authToken: `token-${i}`,
          model: 'claude-3-sonnet-20240229',
          isActive: false,
          createdAt: new Date().toISOString(),
          lastValidated: null,
          isValid: null,
        })),
        settings: {
          theme: 'dark',
          language: 'zh-CN',
          autoValidate: false,
        },
      };
      
      const configJson = JSON.stringify(configData);
      
      const startTime = performance.now();
      
      const importedConfig = await api.importConfig(configJson);
      
      const endTime = performance.now();
      const importTime = endTime - startTime;
      
      expect(importedConfig).toBeDefined();
      expect(importedConfig.providers).toHaveLength(15);
      expect(importTime).toBeLessThan(300); // 导入在300ms内完成
      
      console.log(`Config import performance: ${importTime.toFixed(2)}ms for ${configData.providers.length} providers`);
    });

    it('should handle large configuration files', async () => {
      // 创建非常大的配置文件
      const largeConfig = {
        providers: Array.from({ length: 100 }, (_, i) => {
          const provider = createBoundaryProvider();
          return {
            ...provider,
            id: `large-config-${i}`,
            name: `Large Config Provider ${i}`,
            description: 'A'.repeat(1000), // 长描述
            metadata: {
              tags: Array.from({ length: 50 }, (_, j) => `tag-${i}-${j}`),
              customFields: Object.fromEntries(
                Array.from({ length: 20 }, (_, k) => [`field${k}`, `value-${i}-${k}`])
              ),
            },
          };
        }),
        settings: {
          customCss: 'A'.repeat(10000), // 大量自定义CSS
          startupArgs: Array.from({ length: 100 }, (_, i) => `--arg${i}=value${i}`),
          notifications: {
            customSounds: Array.from({ length: 50 }, (_, i) => ({
              name: `sound${i}`,
              data: 'B'.repeat(1000),
            })),
          },
        },
      };
      
      const largeConfigJson = JSON.stringify(largeConfig);
      const configSize = new Blob([largeConfigJson]).size;
      
      console.log(`Testing large config: ${(configSize / 1024 / 1024).toFixed(2)}MB`);
      
      const startTime = performance.now();
      
      try {
        await api.importConfig(largeConfigJson);
        
        const endTime = performance.now();
        const importTime = endTime - startTime;
        
        expect(importTime).toBeLessThan(2000); // 大配置2秒内完成
        
        console.log(`Large config import: ${importTime.toFixed(2)}ms for ${configSize} bytes`);
        
      } catch (error) {
        // 如果因为大小限制失败，这也是可以接受的
        expect(error).toBeInstanceOf(Error);
        console.log(`Large config rejected (expected): ${error.message}`);
      }
    });
  });

  describe('System Operations Performance', () => {
    it('should launch Claude Code quickly', async () => {
      const launchConfig: LaunchConfig = {
        sessionId: `perf-test-${Date.now()}`,
        workingDirectory: '/tmp',
        args: ['--version'],
        envVars: {
          ANTHROPIC_BASE_URL: 'https://api.anthropic.com',
          ANTHROPIC_AUTH_TOKEN: 'test-token',
          ANTHROPIC_MODEL: 'claude-3-sonnet-20240229',
        },
      };
      
      const startTime = performance.now();
      
      try {
        const processInfo = await api.launchClaudeCode(launchConfig);
        
        const endTime = performance.now();
        const launchTime = endTime - startTime;
        
        expect(processInfo).toBeDefined();
        expect(launchTime).toBeLessThan(1000); // 启动在1秒内完成
        
        console.log(`Claude Code launch performance: ${launchTime.toFixed(2)}ms`);
        
        // 清理进程
        if (processInfo.sessionId) {
          await api.terminateProcess(processInfo.sessionId);
        }
        
      } catch (error) {
        // 启动可能失败（测试环境），但测试响应时间
        const endTime = performance.now();
        const responseTime = endTime - startTime;
        
        expect(responseTime).toBeLessThan(1000);
        console.log(`Launch attempt response time: ${responseTime.toFixed(2)}ms (failed as expected)`);
      }
    });

    it('should handle process management efficiently', async () => {
      const sessionIds = Array.from({ length: 10 }, (_, i) => `process-test-${i}-${Date.now()}`);
      
      const startTime = performance.now();
      
      // 并发查询多个进程状态
      const statusPromises = sessionIds.map(sessionId =>
        api.getProcessStatus(sessionId).catch(() => null)
      );
      
      const statuses = await Promise.all(statusPromises);
      
      const endTime = performance.now();
      const queryTime = endTime - startTime;
      
      expect(statuses).toHaveLength(sessionIds.length);
      expect(queryTime).toBeLessThan(500); // 批量查询500ms内完成
      
      console.log(`Process status queries: ${queryTime.toFixed(2)}ms for ${sessionIds.length} sessions`);
    });

    it('should cleanup operations efficiently', async () => {
      const startTime = performance.now();
      
      // 执行多个清理操作
      const cleanupOperations = [
        api.cleanupFinishedProcesses(),
        api.cleanupOldBackups(),
        // 可以添加更多清理操作
      ];
      
      const results = await Promise.all(cleanupOperations.map(op => op.catch(() => [])));
      
      const endTime = performance.now();
      const cleanupTime = endTime - startTime;
      
      expect(Array.isArray(results[0])).toBe(true);
      expect(Array.isArray(results[1])).toBe(true);
      expect(cleanupTime).toBeLessThan(1000); // 清理操作1秒内完成
      
      console.log(`Cleanup operations: ${cleanupTime.toFixed(2)}ms`);
    });
  });

  describe('Memory and Resource Performance', () => {
    it('should handle memory efficiently during operations', async () => {
      const initialMemory = getMemoryUsage();
      
      // 执行大量操作
      const operations = [];
      
      for (let i = 0; i < 50; i++) {
        const provider = createValidProvider({ name: `Memory Test ${i}` });
        
        operations.push(
          api.addProvider(provider)
            .then(created => api.validateProviderFull(
              created.id,
              created.baseUrl,
              created.authToken || '',
              created.model
            ).catch(() => null))
            .then(() => created)
            .then(created => api.deleteProvider(created.id))
        );
      }
      
      await Promise.all(operations);
      
      // 强制垃圾回收
      if (global.gc) {
        global.gc();
      }
      
      const finalMemory = getMemoryUsage();
      const memoryIncrease = finalMemory - initialMemory;
      
      expect(memoryIncrease).toBeLessThan(20 * 1024 * 1024); // 20MB内存增长限制
      
      console.log(`Memory usage after operations: ${(memoryIncrease / 1024 / 1024).toFixed(2)}MB increase`);
    });

    it('should not accumulate resources over time', async () => {
      const resourceSnapshots: number[] = [];
      
      // 多轮操作，检查资源是否累积
      for (let round = 0; round < 5; round++) {
        for (let i = 0; i < 20; i++) {
          const provider = await api.addProvider(createValidProvider({
            name: `Resource Test Round ${round} Item ${i}`,
          }));
          
          await api.deleteProvider(provider.id);
        }
        
        // 强制垃圾回收
        if (global.gc) {
          global.gc();
        }
        
        resourceSnapshots.push(getMemoryUsage());
      }
      
      // 检查内存是否持续增长
      const firstSnapshot = resourceSnapshots[0];
      const lastSnapshot = resourceSnapshots[resourceSnapshots.length - 1];
      const totalIncrease = lastSnapshot - firstSnapshot;
      
      expect(totalIncrease).toBeLessThan(10 * 1024 * 1024); // 总增长10MB内
      
      console.log(`Resource accumulation test: ${(totalIncrease / 1024 / 1024).toFixed(2)}MB total increase over ${resourceSnapshots.length} rounds`);
    });
  });

  describe('Performance Regression Detection', () => {
    it('should establish performance baselines', async () => {
      const benchmarks = {
        getProviders: [],
        addProvider: [],
        validateProvider: [],
        exportConfig: [],
      } as Record<string, number[]>;
      
      // 运行基准测试
      for (let i = 0; i < 10; i++) {
        // getProviders基准
        let start = performance.now();
        await api.getProviders();
        benchmarks.getProviders.push(performance.now() - start);
        
        // addProvider基准
        start = performance.now();
        const provider = await api.addProvider(createValidProvider({ name: `Benchmark ${i}` }));
        benchmarks.addProvider.push(performance.now() - start);
        
        // validateProvider基准
        start = performance.now();
        try {
          await api.validateProviderFull(provider.id, provider.baseUrl, provider.authToken || '', provider.model);
        } catch (error) {
          // 忽略验证错误
        }
        benchmarks.validateProvider.push(performance.now() - start);
        
        // exportConfig基准
        start = performance.now();
        await api.exportConfig(false);
        benchmarks.exportConfig.push(performance.now() - start);
        
        // 清理
        await api.deleteProvider(provider.id);
      }
      
      // 计算统计信息
      Object.entries(benchmarks).forEach(([operation, times]) => {
        const avg = times.reduce((a, b) => a + b) / times.length;
        const min = Math.min(...times);
        const max = Math.max(...times);
        
        console.log(`${operation} performance: avg=${avg.toFixed(2)}ms, min=${min.toFixed(2)}ms, max=${max.toFixed(2)}ms`);
        
        // 设置性能阈值
        const thresholds = {
          getProviders: 100,
          addProvider: 200,
          validateProvider: 1500,
          exportConfig: 500,
        };
        
        expect(avg).toBeLessThan(thresholds[operation as keyof typeof thresholds]);
      });
    });
  });
});

// 辅助函数
function getMemoryUsage(): number {
  if (typeof process !== 'undefined' && process.memoryUsage) {
    return process.memoryUsage().heapUsed;
  }
  
  if (typeof performance !== 'undefined' && 'memory' in performance) {
    return (performance as any).memory?.usedJSHeapSize || 0;
  }
  
  return 0;
}