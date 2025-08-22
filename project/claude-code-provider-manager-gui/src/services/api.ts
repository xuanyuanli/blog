import { invoke } from '@tauri-apps/api/tauri';
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

class ApiService {
  // 配置管理
  async loadConfig(): Promise<Configuration> {
    return invoke('load_config');
  }

  async saveConfig(): Promise<void> {
    return invoke('save_config');
  }

  async exportConfig(includeTokens: boolean = false): Promise<string> {
    return invoke('export_config', { includeTokens });
  }

  async importConfig(configJson: string, merge: boolean = false): Promise<Configuration> {
    return invoke('import_config', { configJson, merge });
  }

  async updateSettings(settings: AppSettings): Promise<void> {
    // 验证设置对象
    this.validateSettingsInput(settings);
    return invoke('update_settings', { settings });
  }

  async cleanupOldBackups(): Promise<string[]> {
    return invoke('cleanup_old_backups');
  }

  // 提供商管理
  async getProviders(): Promise<Provider[]> {
    return invoke('get_providers');
  }

  async getProviderById(id: string): Promise<Provider | null> {
    return invoke('get_provider_by_id', { id });
  }

  async getActiveProvider(): Promise<Provider | null> {
    return invoke('get_active_provider');
  }

  async addProvider(request: CreateProviderRequest): Promise<Provider> {
    // 输入验证
    this.validateProviderInput(request);
    return invoke('add_provider', { request });
  }

  async updateProvider(id: string, request: UpdateProviderRequest): Promise<Provider> {
    return invoke('update_provider', { id, request });
  }

  async deleteProvider(id: string): Promise<void> {
    return invoke('delete_provider', { id });
  }

  async switchProvider(id: string): Promise<Provider> {
    return invoke('switch_provider', { id });
  }

  // 环境管理
  async switchEnvironment(providerId: string): Promise<void> {
    return invoke('switch_environment', { providerId });
  }

  async getCurrentEnvironment(): Promise<EnvironmentInfo> {
    return invoke('get_current_environment');
  }

  async clearEnvironment(): Promise<void> {
    return invoke('clear_environment');
  }

  async getAllEnvVars(): Promise<Record<string, string>> {
    return invoke('get_all_env_vars');
  }

  // 验证
  async validateProviderConnection(baseUrl: string, authToken: string): Promise<ConnectionTest> {
    return invoke('validate_provider_connection', { baseUrl, authToken });
  }

  async validateProviderFull(
    providerId: string,
    baseUrl: string,
    authToken: string,
    model: string
  ): Promise<ValidationResult> {
    return invoke('validate_provider_full', { providerId, baseUrl, authToken, model });
  }

