import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { configManager } from '../config/ConfigManager';

// API 响应接口
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// 验证结果接口
export interface ValidationResult {
  providerId: string;
  isValid: boolean;
  connectionStatus: 'success' | 'failed' | 'timeout';
  authStatus: 'success' | 'failed' | 'unauthorized';
  modelStatus: 'available' | 'unavailable' | 'unknown';
  errors: string[];
  warnings: string[];
  latency: number;
  testedAt: string;
}

// 网络状态接口
export interface NetworkStatus {
  online: boolean;
  latency: number;
  proxyEnabled: boolean;
  proxyStatus?: string;
}

// 启动配置接口
export interface LaunchConfig {
  sessionId: string;
  workingDirectory?: string;
  args: string[];
  envVars: Record<string, string>;
}

// 启动结果接口
export interface LaunchResult {
  success: boolean;
  processId?: number;
  sessionId: string;
  error?: string;
  message?: string;
}

// API 服务类
export class ApiService {
  private axiosInstance: AxiosInstance;
  private config = configManager.getConfig();

  constructor() {
    this.axiosInstance = this.createAxiosInstance();
  }

  private createAxiosInstance(): AxiosInstance {
    const instance = axios.create({
      timeout: this.config.advanced.networkSettings.timeout,
      maxRedirects: 5,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Claude-Code-Provider-Manager/1.0.0',
      },
    });

    // 请求拦截器
    instance.interceptors.request.use(
      (config) => {
        console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      (error) => {
        console.error('API Request Error:', error);
        return Promise.reject(error);
      }
    );

    // 响应拦截器
    instance.interceptors.response.use(
      (response) => {
        console.log(`API Response: ${response.status} ${response.config.url}`);
        return response;
      },
      (error) => {
        console.error('API Response Error:', error);
        return Promise.reject(error);
      }
    );

    return instance;
  }

  // 提供商管理 API
  async getProviders(): Promise<any[]> {
    try {
      const config = configManager.getConfig();
      return config.providers;
    } catch (error) {
      console.error('Failed to get providers:', error);
      throw error;
    }
  }

  async getActiveProvider(): Promise<any | null> {
    try {
      const config = configManager.getConfig();
      return config.providers.find(p => p.isActive) || null;
    } catch (error) {
      console.error('Failed to get active provider:', error);
      throw error;
    }
  }

  async addProvider(providerData: any): Promise<any> {
    try {
      const newProvider = await configManager.addProvider(providerData);
      return newProvider;
    } catch (error) {
      console.error('Failed to add provider:', error);
      throw error;
    }
  }

  async updateProvider(id: string, updates: any): Promise<any> {
    try {
      await configManager.updateProvider(id, updates);
      const updatedProvider = await configManager.getProvider(id);
      return updatedProvider;
    } catch (error) {
      console.error('Failed to update provider:', error);
      throw error;
    }
  }

  async deleteProvider(id: string): Promise<void> {
    try {
      await configManager.deleteProvider(id);
    } catch (error) {
      console.error('Failed to delete provider:', error);
      throw error;
    }
  }

  async switchProvider(id: string): Promise<any> {
    try {
      await configManager.setActiveProvider(id);
      const activeProvider = await configManager.getActiveProvider();
      return activeProvider;
    } catch (error) {
      console.error('Failed to switch provider:', error);
      throw error;
    }
  }

