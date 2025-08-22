import type {
  Configuration,
  Provider,
  CreateProviderRequest,
  UpdateProviderRequest,
  AppSettings,
  ValidationResult,
  ConnectionTest,
  EnvironmentInfo,
  LaunchConfig,
  ProcessInfo,
  ProcessStatus,
} from '@/types';

// 模拟数据
const mockProviders: Provider[] = [
  {
    id: '1',
    name: '默认提供商',
    baseUrl: 'https://api.anthropic.com',
    authToken: 'sk-ant-api03-...',
    model: 'claude-3-sonnet-20240229',
    smallFastModel: 'claude-3-haiku-20240307',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    isActive: true,
    tags: ['默认', '官方'],
    description: 'Anthropic 官方 API',
  },
  {
    id: '2', 
    name: '测试提供商',
    baseUrl: 'https://api.test.com',
    authToken: 'test-token-123',
    model: 'claude-3-opus-20240229',
    smallFastModel: 'claude-3-haiku-20240307',
    createdAt: '2024-01-02T00:00:00Z',
    updatedAt: '2024-01-02T00:00:00Z',
    isActive: false,
    tags: ['测试'],
    description: '测试环境API',
  },
];

let activeProviderId = '1';
let providers = [...mockProviders];

class MockApiService {
  // 配置管理
  async loadConfig(): Promise<Configuration> {
    return {
      version: '1.0.0',
      activeProviderId,
      providers: [...providers],
      settings: {
        theme: 'system',
        language: 'zh-CN',
        autoValidate: true,
        autoStart: false,
        startMinimized: false,
        closeToTray: true,
        startupArgs: [],
        updateCheck: true,
        telemetry: false,
        notifications: {
          enabled: true,
          showValidationResults: true,
          showProviderSwitch: true,
          showLaunchStatus: true,
          showErrors: true,
          soundEnabled: false,
        },
        security: {
          requireConfirmationForDelete: true,
          requireConfirmationForSwitch: true,
          clearClipboardOnExit: false,
          logSensitiveOperations: true,
        },
      },
      metadata: {
        configVersion: '1.0.0',
        lastModified: new Date().toISOString(),
        backupEnabled: true,
        encryptionEnabled: true,
        createdAt: '2024-01-01T00:00:00Z',
      },
    };
  }

  async saveConfig(): Promise<void> {
    // 模拟保存配置
    await this.delay(100);
  }

  async exportConfig(includeTokens: boolean = false): Promise<string> {
    const config = await this.loadConfig();
    if (!includeTokens) {
      config.providers = config.providers.map(p => ({ ...p, authToken: '***' }));
    }
    return JSON.stringify(config, null, 2);
  }

  async importConfig(configJson: string, merge: boolean = false): Promise<Configuration> {
    const config = JSON.parse(configJson);
    if (!merge) {
      providers = config.providers || [];
      activeProviderId = config.activeProviderId || '';
    }
    return config;
  }

  async updateSettings(settings: AppSettings): Promise<void> {
    await this.delay(100);
  }

  async cleanupOldBackups(): Promise<string[]> {
    return ['backup1.json', 'backup2.json'];
  }

  // 提供商管理
  async getProviders(): Promise<Provider[]> {
    await this.delay(200);
    // 返回时掩码token以保护敏感信息
    return providers.map(p => ({
      ...p,
      authToken: p.authToken ? this.maskToken(p.authToken) : p.authToken,
    }));
  }

  async getProviderById(id: string): Promise<Provider | null> {
    await this.delay(100);
    return providers.find(p => p.id === id) || null;
  }

  async getActiveProvider(): Promise<Provider | null> {
    await this.delay(100);
    return providers.find(p => p.id === activeProviderId) || null;
  }

  async addProvider(request: CreateProviderRequest): Promise<Provider> {
    await this.delay(300);
    
    // 安全验证
    this.validateProviderInput(request);
    
    const newProvider: Provider = {
      id: Date.now().toString(),
      ...request,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isActive: false,
    };
    providers.push(newProvider);
    return newProvider;
  }

  async updateProvider(id: string, request: UpdateProviderRequest): Promise<Provider> {
    await this.delay(200);
    const index = providers.findIndex(p => p.id === id);
    if (index === -1) {
      throw new Error('Provider not found');
    }
    
    providers[index] = {
      ...providers[index],
      ...request,
      updatedAt: new Date().toISOString(),
    };
    
    return providers[index];
  }

  async deleteProvider(id: string): Promise<void> {
    await this.delay(200);
    const index = providers.findIndex(p => p.id === id);
    if (index === -1) {
      throw new Error('Provider not found');
    }
    providers.splice(index, 1);
    
    // 如果删除的是激活的提供商，清除激活状态
    if (activeProviderId === id) {
      activeProviderId = '';
    }
  }

