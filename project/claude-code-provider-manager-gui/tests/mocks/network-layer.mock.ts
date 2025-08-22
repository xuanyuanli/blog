/**
 * 网络层 Mock
 * 模拟 HTTP 客户端、WebSocket 连接等网络相关功能
 */

import { 
  ApiResponse, 
  createSuccessResponse, 
  createErrorResponse,
  createTimeoutResponse,
  HttpStatus 
} from '@/fixtures/api-responses.factory';

/**
 * HTTP 客户端 Mock
 */
export class MockHttpClient {
  private responses: Map<string, ApiResponse | (() => Promise<ApiResponse>)> = new Map();
  private requestHistory: Array<{ url: string; method: string; data?: any; timestamp: number }> = [];
  private networkDelay = 0;
  private failureRate = 0;

  /**
   * 设置模拟响应
   */
  setResponse(url: string, response: ApiResponse | (() => Promise<ApiResponse>)) {
    this.responses.set(url, response);
  }

  /**
   * 设置网络延迟
   */
  setNetworkDelay(delayMs: number) {
    this.networkDelay = delayMs;
  }

  /**
   * 设置随机失败率
   */
  setFailureRate(rate: number) {
    this.failureRate = Math.max(0, Math.min(1, rate));
  }

  /**
   * 模拟 GET 请求
   */
  async get(url: string): Promise<ApiResponse> {
    return this.makeRequest('GET', url);
  }

  /**
   * 模拟 POST 请求
   */
  async post(url: string, data?: any): Promise<ApiResponse> {
    return this.makeRequest('POST', url, data);
  }

  /**
   * 模拟 PUT 请求
   */
  async put(url: string, data?: any): Promise<ApiResponse> {
    return this.makeRequest('PUT', url, data);
  }

  /**
   * 模拟 DELETE 请求
   */
  async delete(url: string): Promise<ApiResponse> {
    return this.makeRequest('DELETE', url);
  }

  /**
   * 执行请求
   */
  private async makeRequest(method: string, url: string, data?: any): Promise<ApiResponse> {
    // 记录请求历史
    this.requestHistory.push({
      url,
      method,
      data,
      timestamp: Date.now(),
    });

    // 模拟网络延迟
    if (this.networkDelay > 0) {
      await new Promise(resolve => setTimeout(resolve, this.networkDelay));
    }

    // 模拟随机失败
    if (Math.random() < this.failureRate) {
      throw new Error('Network request failed (simulated)');
    }

    // 获取预设响应
    const response = this.responses.get(url) || this.responses.get('*');
    
    if (!response) {
      return createErrorResponse('Not Found', HttpStatus.NOT_FOUND);
    }

    if (typeof response === 'function') {
      return await response();
    }

    return response;
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
  clearRequestHistory() {
    this.requestHistory = [];
  }

  /**
   * 重置所有设置
   */
  reset() {
    this.responses.clear();
    this.requestHistory = [];
    this.networkDelay = 0;
    this.failureRate = 0;
  }
}

/**
 * WebSocket 连接 Mock
 */
export class MockWebSocket {
  public static CONNECTING = 0;
  public static OPEN = 1;
  public static CLOSING = 2;
  public static CLOSED = 3;

  public readyState = MockWebSocket.CONNECTING;
  public url: string;
  
  private eventListeners: Map<string, Function[]> = new Map();
  private messageQueue: any[] = [];
  private connectDelay = 100;

  constructor(url: string) {
    this.url = url;
    
    // 模拟连接过程
    setTimeout(() => {
      this.readyState = MockWebSocket.OPEN;
      this.dispatchEvent('open', {});
    }, this.connectDelay);
  }

  /**
   * 发送消息
   */
  send(data: string | ArrayBuffer | Blob) {
    if (this.readyState !== MockWebSocket.OPEN) {
      throw new Error('WebSocket is not open');
    }
    
    this.messageQueue.push({
      data,
      timestamp: Date.now(),
    });
  }

  /**
   * 关闭连接
   */
  close(code?: number, reason?: string) {
    this.readyState = MockWebSocket.CLOSING;
    setTimeout(() => {
      this.readyState = MockWebSocket.CLOSED;
      this.dispatchEvent('close', { code, reason });
    }, 50);
  }

