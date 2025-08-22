/**
 * 外部 API Mock
 * 模拟 Claude API 和其他外部服务
 */

import { 
  createSuccessResponse,
  createErrorResponse,
  createValidationSuccessResponse,
  createValidationErrorResponse,
  createClaudeApiResponses,
  createRateLimitResponse,
  HttpStatus
} from '@/fixtures/api-responses.factory';
import { Provider } from '@/types';

/**
 * Claude API Mock 服务器
 */
export class MockClaudeApiServer {
  private isRunning = false;
  private responses: Map<string, any> = new Map();
  private requestHistory: Array<{
    endpoint: string;
    method: string;
    headers: Record<string, string>;
    body?: any;
    timestamp: number;
  }> = [];
  private latencyMs = 100;
  private errorRate = 0;

  constructor() {
    this.setupDefaultResponses();
  }

  /**
   * 设置默认响应
   */
  private setupDefaultResponses() {
    const claudeResponses = createClaudeApiResponses();
    
    this.responses.set('GET:/v1/models', claudeResponses.modelList);
    this.responses.set('POST:/v1/chat/completions', claudeResponses.chatCompletion);
    this.responses.set('POST:/v1/messages', claudeResponses.chatCompletion);
  }

  /**
   * 启动模拟服务器
   */
  start() {
    this.isRunning = true;
  }

  /**
   * 停止模拟服务器
   */
  stop() {
    this.isRunning = false;
  }

  /**
   * 处理 API 请求
   */
  async handleRequest(
    method: string,
    endpoint: string,
    headers: Record<string, string> = {},
    body?: any
  ) {
    if (!this.isRunning) {
      throw new Error('Service unavailable');
    }

    // 记录请求
    this.requestHistory.push({
      endpoint,
      method,
      headers,
      body,
      timestamp: Date.now(),
    });

    // 模拟延迟
    if (this.latencyMs > 0) {
      await new Promise(resolve => setTimeout(resolve, this.latencyMs));
    }

    // 模拟随机错误
    if (Math.random() < this.errorRate) {
      return createErrorResponse(
        'Simulated server error',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }

    // 验证授权
    const authHeader = headers['Authorization'] || headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return createErrorResponse(
        'Missing or invalid authorization header',
        HttpStatus.UNAUTHORIZED
      );
    }

    // 获取响应
    const key = `${method}:${endpoint}`;
    const response = this.responses.get(key);
    
    if (!response) {
      return createErrorResponse(
        'Endpoint not found',
        HttpStatus.NOT_FOUND
      );
    }

    return response;
  }

  /**
   * 设置自定义响应
   */
  setResponse(method: string, endpoint: string, response: any) {
    this.responses.set(`${method}:${endpoint}`, response);
  }

  /**
   * 设置延迟
   */
  setLatency(ms: number) {
    this.latencyMs = ms;
  }

  /**
   * 设置错误率
   */
  setErrorRate(rate: number) {
    this.errorRate = Math.max(0, Math.min(1, rate));
  }

  /**
   * 获取请求历史
   */
  getRequestHistory() {
    return [...this.requestHistory];
  }

  /**
   * 清除请求历史
   */
  clearHistory() {
    this.requestHistory = [];
  }

  /**
   * 模拟速率限制
   */
  enableRateLimit(requestsPerMinute: number = 60) {
    const interval = 60000 / requestsPerMinute; // ms between requests
    let lastRequestTime = 0;

    const originalHandle = this.handleRequest.bind(this);
    this.handleRequest = async (method, endpoint, headers, body) => {
      const now = Date.now();
      const timeSinceLastRequest = now - lastRequestTime;
      
      if (timeSinceLastRequest < interval) {
        return createRateLimitResponse();
      }
      
      lastRequestTime = now;
      return originalHandle(method, endpoint, headers, body);
    };
  }
}

/**
 * Provider 验证服务 Mock
 */