  async switchProvider(id: string): Promise<Provider> {
    await this.delay(300);
    const provider = providers.find(p => p.id === id);
    if (!provider) {
      throw new Error('Provider not found');
    }
    
    // 更新激活状态
    providers.forEach(p => {
      p.isActive = p.id === id;
    });
    activeProviderId = id;
    
    return provider;
  }

  // 环境管理
  async switchEnvironment(providerId: string): Promise<void> {
    await this.delay(200);
    await this.switchProvider(providerId);
  }

  async getCurrentEnvironment(): Promise<EnvironmentInfo> {
    await this.delay(100);
    const activeProvider = await this.getActiveProvider();
    
    return {
      baseUrl: activeProvider?.baseUrl,
      model: activeProvider?.model,
      smallFastModel: activeProvider?.smallFastModel,
      providerName: activeProvider?.name,
      isAuthenticated: !!activeProvider?.authToken,
      lastValidated: new Date().toISOString(),
    };
  }

  async clearEnvironment(): Promise<void> {
    await this.delay(100);
    providers.forEach(p => {
      p.isActive = false;
    });
    activeProviderId = '';
  }

  async getAllEnvVars(): Promise<Record<string, string>> {
    await this.delay(100);
    const activeProvider = await this.getActiveProvider();
    
    if (!activeProvider) {
      return {};
    }
    
    return {
      ANTHROPIC_BASE_URL: activeProvider.baseUrl,
      ANTHROPIC_AUTH_TOKEN: activeProvider.authToken || '',
      ANTHROPIC_MODEL: activeProvider.model,
      ANTHROPIC_SMALL_FAST_MODEL: activeProvider.smallFastModel,
    };
  }

  // 验证
  async validateProviderConnection(baseUrl: string, authToken: string): Promise<ConnectionTest> {
    await this.delay(500);
    
    // 基础验证
    await this.validateUrlFormat(baseUrl);
    await this.validateAuthTokenFormat(authToken);
    
    return {
      status: 'success',
      latency: 150,
      responseCode: 200,
    };
  }

  async validateProviderFull(
    providerId: string,
    baseUrl: string,
    authToken: string,
    model: string
  ): Promise<ValidationResult> {
    await this.delay(800);
    return {
      providerId,
      isValid: true,
      connectionStatus: 'success',
      authStatus: 'valid',
      modelStatus: 'available',
      errors: [],
      warnings: [],
      latency: 150,
      testedAt: new Date().toISOString(),
    };
  }

  async validateUrlFormat(url: string): Promise<void> {
    await this.delay(50);
    if (!url.startsWith('http')) {
      throw new Error('URL must start with http or https');
    }
  }

  async validateAuthTokenFormat(token: string): Promise<void> {
    await this.delay(50);
    if (token.length < 10) {
      throw new Error('Auth token is too short');
    }
  }

  async validateModelName(model: string): Promise<void> {
    await this.delay(50);
    if (!model.includes('claude')) {
      throw new Error('Model name should contain "claude"');
    }
  }

  // 启动器
  async launchClaudeCode(config: LaunchConfig): Promise<ProcessInfo> {
    await this.delay(1000);
    
    // 安全验证
    this.validateLaunchConfig(config);
    
    return {
      pid: 12345,
      sessionId: config.sessionId,
      startedAt: new Date().toISOString(),
      status: 'running',
    };
  }

  async getProcessStatus(sessionId: string): Promise<ProcessStatus> {
    await this.delay(100);
    
    // 简单的session验证
    if (!sessionId || sessionId.length < 5) {
      throw new Error('Invalid session');
    }
    
    // 只允许特定格式的session ID
    if (!sessionId.startsWith('session-') && !sessionId.startsWith('legitimate-session-')) {
      throw new Error('Session not found');
    }
    
    return 'running';
  }

  async terminateProcess(sessionId: string): Promise<void> {
    await this.delay(200);
  }

  async listActiveProcesses(): Promise<string[]> {
    await this.delay(100);
    return ['session-1', 'session-2'];
  }

  async cleanupFinishedProcesses(): Promise<string[]> {
    await this.delay(200);
    return ['finished-session-1'];
  }

  async getSystemInfo(): Promise<Record<string, string>> {
    await this.delay(100);
    return {
      platform: 'win32',
      arch: 'x64',
      version: '1.0.0',
      nodeVersion: '18.0.0',
    };
  }

  async openFileManager(path?: string): Promise<void> {
    await this.delay(100);
    
    // 路径安全验证
    if (path) {
      this.validateFilePath(path);
    }
    
    console.log('Opening file manager:', path);
  }

