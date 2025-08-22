/**
 * API 响应测试数据工厂
 * 提供各种 API 响应场景的测试数据
 */

import { Provider } from '@/types';

/**
 * HTTP 状态码枚举
 */
export enum HttpStatus {
  OK = 200,
  CREATED = 201,
  BAD_REQUEST = 400,
  UNAUTHORIZED = 401,
  FORBIDDEN = 403,
  NOT_FOUND = 404,
  TOO_MANY_REQUESTS = 429,
  INTERNAL_SERVER_ERROR = 500,
  BAD_GATEWAY = 502,
  SERVICE_UNAVAILABLE = 503,
  GATEWAY_TIMEOUT = 504,
}

/**
 * API 响应基础接口
 */
export interface ApiResponse<T = any> {
  status: HttpStatus;
  data?: T;
  error?: {
    message: string;
    code?: string;
    details?: any;
  };
  headers?: Record<string, string>;
  timestamp?: string;
}

/**
 * 创建成功响应
 */
export function createSuccessResponse<T>(data: T, status: HttpStatus = HttpStatus.OK): ApiResponse<T> {
  return {
    status,
    data,
    headers: {
      'Content-Type': 'application/json',
      'X-Request-ID': `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    },
    timestamp: new Date().toISOString(),
  };
}

/**
 * 创建错误响应
 */
export function createErrorResponse(
  message: string,
  status: HttpStatus = HttpStatus.INTERNAL_SERVER_ERROR,
  code?: string,
  details?: any
): ApiResponse {
  return {
    status,
    error: {
      message,
      code,
      details,
    },
    headers: {
      'Content-Type': 'application/json',
      'X-Request-ID': `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    },
    timestamp: new Date().toISOString(),
  };
}

/**
 * 创建 Provider 验证成功响应
 */
export function createValidationSuccessResponse(provider: Provider): ApiResponse<{
  isValid: boolean;
  providerId: string;
  connectionStatus: string;
  authStatus: string;
  modelStatus: string;
  latency: number;
  testedAt: string;
}> {
  return createSuccessResponse({
    isValid: true,
    providerId: provider.id,
    connectionStatus: 'success',
    authStatus: 'success',
    modelStatus: 'available',
    latency: Math.floor(Math.random() * 500) + 100, // 100-600ms
    testedAt: new Date().toISOString(),
  });
}

/**
 * 创建 Provider 验证失败响应
 */
export function createValidationErrorResponse(
  provider: Provider,
  errorType: 'connection' | 'auth' | 'model' | 'timeout' = 'connection'
): ApiResponse<{
  isValid: boolean;
  providerId: string;
  connectionStatus: string;
  authStatus: string;
  modelStatus: string;
  errors: string[];
  testedAt: string;
}> {
  const errors: string[] = [];
  let connectionStatus = 'success';
  let authStatus = 'success';
  let modelStatus = 'available';
  
  switch (errorType) {
    case 'connection':
      connectionStatus = 'failed';
      errors.push('Failed to connect to the API endpoint');
      break;
    case 'auth':
      authStatus = 'failed';
      errors.push('Authentication failed - invalid API key');
      break;
    case 'model':
      modelStatus = 'unavailable';
      errors.push('Specified model is not available');
      break;
    case 'timeout':
      connectionStatus = 'timeout';
      errors.push('Request timed out');
      break;
  }
  
  return createSuccessResponse({
    isValid: false,
    providerId: provider.id,
    connectionStatus,
    authStatus,
    modelStatus,
    errors,
    testedAt: new Date().toISOString(),
  });
}

/**
 * 创建超时响应
 */
export function createTimeoutResponse(): Promise<never> {
  return new Promise((_, reject) => {
    setTimeout(() => {
      reject(new Error('Request timeout'));
    }, 5000);
  });
}

/**
 * 创建速率限制响应
 */
export function createRateLimitResponse(): ApiResponse {
  return createErrorResponse(
    'Too many requests',
    HttpStatus.TOO_MANY_REQUESTS,
    'RATE_LIMIT_EXCEEDED',
    {
      resetTime: new Date(Date.now() + 60000).toISOString(), // 1分钟后重置
      limit: 100,
      remaining: 0,
    }
  );
}

/**
 * 创建网络错误响应集合
 */