export class MockProviderValidationService {
  private validationResults: Map<string, any> = new Map();
  private validationDelay = 1000;

  /**
   * 验证 Provider
   */
  async validateProvider(provider: Provider): Promise<any> {
    // 模拟验证延迟
    await new Promise(resolve => setTimeout(resolve, this.validationDelay));

    // 检查是否有预设结果
    const presetResult = this.validationResults.get(provider.id);
    if (presetResult) {
      return presetResult;
    }

    // 基于 Provider 配置生成验证结果
    return this.generateValidationResult(provider);
  }

  /**
   * 生成验证结果
   */
  private generateValidationResult(provider: Provider) {
    // 模拟各种验证场景
    const scenarios = {
      'invalid-url': () => createValidationErrorResponse(provider, 'connection'),
      'unauthorized': () => createValidationErrorResponse(provider, 'auth'),
      'invalid-model': () => createValidationErrorResponse(provider, 'model'),
      'timeout': () => createValidationErrorResponse(provider, 'timeout'),
    };

    // 检查 Provider 配置
    if (!provider.baseUrl.startsWith('http')) {
      return scenarios['invalid-url']();
    }

    if (provider.baseUrl.includes('unauthorized')) {
      return scenarios['unauthorized']();
    }

    if (provider.model.includes('invalid')) {
      return scenarios['invalid-model']();
    }

    if (provider.baseUrl.includes('timeout')) {
      return scenarios['timeout']();
    }

    // 默认成功
    return createValidationSuccessResponse(provider);
  }

  /**
   * 设置验证结果
   */
  setValidationResult(providerId: string, result: any) {
    this.validationResults.set(providerId, result);
  }

  /**
   * 设置验证延迟
   */
  setValidationDelay(ms: number) {
    this.validationDelay = ms;
  }

  /**
   * 批量验证
   */
  async validateProviders(providers: Provider[]): Promise<any[]> {
    const results = await Promise.all(
      providers.map(provider => this.validateProvider(provider))
    );
    return results;
  }
}

/**
 * Claude Code 启动器 Mock
 */
export class MockClaudeCodeLauncher {
  private isInstalled = true;
  private installPath = '/usr/local/bin/claude-code';
  private version = '1.0.0';
  private processes: Map<string, { pid: number; args: string[] }> = new Map();

  /**
   * 检查 Claude Code 是否已安装
   */
  isClaudeCodeInstalled(): boolean {
    return this.isInstalled;
  }

  /**
   * 获取 Claude Code 版本
   */
  getVersion(): string | null {
    return this.isInstalled ? this.version : null;
  }

  /**
   * 启动 Claude Code
   */
  async launch(args: string[] = []): Promise<{ pid: number; success: boolean }> {
    if (!this.isInstalled) {
      throw new Error('Claude Code is not installed');
    }

    const pid = Math.floor(Math.random() * 10000) + 1000;
    const sessionId = `session-${Date.now()}`;
    
    this.processes.set(sessionId, { pid, args });

    // 模拟启动延迟
    await new Promise(resolve => setTimeout(resolve, 500));

    return { pid, success: true };
  }

  /**
   * 检查进程是否运行
   */
  isProcessRunning(pid: number): boolean {
    return Array.from(this.processes.values()).some(p => p.pid === pid);
  }

  /**
   * 终止进程
   */
  killProcess(pid: number): boolean {
    const entry = Array.from(this.processes.entries())
      .find(([, process]) => process.pid === pid);
    
    if (entry) {
      this.processes.delete(entry[0]);
      return true;
    }
    
    return false;
  }

  /**
   * 获取运行中的进程
   */
  getRunningProcesses() {
    return Array.from(this.processes.values());
  }

  /**
   * 设置安装状态
   */
  setInstalled(installed: boolean) {
    this.isInstalled = installed;
  }

  /**
   * 设置安装路径
   */
  setInstallPath(path: string) {
    this.installPath = path;
  }