  async validateUrlFormat(url: string): Promise<void> {
    // 客户端验证
    if (!url || typeof url !== 'string') {
      throw new Error('Invalid URL format: URL must be a non-empty string');
    }

    // 检查长度限制
    if (url.length > 2048) {
      throw new Error('Invalid URL format: URL too long');
    }

    // 首先检查危险协议和恶意模式
    const protocolPatterns = [
      /^(file|ftp|data|javascript|vbscript):/i,  // 危险协议
    ];
    
    if (protocolPatterns.some(pattern => pattern.test(url))) {
      throw new Error('Invalid URL: Dangerous protocol detected');
    }

    // 检查其他恶意URL模式
    const maliciousPatterns = [
      /localhost|127\.0\.0\.1|0\.0\.0\.0/i,  // 本地地址
      /192\.168\./,  // 私有网段
      /10\./,        // 私有网段
      /172\.(1[6-9]|2[0-9]|3[01])\./,  // 私有网段
      /169\.254\./,  // 链路本地地址
      /\.\./,  // 路径遍历
      /[<>'"]/,  // 可能的注入字符
      /<script/i,    // Script标签
      /onload=/i,    // 事件处理器
      /onerror=/i,   // 事件处理器
      /0x[0-9a-f]+/i, // 十六进制IP
      /^\d{8,10}$/,   // 十进制IP (approximate)
      /[\x00-\x1f\x7f]/,  // 控制字符
    ];
    
    if (maliciousPatterns.some(pattern => pattern.test(url))) {
      throw new Error('Invalid URL: Contains malicious patterns');
    }

    // 尝试解析URL以检查结构
    try {
      const parsedUrl = new URL(url);
      
      // 检查空主机名等无效结构
      if (!parsedUrl.hostname || parsedUrl.hostname === '.' || 
          parsedUrl.hostname.startsWith('.') || parsedUrl.hostname.endsWith('.') ||
          parsedUrl.hostname.includes('..')) {
        throw new Error('Invalid URL format: Invalid hostname structure');
      }
    } catch (urlError) {
      throw new Error('Invalid URL format: Malformed URL structure');
    }

    // 最后检查协议要求
    if (!url.startsWith('https://')) {
      // 如果不是HTTPS，检查是否是HTTP（用于开发）
      if (!url.startsWith('http://')) {
        throw new Error('Invalid URL format: Invalid protocol');
      }
      // 在生产环境中要求HTTPS
      throw new Error('HTTPS required for production use');
    }

    return invoke('validate_url_format', { url });
  }

  async validateAuthTokenFormat(token: string): Promise<void> {
    // 客户端验证
    if (!token || typeof token !== 'string') {
      throw new Error('Invalid token format: Token must be a non-empty string');
    }

    // 检查最小长度
    if (token.length < 8) {
      throw new Error('Invalid token format: Token too short');
    }

    // 检查恶意token模式
    const maliciousPatterns = [
      /<script[^>]*>/i,   // Script标签
      /javascript:/i,     // JavaScript协议
      /[<>'"&]/,          // XSS字符
      /\.\.\//,           // 路径遍历
      /\0/,               // null字节
      /.{1000,}/,         // 超长token
      /eval\s*\(/i,       // eval调用
      /process\s*\./i,    // process调用
      /\$\{.*\}/,         // 模板注入
      /jndi:/i,           // JNDI注入
      /ldap:/i,           // LDAP注入
      /data:/i,           // data URI
      /[\x00-\x1f\x7f-\x9f]/, // 控制字符
    ];

    if (maliciousPatterns.some(pattern => pattern.test(token))) {
      throw new Error('Invalid token format: Contains malicious patterns');
    }

    return invoke('validate_auth_token_format', { token });
  }

  async validateModelName(model: string): Promise<void> {
    if (!model || typeof model !== 'string') {
      throw new Error('Invalid model name: Model must be a non-empty string');
    }

    if (model.length > 100) {
      throw new Error('Invalid model name: Too long');
    }

    // 模型白名单验证
    const allowedModels = [
      'claude-3-opus-20240229',
      'claude-3-sonnet-20240229',
      'claude-3-haiku-20240307',
      'claude-3-5-sonnet-20241022',
      'claude-3-5-haiku-20241022',
      'gpt-4',
      'gpt-4-turbo',
      'gpt-3.5-turbo',
    ];

    if (!allowedModels.some(allowed => model.includes(allowed.split('-')[0]))) {
      throw new Error('Invalid model name: Model not in whitelist');
    }

    return invoke('validate_model_name', { model });
  }

  // 启动器
  async launchClaudeCode(config: LaunchConfig): Promise<ProcessInfo> {
    return invoke('launch_claude_code', { config });
  }

  async getProcessStatus(sessionId: string): Promise<ProcessStatus> {
    return invoke('get_process_status', { sessionId });
  }

  async terminateProcess(sessionId: string): Promise<void> {
    return invoke('terminate_process', { sessionId });
  }

  async listActiveProcesses(): Promise<string[]> {
    return invoke('list_active_processes');
  }

  async cleanupFinishedProcesses(): Promise<string[]> {
    return invoke('cleanup_finished_processes');
  }

  async getSystemInfo(): Promise<Record<string, string>> {
    return invoke('get_system_info');
  }

  async openFileManager(path?: string): Promise<void> {
    return invoke('open_file_manager', { path });
  }

  async openUrl(url: string): Promise<void> {
    return invoke('open_url', { url });
  }

  // 私有验证方法
  private validateProviderInput(request: CreateProviderRequest | UpdateProviderRequest): void {
    // 检查必需字段
    if (!request.name || typeof request.name !== 'string') {
      throw new Error('Invalid input: Provider name is required');
    }

    if (!request.baseUrl || typeof request.baseUrl !== 'string') {
      throw new Error('Invalid input: Provider URL is required');
    }

    // 检查字段长度
    const fieldLimits = {
      name: 100,
      baseUrl: 500,
      authToken: 1000,
      model: 100,
      description: 2000,
    };

    for (const [field, limit] of Object.entries(fieldLimits)) {
      const value = (request as any)[field];
      if (value && typeof value === 'string' && value.length > limit) {
        throw new Error(`Invalid input: ${field} field too long`);
      }
    }

    // 检查XSS和注入攻击
    const dangerousPatterns = [
      /<script[^>]*>/i,
      /javascript:/i,
      /onload\s*=/i,
      /onerror\s*=/i,
      /onclick\s*=/i,
      /<iframe[^>]*>/i,
      /<object[^>]*>/i,
      /<embed[^>]*>/i,
    ];

    const fieldsToCheck = [request.name, request.baseUrl, request.model, request.description];
    
    for (const field of fieldsToCheck) {
      if (field && typeof field === 'string') {
        if (dangerousPatterns.some(pattern => pattern.test(field))) {
          throw new Error('Invalid input detected: Potentially malicious content');
        }
      }
    }

    // 检查循环引用
    try {
      JSON.stringify(request);
    } catch (error) {
      if (error instanceof TypeError && error.message.includes('circular')) {
        throw new Error('Circular reference detected: Invalid data structure');
      }
      throw error;
    }
  }

  private validateSettingsInput(settings: any): void {
    if (!settings || typeof settings !== 'object') {
      throw new Error('Invalid configuration: Settings must be an object');
    }

    // 检查是否有潜在的原型污染
    if ('__proto__' in settings || 'constructor' in settings || 'prototype' in settings) {
      throw new Error('Invalid configuration: Prototype pollution detected');
    }

    // 检查恶意设置
    const settingsStr = JSON.stringify(settings);
    const maliciousPatterns = [
      /eval\s*\(/i,
      /Function\s*\(/i,
      /require\s*\(/i,
      /import\s*\(/i,
      /<script/i,
      /javascript:/i,
    ];

    if (maliciousPatterns.some(pattern => pattern.test(settingsStr))) {
      throw new Error('Invalid configuration: Malicious content detected');
    }
  }

  // 限流状态
  private rateLimitMap = new Map<string, { count: number; resetTime: number }>();
  private readonly RATE_LIMIT_COUNT = 10; // 每分钟最多10次请求
  private readonly RATE_LIMIT_WINDOW = 60000; // 1分钟窗口

  private checkRateLimit(key: string): void {
    const now = Date.now();
    const entry = this.rateLimitMap.get(key);

    if (!entry || now > entry.resetTime) {
      // 重置计数器
      this.rateLimitMap.set(key, { count: 1, resetTime: now + this.RATE_LIMIT_WINDOW });
      return;
    }

    if (entry.count >= this.RATE_LIMIT_COUNT) {
      throw new Error('Rate limit exceeded: Too many requests');
    }

    entry.count++;
  }

  // 重写验证方法以包含限流
  async validateProviderConnection(baseUrl: string, authToken: string): Promise<ConnectionTest> {
    this.checkRateLimit(`validate:${baseUrl}`);
    return invoke('validate_provider_connection', { baseUrl, authToken });
  }

  async validateProviderFull(
    providerId: string,
    baseUrl: string,
    authToken: string,
    model: string
  ): Promise<ValidationResult> {
    this.checkRateLimit(`validate-full:${providerId}`);
    return invoke('validate_provider_full', { providerId, baseUrl, authToken, model });
  }
}

export const api = new ApiService();
export default api;