export function createNetworkErrorResponses(): {
  timeout: () => Promise<never>;
  connectionRefused: ApiResponse;
  dnsError: ApiResponse;
  sslError: ApiResponse;
  serverError: ApiResponse;
} {
  return {
    timeout: createTimeoutResponse,
    
    connectionRefused: createErrorResponse(
      'Connection refused',
      HttpStatus.BAD_GATEWAY,
      'CONNECTION_REFUSED'
    ),
    
    dnsError: createErrorResponse(
      'DNS resolution failed',
      HttpStatus.BAD_GATEWAY,
      'DNS_ERROR'
    ),
    
    sslError: createErrorResponse(
      'SSL certificate verification failed',
      HttpStatus.BAD_GATEWAY,
      'SSL_ERROR'
    ),
    
    serverError: createErrorResponse(
      'Internal server error',
      HttpStatus.INTERNAL_SERVER_ERROR,
      'INTERNAL_ERROR'
    ),
  };
}

/**
 * 创建 Claude API 特定响应
 */
export function createClaudeApiResponses(): {
  modelList: ApiResponse<{ models: Array<{ id: string; name: string; maxTokens: number }> }>;
  chatCompletion: ApiResponse<{ response: string; usage: { tokens: number } }>;
  invalidModel: ApiResponse;
  quotaExceeded: ApiResponse;
} {
  return {
    modelList: createSuccessResponse({
      models: [
        { id: 'claude-3-sonnet-20240229', name: 'Claude 3 Sonnet', maxTokens: 200000 },
        { id: 'claude-3-haiku-20240307', name: 'Claude 3 Haiku', maxTokens: 200000 },
        { id: 'claude-3-opus-20240229', name: 'Claude 3 Opus', maxTokens: 200000 },
      ],
    }),
    
    chatCompletion: createSuccessResponse({
      response: 'This is a test response from Claude.',
      usage: { tokens: 25 },
    }),
    
    invalidModel: createErrorResponse(
      'The model specified does not exist',
      HttpStatus.BAD_REQUEST,
      'INVALID_MODEL'
    ),
    
    quotaExceeded: createErrorResponse(
      'You have exceeded your API quota',
      HttpStatus.TOO_MANY_REQUESTS,
      'QUOTA_EXCEEDED',
      {
        quotaResetDate: new Date(Date.now() + 86400000).toISOString(), // 明天重置
      }
    ),
  };
}

/**
 * 创建慢响应 (用于性能测试)
 */
export function createSlowResponse<T>(data: T, delayMs: number = 2000): Promise<ApiResponse<T>> {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve(createSuccessResponse(data));
    }, delayMs);
  });
}

/**
 * 创建间歇性错误响应 (用于重试机制测试)
 */
export function createIntermittentErrorResponse<T>(
  successData: T,
  failureRate: number = 0.3 // 30% 失败率
): ApiResponse<T> | ApiResponse {
  if (Math.random() < failureRate) {
    return createErrorResponse(
      'Intermittent server error',
      HttpStatus.INTERNAL_SERVER_ERROR,
      'INTERMITTENT_ERROR'
    );
  }
  return createSuccessResponse(successData);
}

/**
 * 创建分页响应
 */
export function createPaginatedResponse<T>(
  items: T[],
  page: number = 1,
  pageSize: number = 10
): ApiResponse<{
  items: T[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}> {
  const startIndex = (page - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedItems = items.slice(startIndex, endIndex);
  const totalPages = Math.ceil(items.length / pageSize);
  
  return createSuccessResponse({
    items: paginatedItems,
    pagination: {
      page,
      pageSize,
      total: items.length,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    },
  });
}

/**
 * 创建 WebSocket 消息数据
 */
export function createWebSocketMessages(): {
  connected: any;
  disconnected: any;
  validationProgress: any;
  validationComplete: any;
  error: any;
} {
  return {
    connected: {
      type: 'connected',
      timestamp: new Date().toISOString(),
    },
    
    disconnected: {
      type: 'disconnected',
      reason: 'Connection closed by client',
      timestamp: new Date().toISOString(),
    },
    
    validationProgress: {
      type: 'validation_progress',
      providerId: 'test-provider',
      step: 'authenticating',
      progress: 50,
      timestamp: new Date().toISOString(),
    },
    
    validationComplete: {
      type: 'validation_complete',
      providerId: 'test-provider',
      result: 'success',
      timestamp: new Date().toISOString(),
    },
    
    error: {
      type: 'error',
      message: 'WebSocket error occurred',
      code: 'WS_ERROR',
      timestamp: new Date().toISOString(),
    },
  };
}