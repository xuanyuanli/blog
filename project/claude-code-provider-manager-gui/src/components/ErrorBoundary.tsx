import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react';

// 错误边界 Props
interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode | ((error: Error, errorInfo: ErrorInfo) => ReactNode);
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  resetKeys?: string[];
  resetOnPropsChange?: boolean;
}

// 错误边界 State
interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

// 错误报告接口
export interface ErrorReport {
  error: Error;
  errorInfo: ErrorInfo;
  componentStack: string;
  timestamp: string;
  userAgent: string;
  url: string;
  lineNumber?: number;
  columnNumber?: number;
}

// 全局错误边界
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  private resetTimeout: number | null = null;

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.setState({
      error,
      errorInfo,
    });

    // 调用错误回调
    this.props.onError?.(error, errorInfo);

    // 生成错误报告
    const errorReport = this.generateErrorReport(error, errorInfo);
    
    // 发送错误报告
    this.sendErrorReport(errorReport);
    
    // 记录错误到控制台
    console.error('Error caught by boundary:', error, errorInfo);
  }

  componentDidUpdate(prevProps: ErrorBoundaryProps): void {
    const { resetKeys, resetOnPropsChange } = this.props;
    
    if (resetOnPropsChange && resetKeys) {
      const prevResetKey = this.generateResetKey(prevProps);
      const currentResetKey = this.generateResetKey(this.props);
      
      if (prevResetKey !== currentResetKey) {
        this.resetErrorBoundary();
      }
    }
  }

  componentWillUnmount(): void {
    if (this.resetTimeout) {
      clearTimeout(this.resetTimeout);
    }
  }

  private generateResetKey(props: ErrorBoundaryProps): string {
    return (props.resetKeys || []).map(key => {
      return (props as any)[key];
    }).join('|');
  }

  private generateErrorReport(error: Error, errorInfo: ErrorInfo): ErrorReport {
    return {
      error,
      errorInfo,
      componentStack: errorInfo.componentStack || '',
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      lineNumber: this.extractLineNumber(errorInfo.componentStack),
      columnNumber: this.extractColumnNumber(errorInfo.componentStack),
    };
  }

  private extractLineNumber(stack: string): number | undefined {
    const match = stack.match(/:(\d+):\d+/);
    return match ? parseInt(match[1], 10) : undefined;
  }

  private extractColumnNumber(stack: string): number | undefined {
    const match = stack.match(/:(\d+):(\d+)/);
    return match ? parseInt(match[2], 10) : undefined;
  }

  private async sendErrorReport(report: ErrorReport): Promise<void> {
    try {
      // 可以发送到错误监控服务
      console.log('Error report:', report);
      
      // 如果有 Sentry 或其他错误监控服务，可以在这里发送
      // Sentry.captureException(report.error);
      
      // 或者发送到自定义的错误处理端点
      // await fetch('/api/errors', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(report),
      // });
    } catch (e) {
      console.error('Failed to send error report:', e);
    }
  }

  private resetErrorBoundary = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  private handleRetry = (): void => {
    this.resetErrorBoundary();
  };

  private handleGoHome = (): void => {
    window.location.href = '/';
  };

  render(): ReactNode {
    if (this.state.hasError) {
      const { error, errorInfo } = this.state;
      
      // 如果提供了自定义 fallback，使用它
      if (this.props.fallback) {
        if (typeof this.props.fallback === 'function') {
          return this.props.fallback(error!, errorInfo!);
        }
        return this.props.fallback;
      }

      // 默认错误 UI
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-center w-12 h-12 bg-red-100 rounded-full mb-4">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
            
            <h1 className="text-xl font-semibold text-gray-900 mb-2">
              出现了一个错误
            </h1>
            
            <p className="text-gray-600 mb-4">
              应用遇到了一个意外错误。我们已经记录了这个问题，正在努力修复。
            </p>
            
            {process.env.NODE_ENV === 'development' && error && (
              <div className="mb-4 p-3 bg-gray-100 rounded-md">
                <h3 className="text-sm font-medium text-gray-900 mb-2 flex items-center">
                  <Bug className="w-4 h-4 mr-2" />
                  错误详情 (开发模式)
                </h3>
                <div className="text-xs text-gray-700 font-mono bg-gray-200 p-2 rounded overflow-x-auto">
                  <div className="mb-2">
                    <strong>Error:</strong> {error.message}
                  </div>
                  <div className="mb-2">
                    <strong>Stack:</strong>
                    <pre className="whitespace-pre-wrap">{error.stack}</pre>
                  </div>
                  {errorInfo && (
                    <div>
                      <strong>Component Stack:</strong>
                      <pre className="whitespace-pre-wrap">{errorInfo.componentStack}</pre>
                    </div>
                  )}
                </div>
              </div>
            )}
            
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={this.handleRetry}
                className="flex-1 flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                重试
              </button>
              
              <button
                onClick={this.handleGoHome}
                className="flex-1 flex items-center justify-center px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500"
              >
                <Home className="w-4 h-4 mr-2" />
                返回首页
              </button>
            </div>
            
            <div className="mt-4 text-xs text-gray-500 text-center">
              如果问题持续存在，请联系技术支持。
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// 异步错误边界 Hook
export function useAsyncError(): {
  error: Error | null;
  setError: (error: Error) => void;
  clearError: () => void;
} {
  const [error, setError] = React.useState<Error | null>(null);

  const clearError = React.useCallback(() => {
    setError(null);
  }, []);

  return { error, setError: setError, clearError };
}

// 异步错误包装器
export function withAsyncError<T extends any[]>(
  asyncFn: (...args: T) => Promise<any>,
  setError: (error: Error) => void
) {
  return async (...args: T) => {
    try {
      return await asyncFn(...args);
    } catch (error) {
      setError(error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  };
}

// 全局错误处理器
export class GlobalErrorHandler {
  private static instance: GlobalErrorHandler;
  private errorHandlers: ((error: ErrorEvent) => void)[] = [];
  private unhandledRejectionHandlers: ((event: PromiseRejectionEvent) => void)[] = [];

  private constructor() {
    this.setupGlobalHandlers();
  }

  static getInstance(): GlobalErrorHandler {
    if (!GlobalErrorHandler.instance) {
      GlobalErrorHandler.instance = new GlobalErrorHandler();
    }
    return GlobalErrorHandler.instance;
  }

  private setupGlobalHandlers(): void {
    // 全局 JavaScript 错误
    window.addEventListener('error', (event) => {
      this.handleError(event);
    });

    // 未处理的 Promise 拒绝
    window.addEventListener('unhandledrejection', (event) => {
      this.handleUnhandledRejection(event);
    });

    // 未捕获的异常
    window.addEventListener('uncaughtexception', (event) => {
      this.handleUncaughtException(event);
    });

    // 资源加载错误
    window.addEventListener('error', (event) => {
      if (event.target && ('src' in event.target || 'href' in event.target)) {
        this.handleResourceError(event);
      }
    }, true);
  }

  private handleError(event: ErrorEvent): void {
    console.error('Global error:', event.error);
    
    const errorReport = {
      error: event.error,
      message: event.message,
      filename: event.filename,
      lineNumber: event.lineno,
      columnNumber: event.colno,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
    };

    this.errorHandlers.forEach(handler => handler(event));
    this.sendErrorReport(errorReport);
  }

  private handleUnhandledRejection(event: PromiseRejectionEvent): void {
    console.error('Unhandled promise rejection:', event.reason);
    
    const errorReport = {
      error: event.reason instanceof Error ? event.reason : new Error(String(event.reason)),
      message: 'Unhandled Promise Rejection',
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
    };

    this.unhandledRejectionHandlers.forEach(handler => handler(event));
    this.sendErrorReport(errorReport);
  }

  private handleUncaughtException(event: any): void {
    console.error('Uncaught exception:', event);
    
    const errorReport = {
      error: event.error || event,
      message: 'Uncaught Exception',
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
    };

    this.sendErrorReport(errorReport);
  }

  private handleResourceError(event: Event): void {
    const target = event.target as HTMLImageElement | HTMLScriptElement | HTMLLinkElement;
    const resourceUrl = target.src || target.href;
    
    console.error('Resource loading error:', resourceUrl);
    
    const errorReport = {
      error: new Error(`Resource loading failed: ${resourceUrl}`),
      message: 'Resource Loading Error',
      resourceUrl,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
    };

    this.sendErrorReport(errorReport);
  }

  private async sendErrorReport(report: any): Promise<void> {
    try {
      // 发送到错误监控服务
      console.log('Error report:', report);
      
      // 可以集成 Sentry、LogRocket 等服务
      // if (window.Sentry) {
      //   window.Sentry.captureException(report.error);
      // }
    } catch (e) {
      console.error('Failed to send error report:', e);
    }
  }

  // 添加错误处理器
  addErrorHandler(handler: (error: ErrorEvent) => void): void {
    this.errorHandlers.push(handler);
  }

  // 添加未处理 Promise 拒绝处理器
  addUnhandledRejectionHandler(handler: (event: PromiseRejectionEvent) => void): void {
    this.unhandledRejectionHandlers.push(handler);
  }

  // 移除错误处理器
  removeErrorHandler(handler: (error: ErrorEvent) => void): void {
    const index = this.errorHandlers.indexOf(handler);
    if (index > -1) {
      this.errorHandlers.splice(index, 1);
    }
  }

  // 移除未处理 Promise 拒绝处理器
  removeUnhandledRejectionHandler(handler: (event: PromiseRejectionEvent) => void): void {
    const index = this.unhandledRejectionHandlers.indexOf(handler);
    if (index > -1) {
      this.unhandledRejectionHandlers.splice(index, 1);
    }
  }
}

// 创建全局错误处理器实例
export const globalErrorHandler = GlobalErrorHandler.getInstance();

// 错误重试工具
export class RetryHandler {
  static async withRetry<T>(
    fn: () => Promise<T>,
    options: {
      maxAttempts?: number;
      delay?: number;
      backoff?: number;
      onRetry?: (error: Error, attempt: number) => void;
    } = {}
  ): Promise<T> {
    const {
      maxAttempts = 3,
      delay = 1000,
      backoff = 2,
      onRetry,
    } = options;

    let lastError: Error;
    
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        
        if (attempt === maxAttempts) {
          throw lastError;
        }
        
        if (onRetry) {
          onRetry(lastError, attempt);
        }
        
        const waitTime = delay * Math.pow(backoff, attempt - 1);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
    
    throw lastError!;
  }
}

// 错误日志工具
export class ErrorLogger {
  private static logs: Array<{
    error: Error;
    timestamp: string;
    context?: any;
  }> = [];

  static log(error: Error, context?: any): void {
    const logEntry = {
      error,
      timestamp: new Date().toISOString(),
      context,
    };
    
    this.logs.push(logEntry);
    
    // 保持最近 1000 条错误日志
    if (this.logs.length > 1000) {
      this.logs = this.logs.slice(-1000);
    }
    
    console.error('Error logged:', logEntry);
  }

  static getLogs(): Array<{
    error: Error;
    timestamp: string;
    context?: any;
  }> {
    return [...this.logs];
  }

  static clearLogs(): void {
    this.logs = [];
  }

  static exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }
}

// HOC 错误边界
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<ErrorBoundaryProps, 'children'>
) {
  return function WithErrorBoundary(props: P) {
    return (
      <ErrorBoundary {...errorBoundaryProps}>
        <Component {...props} />
      </ErrorBoundary>
    );
  };
}