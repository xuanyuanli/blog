import React from 'react';
import { Plus, Play, Settings, AlertCircle, CheckCircle, Activity } from 'lucide-react';
import { Card, CardHeader, CardContent, CardActions } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { StatusIndicator } from '@/components/ui/StatusIndicator';
import type { Provider, EnvironmentInfo } from '@/types';

interface DashboardProps {
  providers: Provider[];
  activeProvider: Provider | null;
  environmentInfo: EnvironmentInfo | null;
  onAddProvider: () => void;
  onLaunchClaudeCode: () => void;
  onSwitchProvider: (id: string) => void;
  onSettings: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  providers,
  activeProvider,
  environmentInfo,
  onAddProvider,
  onLaunchClaudeCode,
  onSwitchProvider,
  onSettings,
}) => {
  const getSystemStatus = () => {
    if (!activeProvider) return 'error';
    if (!environmentInfo?.isAuthenticated) return 'warning';
    return 'success';
  };

  const getSystemStatusText = () => {
    if (!activeProvider) return '未配置提供商';
    if (!environmentInfo?.isAuthenticated) return '认证失败';
    return '系统正常';
  };

  return (
    <div className="space-y-6">
      {/* 欢迎卡片 */}
      <Card>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                欢迎使用 Claude Code Provider Manager
              </h2>
              <p className="text-gray-600 mt-2">
                管理您的Claude API提供商，快速切换环境配置
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <Button variant="secondary" onClick={onSettings}>
                <Settings className="w-4 h-4 mr-2" />
                设置
              </Button>
              <Button onClick={onLaunchClaudeCode}>
                <Play className="w-4 h-4 mr-2" />
                启动 Claude Code
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 系统状态 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-gray-900">系统状态</h3>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-3">
              <StatusIndicator 
                status={getSystemStatus()} 
                text={getSystemStatusText()}
              />
            </div>
            {activeProvider && (
              <div className="mt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">当前提供商:</span>
                  <span className="font-medium">{activeProvider.name}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">主模型:</span>
                  <span className="font-mono text-xs">{activeProvider.model}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">快速模型:</span>
                  <span className="font-mono text-xs">{activeProvider.smallFastModel}</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-gray-900">提供商统计</h3>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">总提供商数</span>
                <span className="text-2xl font-bold text-blue-600">{providers.length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">已验证</span>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span className="font-medium">
                    {providers.filter(p => p.isValid === true).length}
                  </span>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">验证失败</span>
                <div className="flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 text-red-600" />
                  <span className="font-medium">
                    {providers.filter(p => p.isValid === false).length}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-gray-900">快速操作</h3>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Button 
                variant="secondary" 
                className="w-full justify-start"
                onClick={onAddProvider}
              >
                <Plus className="w-4 h-4 mr-2" />
                添加提供商
              </Button>
              <Button 
                variant="secondary" 
                className="w-full justify-start"
                onClick={() => activeProvider && onSwitchProvider(activeProvider.id)}
                disabled={!activeProvider}
              >
                <Activity className="w-4 h-4 mr-2" />
                切换环境
              </Button>
              <Button 
                variant="secondary" 
                className="w-full justify-start"
                onClick={onSettings}
              >
                <Settings className="w-4 h-4 mr-2" />
                系统设置
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 提供商列表 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">我的提供商</h3>
            <Button onClick={onAddProvider}>
              <Plus className="w-4 h-4 mr-2" />
              添加提供商
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {providers.length === 0 ? (
            <div className="text-center py-12">
              <div className="mx-auto w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <AlertCircle className="w-6 h-6 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                还没有配置提供商
              </h3>
              <p className="text-gray-500 mb-4">
                开始使用前，请先添加您的第一个Claude API提供商
              </p>
              <Button onClick={onAddProvider}>
                <Plus className="w-4 h-4 mr-2" />
                添加第一个提供商
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {providers.map((provider) => (
                <div
                  key={provider.id}
                  className={`p-4 border rounded-lg cursor-pointer transition-all ${
                    provider.isActive
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => onSwitchProvider(provider.id)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-gray-900">{provider.name}</h4>
                    <StatusIndicator
                      status={provider.isActive ? 'success' : provider.isValid === false ? 'error' : 'unknown'}
                      size="sm"
                    />
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{provider.baseUrl}</p>
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>{provider.model}</span>
                    {provider.isActive && (
                      <span className="text-blue-600 font-medium">已激活</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};