  // 验证 API
  async validateProvider(baseUrl: string, authToken: string, model: string): Promise<ValidationResult> {
    try {
      const startTime = Date.now();
      
      // 测试连接
      const connectionTest = await this.testConnection(baseUrl);
      
      // 测试认证
      const authTest = await this.testAuthentication(baseUrl, authToken);
      
      // 测试模型可用性
      const modelTest = await this.testModelAvailability(baseUrl, authToken, model);
      
      const latency = Date.now() - startTime;
      
      return {
        providerId: 'temp',
        isValid: connectionTest.success && authTest.success && modelTest.success,
        connectionStatus: connectionTest.success ? 'success' : 'failed',
        authStatus: authTest.success ? 'success' : 'failed',
        modelStatus: modelTest.success ? 'available' : 'unavailable',
        errors: [
          ...connectionTest.errors,
          ...authTest.errors,
          ...modelTest.errors,
        ],
        warnings: [
          ...connectionTest.warnings,
          ...authTest.warnings,
          ...modelTest.warnings,
        ],
        latency,
        testedAt: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Failed to validate provider:', error);
      return {
        providerId: 'temp',
        isValid: false,
        connectionStatus: 'failed',
        authStatus: 'failed',
        modelStatus: 'unknown',
        errors: [error instanceof Error ? error.message : 'Unknown error'],
        warnings: [],
        latency: 0,
        testedAt: new Date().toISOString(),
      };
    }
  }

  async validateProviderFull(providerId: string, baseUrl: string, authToken: string, model: string): Promise<ValidationResult> {
    return await this.validateProvider(baseUrl, authToken, model);
  }

  // 连接测试
  async testConnection(url: string): Promise<ApiResponse> {
    try {
      const response = await this.axiosInstance.get(url, {
        timeout: 10000,
        validateStatus: (status) => status < 500,
      });

      return {
        success: response.status < 400,
        data: response.data,
        message: `Connection successful (${response.status})`,
        errors: response.status >= 400 ? [`HTTP ${response.status}`] : [],
        warnings: [],
      };
    } catch (error) {
      console.error('Connection test failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Connection failed',
        errors: [error instanceof Error ? error.message : 'Connection failed'],
        warnings: [],
      };
    }
  }

  // 认证测试
  private async testAuthentication(baseUrl: string, authToken: string): Promise<ApiResponse> {
    try {
      const response = await this.axiosInstance.post(
        `${baseUrl}/v1/messages`,
        {
          model: 'claude-3-haiku-20240307',
          max_tokens: 10,
          messages: [{ role: 'user', content: 'test' }],
        },
        {
          headers: {
            'x-api-key': authToken,
            'anthropic-version': '2023-06-01',
          },
          timeout: 15000,
        }
      );

      return {
        success: response.status < 400,
        data: response.data,
        message: 'Authentication successful',
        errors: response.status >= 400 ? [`Auth failed: ${response.status}`] : [],
        warnings: [],
      };
    } catch (error) {
      console.error('Authentication test failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Authentication failed',
        errors: [error instanceof Error ? error.message : 'Authentication failed'],
        warnings: [],
      };
    }
  }

  // 模型可用性测试
  private async testModelAvailability(baseUrl: string, authToken: string, model: string): Promise<ApiResponse> {
    try {
      const response = await this.axiosInstance.post(
        `${baseUrl}/v1/messages`,
        {
          model,
          max_tokens: 5,
          messages: [{ role: 'user', content: 'Hi' }],
        },
        {
          headers: {
            'x-api-key': authToken,
            'anthropic-version': '2023-06-01',
          },
          timeout: 20000,
        }
      );

      return {
        success: response.status < 400,
        data: response.data,
        message: `Model ${model} is available`,
        errors: response.status >= 400 ? [`Model ${model} unavailable: ${response.status}`] : [],
        warnings: [],
      };
    } catch (error) {
      console.error('Model availability test failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Model unavailable',
        errors: [error instanceof Error ? error.message : 'Model unavailable'],
        warnings: [],
      };
    }
  }

  // 启动 Claude Code
  async launchClaudeCode(config: LaunchConfig): Promise<LaunchResult> {
    try {
      const { spawn } = require('child_process');
      const configData = configManager.getConfig();
      
      // 构建启动命令
      const command = this.getLaunchCommand();
      const args = this.getLaunchArgs(config);
      
      // 设置环境变量
      const env = {
        ...process.env,
        ...config.envVars,
        ...configData.advanced.customEnvironment,
      };

      console.log('Launching Claude Code with:', { command, args, env });

      // 启动进程
      const childProcess = spawn(command, args, {
        env,
        cwd: config.workingDirectory || process.cwd(),
        detached: true,
        stdio: 'ignore',
      });

      childProcess.unref();

      return {
        success: true,
        processId: childProcess.pid,
        sessionId: config.sessionId,
        message: 'Claude Code launched successfully',
      };
    } catch (error) {
      console.error('Failed to launch Claude Code:', error);
      return {
        success: false,
        sessionId: config.sessionId,
        error: error instanceof Error ? error.message : 'Launch failed',
        message: 'Failed to launch Claude Code',
      };
    }
  }

  private getLaunchCommand(): string {
    const platform = process.platform;
    
    if (platform === 'win32') {
      return 'claude.exe';
    } else if (platform === 'darwin') {
      return 'claude';
    } else {
      return 'claude';
    }
  }

  private getLaunchArgs(config: LaunchConfig): string[] {
    const args = [...config.args];
    
    // 添加会话ID
    args.push('--session-id', config.sessionId);
    
    // 添加工作目录
    if (config.workingDirectory) {
      args.push('--working-dir', config.workingDirectory);
    }
    
    return args;
  }

  // 网络状态
  async getNetworkStatus(): Promise<NetworkStatus> {
    try {
      const config = configManager.getConfig();
      
      // 测试基本连接
      const startTime = Date.now();
      await this.testConnection('https://api.anthropic.com');
      const latency = Date.now() - startTime;
      
      return {
        online: true,
        latency,
        proxyEnabled: config.advanced.networkSettings.proxyEnabled,
        proxyStatus: config.advanced.networkSettings.proxyEnabled ? 'enabled' : 'disabled',
      };
    } catch (error) {
      return {
        online: false,
        latency: 0,
        proxyEnabled: false,
        proxyStatus: 'connection failed',
      };
    }
  }

  // 设置管理 API
  async updateSettings(settings: any): Promise<ApiResponse> {
    try {
      await configManager.updateSettings(settings);
      return {
        success: true,
        message: 'Settings updated successfully',
      };
    } catch (error) {
      console.error('Failed to update settings:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Update failed',
        errors: [error instanceof Error ? error.message : 'Update failed'],
      };
    }
  }

  // 重试机制
  private async withRetry<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    delay: number = 1000
  ): Promise<T> {
    const config = configManager.getConfig();
    const retryAttempts = config.advanced.networkSettings.retryAttempts;
    const retryDelay = config.advanced.networkSettings.retryDelay;
    
    for (let i = 0; i < retryAttempts; i++) {
      try {
        return await operation();
      } catch (error) {
        if (i === retryAttempts - 1) {
          throw error;
        }
        
        console.warn(`Attempt ${i + 1} failed, retrying in ${retryDelay}ms...`);
        await this.delay(retryDelay);
      }
    }
    
    throw new Error('Max retry attempts reached');
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // 更新配置
  updateConfig(): void {
    this.config = configManager.getConfig();
    this.axiosInstance = this.createAxiosInstance();
  }
}

// 导出单例实例
export const apiService = new ApiService();