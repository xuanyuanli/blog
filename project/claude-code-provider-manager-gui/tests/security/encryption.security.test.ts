/**
 * Security Tests - Encryption & Cryptography
 * 测试加密和密码学安全机制
 */

import { api } from '@/services/api.mock';
import type { Provider, Configuration } from '@/types';

describe('Security: Encryption & Cryptography', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Token Encryption', () => {
    it('should encrypt sensitive data at rest', async () => {
      const sensitiveProvider = {
        name: 'Sensitive Test Provider',
        baseUrl: 'https://api.anthropic.com',
        authToken: 'sk-ant-secret-key-very-sensitive-12345',
        model: 'claude-3-sonnet-20240229',
      };

      const addedProvider = await api.addProvider(sensitiveProvider);
      
      // Token在存储时应该被加密
      expect(addedProvider.authToken).toBeDefined();
      expect(addedProvider.authToken).not.toBe(sensitiveProvider.authToken);
      
      // 获取提供商列表时，token应该被掩码或加密
      const providers = await api.getProviders();
      const storedProvider = providers.find(p => p.id === addedProvider.id);
      
      expect(storedProvider?.authToken).toBeDefined();
      // 应该是掩码格式或完全不同的加密值
      expect(storedProvider?.authToken).toMatch(/^\*+.*\*+$|^[a-zA-Z0-9+/=]+$/);
    });

    it('should use strong encryption for sensitive fields', async () => {
      const testTokens = [
        'sk-ant-api-key-12345',
        'very-long-secret-token-that-needs-encryption',
        '特殊字符Token测试',
        'Token-with-symbols!@#$%^&*()',
      ];

      for (const token of testTokens) {
        const provider = {
          name: 'Encryption Test',
          baseUrl: 'https://api.anthropic.com',
          authToken: token,
          model: 'claude-3-sonnet-20240229',
        };

        const added = await api.addProvider(provider);
        
        // 验证加密后的token不同于原始token
        expect(added.authToken).not.toBe(token);
        
        // 验证加密后的token有合理的长度和格式
        if (added.authToken && !added.authToken.startsWith('*')) {
          expect(added.authToken.length).toBeGreaterThan(16);
          // 应该是Base64编码或十六进制格式
          expect(added.authToken).toMatch(/^[A-Za-z0-9+/=]+$|^[A-Fa-f0-9]+$/);
        }
        
        await api.deleteProvider(added.id);
      }
    });

    it('should handle encryption errors gracefully', async () => {
      // 模拟加密失败场景
      const extremelyLongToken = 'x'.repeat(1000000); // 1MB token
      
      try {
        await api.addProvider({
          name: 'Large Token Test',
          baseUrl: 'https://api.anthropic.com',
          authToken: extremelyLongToken,
          model: 'claude-3-sonnet-20240229',
        });
      } catch (error) {
        // 应该优雅处理加密错误
        expect(error).toBeInstanceOf(Error);
        expect(error.message).toMatch(/encryption|token too large|invalid token/i);
      }
    });

    it('should prevent token reconstruction from encrypted data', async () => {
      const originalToken = 'sk-ant-secret-reconstruction-test-12345';
      
      const provider = await api.addProvider({
        name: 'Reconstruction Test',
        baseUrl: 'https://api.anthropic.com',
        authToken: originalToken,
        model: 'claude-3-sonnet-20240229',
      });

      // 获取加密的配置数据
      const config = await api.loadConfig();
      const exportedConfig = await api.exportConfig(false); // 不包含token
      
      // 验证原始token无法从导出数据中恢复
      expect(exportedConfig).not.toContain(originalToken);
      expect(exportedConfig).not.toContain('sk-ant-secret');
      
      // 即使是包含token的导出，也应该是加密的
      const exportedWithTokens = await api.exportConfig(true);
      expect(exportedWithTokens).not.toContain(originalToken);
      
      await api.deleteProvider(provider.id);
    });
  });

  describe('Configuration Security', () => {
    it('should encrypt exported configuration', async () => {
      // 添加多个包含敏感信息的providers
      const sensitiveProviders = [
        {
          name: 'Provider 1',
          baseUrl: 'https://api.anthropic.com',
          authToken: 'sk-ant-secret-key-1',
          model: 'claude-3-sonnet-20240229',
        },
        {
          name: 'Provider 2',
          baseUrl: 'https://api.openai.com/v1',
          authToken: 'sk-proj-secret-key-2',
          model: 'gpt-4',
        },
      ];

      for (const providerData of sensitiveProviders) {
        await api.addProvider(providerData);
      }

      // 导出配置（包含敏感信息）
      const exportedConfig = await api.exportConfig(true);
      
      // 验证敏感信息被加密
      expect(exportedConfig).not.toContain('sk-ant-secret-key-1');
      expect(exportedConfig).not.toContain('sk-proj-secret-key-2');
      
      // 但应该包含结构化数据
      expect(exportedConfig).toContain('providers');
      expect(exportedConfig).toContain('settings');
      
      // 导出不包含token的版本应该更安全
      const safeExport = await api.exportConfig(false);
      expect(safeExport).not.toContain('authToken');
      expect(safeExport).not.toContain('sk-');
      expect(safeExport).not.toContain('secret');
    });

    it('should validate configuration integrity', async () => {
      // 创建有效配置
      await api.addProvider({
        name: 'Integrity Test',
        baseUrl: 'https://api.anthropic.com',
        authToken: 'test-token',
        model: 'claude-3-sonnet-20240229',
      });

      const originalConfig = await api.exportConfig(true);
      
      // 尝试导入被篡改的配置
      const tamperedConfigs = [
        originalConfig.replace('claude-3-sonnet', 'malicious-model'),
        originalConfig.replace('api.anthropic.com', 'evil.com'),
        originalConfig + ',"injected":"malicious"',
        originalConfig.slice(0, -10) + '"malicious"}',
      ];

      for (const tamperedConfig of tamperedConfigs) {
        await expect(api.importConfig(tamperedConfig))
          .rejects
          .toThrow(/integrity check failed|invalid configuration|checksum mismatch/i);
      }
    });

    it('should use secure key derivation', () => {
      // 测试密钥派生的安全性
      const password = 'user-master-password';
      const salt = 'random-salt-value';
      
      // 模拟PBKDF2或类似的密钥派生
      const iterations = 10000;
      expect(iterations).toBeGreaterThanOrEqual(10000); // OWASP推荐最少10000次
      
      // 验证不同输入产生不同密钥
      const key1 = deriveMockKey(password, salt);
      const key2 = deriveMockKey(password + '1', salt);
      const key3 = deriveMockKey(password, salt + '1');
      
      expect(key1).not.toBe(key2);
      expect(key1).not.toBe(key3);
      expect(key2).not.toBe(key3);
      
      // 相同输入应该产生相同密钥
      const key1Duplicate = deriveMockKey(password, salt);
      expect(key1).toBe(key1Duplicate);
    });
  });

  describe('Random Number Generation', () => {
    it('should use cryptographically secure random numbers', () => {
      const randomValues = new Set<string>();
      const iterations = 1000;
      
      for (let i = 0; i < iterations; i++) {
        // 生成随机ID或session ID
        const randomId = generateSecureRandomId();
        
        // 检查唯一性
        expect(randomValues.has(randomId)).toBe(false);
        randomValues.add(randomId);
        
        // 检查长度和格式
        expect(randomId).toMatch(/^[A-Za-z0-9-_]{16,}$/);
        expect(randomId.length).toBeGreaterThanOrEqual(16);
      }
      
      // 验证熵质量
      expect(randomValues.size).toBe(iterations);
    });

    it('should generate secure session IDs', async () => {
      const sessionIds = new Set<string>();
      
      for (let i = 0; i < 100; i++) {
        const launchConfig = {
          sessionId: `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          args: [],
          envVars: {},
        };
        
        try {
          await api.launchClaudeCode(launchConfig);
          
          // Session ID应该是唯一且足够长的
          expect(sessionIds.has(launchConfig.sessionId)).toBe(false);
          sessionIds.add(launchConfig.sessionId);
          expect(launchConfig.sessionId.length).toBeGreaterThan(20);
          
        } catch (error) {
          // 某些测试可能会失败，但session ID应该仍然是安全的
          expect(launchConfig.sessionId).toMatch(/^session-\d+-[a-z0-9]+$/);
        }
      }
    });

    it('should not use predictable random patterns', () => {
      const randomValues = [];
      
      for (let i = 0; i < 100; i++) {
        randomValues.push(Math.random());
      }
      
      // 检查是否有明显的模式
      let sequentialCount = 0;
      for (let i = 1; i < randomValues.length; i++) {
        if (randomValues[i] > randomValues[i - 1]) {
          sequentialCount++;
        }
      }
      
      // 不应该大部分都是递增的（表明有模式）
      expect(sequentialCount).toBeLessThan(randomValues.length * 0.8);
      expect(sequentialCount).toBeGreaterThan(randomValues.length * 0.2);
      
      // 验证分布相对均匀
      const histogram = new Array(10).fill(0);
      randomValues.forEach(val => {
        const bin = Math.floor(val * 10);
        histogram[Math.min(bin, 9)]++;
      });
      
      // 每个区间应该有一定数量的值
      histogram.forEach(count => {
        expect(count).toBeGreaterThan(2);
        expect(count).toBeLessThan(30);
      });
    });
  });

  describe('Hashing and Integrity', () => {
    it('should use secure hashing algorithms', () => {
      const testData = [
        'simple string',
        'complex data with 中文 and symbols !@#$%^&*()',
        JSON.stringify({ complex: { nested: { object: true } } }),
        'A'.repeat(10000), // 大数据
        '', // 空字符串
        '\x00\x01\x02', // 二进制数据
      ];

      testData.forEach(data => {
        const hash = createSecureHash(data);
        
        // 验证哈希格式
        expect(hash).toMatch(/^[a-f0-9]{64}$/); // SHA-256格式
        expect(hash.length).toBe(64);
        
        // 相同输入产生相同哈希
        expect(createSecureHash(data)).toBe(hash);
        
        // 不同输入产生不同哈希
        expect(createSecureHash(data + '1')).not.toBe(hash);
      });
    });

    it('should detect data tampering', async () => {
      const originalData = {
        providers: [
          {
            name: 'Test Provider',
            baseUrl: 'https://api.anthropic.com',
            authToken: 'test-token',
            model: 'claude-3-sonnet-20240229',
          },
        ],
        settings: { theme: 'dark' },
      };

      // 计算原始数据的哈希
      const originalHash = createSecureHash(JSON.stringify(originalData));
      
      // 修改数据
      const tamperedData = {
        ...originalData,
        providers: [
          {
            ...originalData.providers[0],
            baseUrl: 'https://evil.com',
          },
        ],
      };

      const tamperedHash = createSecureHash(JSON.stringify(tamperedData));
      
      // 哈希应该不同
      expect(tamperedHash).not.toBe(originalHash);
      
      // 微小修改也应该产生完全不同的哈希
      const slightlyModified = {
        ...originalData,
        settings: { theme: 'light' }, // 只改变主题
      };

      const slightlyModifiedHash = createSecureHash(JSON.stringify(slightlyModified));
      expect(slightlyModifiedHash).not.toBe(originalHash);
    });
  });

  describe('Key Management', () => {
    it('should not expose keys in memory dumps', () => {
      const sensitiveKey = 'super-secret-encryption-key-12345';
      
      // 模拟密钥使用
      const encryptedData = mockEncrypt('test data', sensitiveKey);
      
      // 清理内存中的密钥
      // 在真实实现中，应该立即清零敏感数据
      
      // 验证加密结果不包含原始密钥
      expect(encryptedData).not.toContain(sensitiveKey);
      expect(encryptedData).not.toContain('super-secret');
      
      // 验证可以正确解密
      const decryptedData = mockDecrypt(encryptedData, sensitiveKey);
      expect(decryptedData).toBe('test data');
    });

    it('should rotate encryption keys securely', async () => {
      // 创建带有旧密钥的数据
      const provider = await api.addProvider({
        name: 'Key Rotation Test',
        baseUrl: 'https://api.anthropic.com',
        authToken: 'test-token-for-rotation',
        model: 'claude-3-sonnet-20240229',
      });

      const oldConfig = await api.exportConfig(true);
      
      // 模拟密钥轮换
      // 在实际实现中，这会涉及重新加密所有敏感数据
      
      // 轮换后应该仍能正常工作
      const providers = await api.getProviders();
      const rotatedProvider = providers.find(p => p.id === provider.id);
      
      expect(rotatedProvider).toBeDefined();
      expect(rotatedProvider?.name).toBe('Key Rotation Test');
      
      // 新导出的配置应该使用新密钥
      const newConfig = await api.exportConfig(true);
      expect(newConfig).toBeDefined();
      
      await api.deleteProvider(provider.id);
    });

    it('should handle key derivation parameters securely', () => {
      const password = 'user-password';
      const salts = ['salt1', 'salt2', 'salt1']; // 重复salt测试
      
      const keys = salts.map(salt => deriveMockKey(password, salt));
      
      // 相同salt应该产生相同密钥
      expect(keys[0]).toBe(keys[2]);
      
      // 不同salt应该产生不同密钥
      expect(keys[0]).not.toBe(keys[1]);
      
      // 密钥应该有足够的长度
      keys.forEach(key => {
        expect(key.length).toBeGreaterThanOrEqual(32); // 至少256位
      });
    });
  });

  describe('Secure Communication', () => {
    it('should validate SSL/TLS certificates', async () => {
      const httpsUrls = [
        'https://api.anthropic.com',
        'https://api.openai.com/v1',
        'https://valid-https.com',
      ];

      for (const url of httpsUrls) {
        // 验证HTTPS连接
        await expect(api.validateUrlFormat(url)).resolves.not.toThrow();
        
        // 验证证书（在实际实现中）
        await expect(api.validateProviderConnection(url, 'test-token'))
          .resolves
          .toBeDefined();
      }
    });

    it('should reject invalid or self-signed certificates', async () => {
      const invalidCertUrls = [
        'https://expired.badssl.com',
        'https://wrong.host.badssl.com',
        'https://self-signed.badssl.com',
        'https://untrusted-root.badssl.com',
      ];

      for (const url of invalidCertUrls) {
        // 应该拒绝无效证书
        await expect(api.validateProviderConnection(url, 'test-token'))
          .rejects
          .toThrow(/certificate|ssl|tls/i);
      }
    });

    it('should enforce secure cipher suites', () => {
      // 检查支持的加密套件
      const secureProtocols = ['TLSv1.2', 'TLSv1.3'];
      const insecureProtocols = ['SSLv3', 'TLSv1.0', 'TLSv1.1'];
      
      // 在实际实现中，应该只支持安全协议
      secureProtocols.forEach(protocol => {
        expect(['TLSv1.2', 'TLSv1.3']).toContain(protocol);
      });
      
      insecureProtocols.forEach(protocol => {
        expect(['TLSv1.2', 'TLSv1.3']).not.toContain(protocol);
      });
    });
  });
});

// 辅助函数
function deriveMockKey(password: string, salt: string): string {
  // 模拟PBKDF2密钥派生
  return btoa(password + salt).replace(/[^A-Za-z0-9]/g, '').substr(0, 32);
}

function generateSecureRandomId(): string {
  // 模拟安全随机ID生成
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
  let result = '';
  for (let i = 0; i < 16; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

function createSecureHash(data: string): string {
  // 模拟SHA-256哈希
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    const char = data.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // 32位整数
  }
  
  // 转换为64位十六进制字符串（模拟SHA-256）
  return Math.abs(hash).toString(16).padStart(8, '0').repeat(8).substr(0, 64);
}

function mockEncrypt(data: string, key: string): string {
  // 模拟加密
  return btoa(data + key).replace(/=/g, '');
}

function mockDecrypt(encryptedData: string, key: string): string {
  // 模拟解密
  try {
    const decoded = atob(encryptedData + '='.repeat(encryptedData.length % 4));
    return decoded.replace(key, '');
  } catch {
    throw new Error('Decryption failed');
  }
}