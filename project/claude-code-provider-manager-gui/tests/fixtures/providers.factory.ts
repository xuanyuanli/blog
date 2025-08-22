/**
 * Provider 测试数据工厂
 * 提供各种场景下的 Provider 测试数据
 */

import { Provider, ProviderInput } from '@/types';

/**
 * 创建标准有效的 Provider
 */
export function createValidProvider(overrides: Partial<Provider> = {}): Provider {
  const now = new Date().toISOString();
  
  return {
    id: `provider-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    name: 'Test Provider',
    baseUrl: 'https://api.anthropic.com',
    model: 'claude-3-sonnet-20240229',
    smallFastModel: 'claude-3-haiku-20240307',
    isActive: false,
    isValid: true,
    lastValidated: now,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

/**
 * 创建无效的 Provider (用于错误测试)
 */
export function createInvalidProvider(type: 'missing-fields' | 'invalid-url' | 'invalid-model' = 'missing-fields'): Partial<Provider> {
  const base = createValidProvider();
  
  switch (type) {
    case 'missing-fields':
      return {
        id: base.id,
        name: base.name,
        // 缺少必要字段
      };
    
    case 'invalid-url':
      return {
        ...base,
        baseUrl: 'not-a-valid-url',
      };
    
    case 'invalid-model':
      return {
        ...base,
        model: 'non-existent-model',
        smallFastModel: 'another-non-existent-model',
      };
    
    default:
      return base;
  }
}

/**
 * 创建历史版本兼容的 Provider
 */
export function createLegacyProvider(version: 'v1' | 'v2' = 'v1'): any {
  const base = createValidProvider();
  
  switch (version) {
    case 'v1':
      // 移除新版本字段，模拟旧版本数据
      const { lastValidated, smallFastModel, ...legacy } = base;
      return {
        ...legacy,
        // 旧版本可能有的字段
        apiKey: 'legacy-api-key',
        endpoint: base.baseUrl,
      };
    
    case 'v2':
      return {
        ...base,
        // v2 版本特有字段
        maxTokens: 4096,
        temperature: 0.7,
      };
    
    default:
      return base;
  }
}

/**
 * 创建性能测试用的大量 Provider 数据
 */
export function createLargeDatasetProviders(count: number): Provider[] {
  const providers: Provider[] = [];
  
  for (let i = 0; i < count; i++) {
    providers.push(createValidProvider({
      name: `Provider ${i + 1}`,
      baseUrl: `https://api-${i + 1}.example.com`,
      isActive: i === 0, // 只有第一个是激活的
    }));
  }
  
  return providers;
}

/**
 * 创建包含敏感数据的 Provider (用于加密测试)
 */
export function createProviderWithSecrets(secrets: Partial<{
  authToken: string;
  apiKey: string;
  privateKey: string;
}> = {}): Provider & { authToken?: string; apiKey?: string; privateKey?: string } {
  return {
    ...createValidProvider(),
    authToken: 'sk-ant-api03-test-token-12345',
    apiKey: 'test-api-key-67890',
    privateKey: 'test-private-key-abcdef',
    ...secrets,
  };
}

/**
 * 掩码敏感数据 (用于显示安全测试)
 */
export function maskSensitiveData(provider: Provider & { authToken?: string }): Provider & { authToken?: string } {
  if (provider.authToken) {
    // 保留前3位和后4位，中间用*替换
    const token = provider.authToken;
    if (token.length > 7) {
      const masked = token.slice(0, 3) + '*'.repeat(token.length - 7) + token.slice(-4);
      return { ...provider, authToken: masked };
    } else {
      return { ...provider, authToken: '*'.repeat(token.length) };
    }
  }
  return provider;
}

/**
 * 创建 Provider 输入数据 (用于表单测试)
 */
export function createProviderInput(overrides: Partial<ProviderInput> = {}): ProviderInput {
  return {
    name: 'New Test Provider',
    baseUrl: 'https://api.example.com',
    model: 'claude-3-sonnet-20240229',
    smallFastModel: 'claude-3-haiku-20240307',
    isActive: false,
    isValid: false,
    ...overrides,
  };
}

/**
 * 创建各种状态的 Provider 集合
 */
export function createProviderCollection(): {
  active: Provider;
  inactive: Provider;
  validating: Provider;
  error: Provider;
  new: Provider;
} {
  const now = new Date().toISOString();
  
  return {
    active: createValidProvider({
      name: 'Active Provider',
      isActive: true,
      isValid: true,
      lastValidated: now,
    }),
    
    inactive: createValidProvider({
      name: 'Inactive Provider', 
      isActive: false,
      isValid: true,
      lastValidated: now,
    }),
    
    validating: createValidProvider({
      name: 'Validating Provider',
      isActive: false,
      isValid: false,
      lastValidated: undefined,
    }),
    
    error: createValidProvider({
      name: 'Error Provider',
      isActive: false,
      isValid: false,
      lastValidated: new Date(Date.now() - 86400000).toISOString(), // 1天前
    }),
    
    new: createValidProvider({
      name: 'New Provider',
      isActive: false,
      isValid: false,
      lastValidated: undefined,
      createdAt: now,
      updatedAt: now,
    }),
  };
}

/**
 * 创建边界条件测试数据
 */
export function createBoundaryProviders(): {
  emptyName: Provider;
  longName: Provider;
  specialChars: Provider;
  unicode: Provider;
  maxLength: Provider;
} {
  return {
    emptyName: createValidProvider({ name: '' }),
    
    longName: createValidProvider({ 
      name: 'A'.repeat(1000) // 1000字符的长名称
    }),
    
    specialChars: createValidProvider({
      name: '!@#$%^&*()_+-=[]{}|;:,.<>?',
      baseUrl: 'https://api-special-chars.example.com'
    }),
    
    unicode: createValidProvider({
      name: '测试提供商 🚀 Provider тест Провайдер',
      baseUrl: 'https://测试.example.com'
    }),
    
    maxLength: createValidProvider({
      name: 'X'.repeat(255), // 假设最大长度为255
      baseUrl: 'https://' + 'a'.repeat(240) + '.com' // 接近URL最大长度
    }),
  };
}

/**
 * 创建网络错误场景的 Provider
 */
export function createNetworkErrorProviders(): {
  timeout: Provider;
  notFound: Provider;
  unauthorized: Provider;
  serverError: Provider;
  rateLimited: Provider;
} {
  return {
    timeout: createValidProvider({
      name: 'Timeout Provider',
      baseUrl: 'https://timeout.example.com'
    }),
    
    notFound: createValidProvider({
      name: 'Not Found Provider',
      baseUrl: 'https://notfound.example.com'
    }),
    
    unauthorized: createValidProvider({
      name: 'Unauthorized Provider', 
      baseUrl: 'https://unauthorized.example.com'
    }),
    
    serverError: createValidProvider({
      name: 'Server Error Provider',
      baseUrl: 'https://servererror.example.com'
    }),
    
    rateLimited: createValidProvider({
      name: 'Rate Limited Provider',
      baseUrl: 'https://ratelimited.example.com'
    }),
  };
}