  async openUrl(url: string): Promise<void> {
    await this.delay(100);
    
    // URL安全验证
    this.validateUrl(url);
    
    console.log('Opening URL:', url);
  }

  // 安全验证方法
  private validateProviderInput(request: CreateProviderRequest): void {
    // SQL注入检测
    const sqlPatterns = [
      /';.*DROP\s+TABLE/i,
      /'\s+OR\s+['"]?1['"]?\s*=\s*['"]?1/i,
      /UNION.*SELECT/i,
      /INSERT\s+INTO/i,
      /UPDATE.*SET/i,
      /DELETE\s+FROM/i,
    ];

    // XSS检测
    const xssPatterns = [
      /<script.*?>/i,
      /javascript:/i,
      /on\w+\s*=/i,
      /<iframe.*?>/i,
      /eval\s*\(/i,
    ];

    // 命令注入检测
    const commandPatterns = [
      /;\s*(rm|del|format|shutdown)/i,
      /\$\(.*\)/,
      /`.*`/,
      /&&.*rm/i,
      /\|\s*nc\s/i,
    ];

    const allPatterns = [...sqlPatterns, ...xssPatterns, ...commandPatterns];
    const inputFields = [request.name, request.baseUrl, request.authToken, request.model, request.description].filter(Boolean);

    for (const field of inputFields) {
      for (const pattern of allPatterns) {
        if (pattern.test(field || '')) {
          throw new Error('Invalid input detected');
        }
      }
      
      // 检查长度限制
      if ((field || '').length > 10000) {
        throw new Error(`Field too long`);
      }
    }

    // URL格式验证
    if (request.baseUrl && !request.baseUrl.startsWith('https://')) {
      throw new Error('HTTPS required');
    }

    // 内网地址检测 (SSRF防护)
    const localIpPatterns = [
      /127\.0\.0\.1/,
      /localhost/i,
      /192\.168\./,
      /10\./,
      /172\.(1[6-9]|2[0-9]|3[01])\./,
      /169\.254\./,
    ];

    if (request.baseUrl) {
      for (const pattern of localIpPatterns) {
        if (pattern.test(request.baseUrl)) {
          throw new Error('Internal network access denied');
        }
      }
    }
  }

  private validateLaunchConfig(config: LaunchConfig): void {
    // 命令注入检测
    const dangerousArgs = [
      '--enable-logging',
      '--remote-debugging-port',
      '--disable-web-security',
      '--js-flags',
    ];

    if (config.args) {
      for (const arg of config.args) {
        for (const dangerous of dangerousArgs) {
          if (arg.includes(dangerous)) {
            throw new Error('Invalid launch arguments');
          }
        }
        
        // 检查命令注入模式
        if (/[;&|`$(]/.test(arg)) {
          throw new Error('Command injection detected');
        }
      }
    }

    // 工作目录验证
    const dangerousPaths = [
      '/etc',
      '/root',
      '/usr/bin',
      'C:\\Windows\\System32',
      '/System/Library',
    ];

    if (config.workingDirectory) {
      for (const dangerous of dangerousPaths) {
        if (config.workingDirectory.startsWith(dangerous)) {
          throw new Error('Invalid working directory');
        }
      }
    }
  }

  private validateUrl(url: string): void {
    // 协议验证
    const allowedProtocols = ['https:'];
    const urlObj = new URL(url);
    
    if (!allowedProtocols.includes(urlObj.protocol)) {
      throw new Error('Invalid URL scheme');
    }

    // SSRF防护
    const localIpPatterns = [
      /127\.0\.0\.1/,
      /localhost/i,
      /192\.168\./,
      /10\./,
      /172\.(1[6-9]|2[0-9]|3[01])\./,
      /169\.254\./,
    ];

    for (const pattern of localIpPatterns) {
      if (pattern.test(urlObj.hostname)) {
        throw new Error('SSRF protection');
      }
    }
  }

  private validateFilePath(path: string): void {
    // 路径遍历检测
    const dangerousPatterns = [
      /\.\.\//,
      /\.\.\\/,
      /\/etc\//,
      /\/root\//,
      /C:\\Windows\\System32/,
      /\\etc\\/,
    ];

    for (const pattern of dangerousPatterns) {
      if (pattern.test(path)) {
        throw new Error('Path traversal detected');
      }
    }
  }

  private maskToken(token: string): string {
    if (token.length <= 8) return '*'.repeat(token.length);
    return token.substring(0, 4) + '*'.repeat(token.length - 8) + token.substring(token.length - 4);
  }

  // 辅助方法
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export const api = new MockApiService();
export default api;