  /**
   * 添加事件监听器
   */
  addEventListener(type: string, listener: Function) {
    if (!this.eventListeners.has(type)) {
      this.eventListeners.set(type, []);
    }
    this.eventListeners.get(type)!.push(listener);
  }

  /**
   * 移除事件监听器
   */
  removeEventListener(type: string, listener: Function) {
    const listeners = this.eventListeners.get(type);
    if (listeners) {
      const index = listeners.indexOf(listener);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  /**
   * 触发事件
   */
  private dispatchEvent(type: string, data: any) {
    const listeners = this.eventListeners.get(type);
    if (listeners) {
      listeners.forEach(listener => listener(data));
    }
  }

  /**
   * 模拟接收消息
   */
  simulateMessage(data: any) {
    if (this.readyState === MockWebSocket.OPEN) {
      this.dispatchEvent('message', { data: JSON.stringify(data) });
    }
  }

  /**
   * 模拟连接错误
   */
  simulateError(error: Error) {
    this.dispatchEvent('error', error);
  }

  /**
   * 获取发送的消息历史
   */
  getMessageHistory() {
    return [...this.messageQueue];
  }

  /**
   * 设置连接延迟
   */
  setConnectDelay(delayMs: number) {
    this.connectDelay = delayMs;
  }
}

/**
 * 网络状态 Mock
 */
export class MockNetworkStatus {
  private isOnline = true;
  private connectionType = 'wifi';
  private bandwidth = 10; // Mbps
  private latency = 50; // ms

  /**
   * 设置在线状态
   */
  setOnline(online: boolean) {
    this.isOnline = online;
  }

  /**
   * 设置连接类型
   */
  setConnectionType(type: 'wifi' | 'cellular' | 'ethernet' | 'none') {
    this.connectionType = type;
  }

  /**
   * 设置带宽
   */
  setBandwidth(mbps: number) {
    this.bandwidth = mbps;
  }

  /**
   * 设置延迟
   */
  setLatency(ms: number) {
    this.latency = ms;
  }

  /**
   * 获取网络状态
   */
  getStatus() {
    return {
      isOnline: this.isOnline,
      connectionType: this.connectionType,
      bandwidth: this.bandwidth,
      latency: this.latency,
    };
  }

  /**
   * 模拟网络波动
   */
  simulateNetworkFluctuation() {
    // 随机调整带宽和延迟
    this.bandwidth *= (0.5 + Math.random());
    this.latency *= (0.5 + Math.random() * 1.5);
  }

  /**
   * 模拟网络断开
   */
  simulateDisconnect() {
    this.isOnline = false;
    this.connectionType = 'none';
  }

  /**
   * 模拟网络重连
   */
  simulateReconnect() {
    this.isOnline = true;
    this.connectionType = 'wifi';
  }
}

/**
 * 创建网络层 Mock 工厂
 */
export function createNetworkMocks() {
  const httpClient = new MockHttpClient();
  const networkStatus = new MockNetworkStatus();

  return {
    httpClient,
    networkStatus,
    
    // WebSocket 工厂函数
    createWebSocket: (url: string) => new MockWebSocket(url),
    
    // 重置所有 Mock
    reset: () => {
      httpClient.reset();
      networkStatus.setOnline(true);
      networkStatus.setConnectionType('wifi');
      networkStatus.setBandwidth(10);
      networkStatus.setLatency(50);
    },

    // 预设场景
    scenarios: {
      // 正常网络环境
      normal: () => {
        httpClient.setNetworkDelay(100);
        httpClient.setFailureRate(0);
        networkStatus.setOnline(true);
      },

      // 慢速网络
      slow: () => {
        httpClient.setNetworkDelay(2000);
        httpClient.setFailureRate(0.1);
        networkStatus.setBandwidth(1);
        networkStatus.setLatency(500);
      },

      // 不稳定网络
      unstable: () => {
        httpClient.setNetworkDelay(500);
        httpClient.setFailureRate(0.3);
        networkStatus.setBandwidth(5);
        networkStatus.setLatency(200);
      },

      // 离线状态
      offline: () => {
        httpClient.setFailureRate(1);
        networkStatus.setOnline(false);
      },
    },
  };
}

// 默认导出
export default createNetworkMocks();