  /**
   * 设置版本
   */
  setVersion(version: string) {
    this.version = version;
  }
}

/**
 * 错误注入工具
 */
export class ErrorInjector {
  private errorScenarios: Map<string, () => Error> = new Map();
  private enabled = false;

  constructor() {
    this.setupDefaultScenarios();
  }

  /**
   * 设置默认错误场景
   */
  private setupDefaultScenarios() {
    this.errorScenarios.set('network_timeout', () => 
      new Error('Request timeout')
    );
    
    this.errorScenarios.set('connection_refused', () => 
      new Error('ECONNREFUSED')
    );
    
    this.errorScenarios.set('dns_failure', () => 
      new Error('ENOTFOUND')
    );
    
    this.errorScenarios.set('ssl_error', () => 
      new Error('CERT_INVALID')
    );
    
    this.errorScenarios.set('quota_exceeded', () => 
      new Error('Quota exceeded')
    );
  }

  /**
   * 启用错误注入
   */
  enable() {
    this.enabled = true;
  }

  /**
   * 禁用错误注入
   */
  disable() {
    this.enabled = false;
  }

  /**
   * 添加错误场景
   */
  addScenario(name: string, errorFactory: () => Error) {
    this.errorScenarios.set(name, errorFactory);
  }

  /**
   * 注入错误
   */
  injectError(scenarioName: string): Error | null {
    if (!this.enabled) return null;
    
    const errorFactory = this.errorScenarios.get(scenarioName);
    return errorFactory ? errorFactory() : null;
  }

  /**
   * 随机注入错误
   */
  injectRandomError(probability: number = 0.1): Error | null {
    if (!this.enabled || Math.random() > probability) return null;
    
    const scenarios = Array.from(this.errorScenarios.keys());
    const randomScenario = scenarios[Math.floor(Math.random() * scenarios.length)];
    return this.injectError(randomScenario);
  }
}

/**
 * 创建外部 API Mock 工厂
 */
export function createExternalApiMocks() {
  const claudeApiServer = new MockClaudeApiServer();
  const validationService = new MockProviderValidationService();
  const claudeCodeLauncher = new MockClaudeCodeLauncher();
  const errorInjector = new ErrorInjector();

  return {
    claudeApiServer,
    validationService,
    claudeCodeLauncher,
    errorInjector,

    // 启动所有服务
    startAll: () => {
      claudeApiServer.start();
    },

    // 停止所有服务
    stopAll: () => {
      claudeApiServer.stop();
    },

    // 重置所有服务
    reset: () => {
      claudeApiServer.stop();
      claudeApiServer.clearHistory();
      claudeApiServer.setLatency(100);
      claudeApiServer.setErrorRate(0);
      
      validationService.setValidationDelay(1000);
      
      claudeCodeLauncher.setInstalled(true);
      claudeCodeLauncher.setVersion('1.0.0');
      
      errorInjector.disable();
    },

    // 预设场景
    scenarios: {
      // 正常环境
      normal: () => {
        claudeApiServer.start();
        claudeApiServer.setLatency(100);
        claudeApiServer.setErrorRate(0);
        validationService.setValidationDelay(1000);
        claudeCodeLauncher.setInstalled(true);
        errorInjector.disable();
      },

      // 高延迟环境
      highLatency: () => {
        claudeApiServer.setLatency(3000);
        validationService.setValidationDelay(5000);
      },

      // 错误频发环境
      errorProne: () => {
        claudeApiServer.setErrorRate(0.3);
        errorInjector.enable();
      },

      // Claude Code 未安装
      claudeCodeMissing: () => {
        claudeCodeLauncher.setInstalled(false);
      },

      // API 服务不可用
      apiUnavailable: () => {
        claudeApiServer.stop();
      },

      // 速率限制环境
      rateLimited: () => {
        claudeApiServer.enableRateLimit(10); // 10 requests per minute
      },
    },
  };
}

// 默认导出
export default createExternalApiMocks();