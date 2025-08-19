import React, { useState } from 'react';
import { AppProvider, useApp } from '@/contexts/AppContext';
import { Layout } from '@/components/layout/Layout';
import { Dashboard } from '@/pages/Dashboard';
import { ProviderForm } from '@/components/business/ProviderForm';
import { Button } from '@/components/ui/Button';
import { Plus, AlertCircle } from 'lucide-react';
import type { CreateProviderRequest, ValidationResult } from '@/types';

const AppContent: React.FC = () => {
  const { 
    providers, 
    activeProvider, 
    isLoading, 
    error, 
    addProvider, 
    deleteProvider, 
    switchProvider, 
    launchClaudeCode,
    clearError,
    refreshData 
  } = useApp();
  
  const [showProviderForm, setShowProviderForm] = useState(false);
  const [currentPage, setCurrentPage] = useState('dashboard');

  const handleAddProvider = async (data: CreateProviderRequest) => {
    await addProvider(data);
    await refreshData();
  };

  const handleValidateProvider = async (baseUrl: string, authToken: string): Promise<ValidationResult> => {
    // 这里需要调用验证API，暂时返回模拟结果
    return {
      providerId: 'temp',
      isValid: true,
      connectionStatus: 'success',
      authStatus: 'success',
      modelStatus: 'available',
      errors: [],
      warnings: [],
      latency: 150,
      testedAt: new Date().toISOString(),
    };
  };

  const handleDeleteProvider = async (id: string) => {
    if (window.confirm('确定要删除这个提供商吗？此操作不可撤销。')) {
      await deleteProvider(id);
      await refreshData();
    }
  };

  const handleSwitchProvider = async (id: string) => {
    try {
      await switchProvider(id);
      await refreshData();
    } catch (error) {
      console.error('Failed to switch provider:', error);
    }
  };

  const handleLaunchClaudeCode = async () => {
    try {
      await launchClaudeCode();
    } catch (error) {
      console.error('Failed to launch Claude Code:', error);
    }
  };

  const renderCurrentPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return (
          <Dashboard
            providers={providers}
            activeProvider={activeProvider}
            environmentInfo={null} // TODO: 实现环境信息获取
            onAddProvider={() => setShowProviderForm(true)}
            onLaunchClaudeCode={handleLaunchClaudeCode}
            onSwitchProvider={handleSwitchProvider}
            onSettings={() => setCurrentPage('settings')}
          />
        );
      case 'providers':
        return (
          <div>
            <h2 className="text-2xl font-bold mb-6">提供商管理</h2>
            <div className="mb-4">
              <Button onClick={() => setShowProviderForm(true)}>
                <Plus className="w-4 h-4 mr-2" />
                添加提供商
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {providers.map((provider) => (
                <div key={provider.id} className="p-4 border rounded-lg">
                  <h3 className="font-semibold">{provider.name}</h3>
                  <p className="text-sm text-gray-600">{provider.baseUrl}</p>
                  <div className="mt-4 flex space-x-2">
                    <Button 
                      size="sm" 
                      variant={provider.isActive ? 'primary' : 'secondary'}
                      onClick={() => handleSwitchProvider(provider.id)}
                    >
                      {provider.isActive ? '已激活' : '激活'}
                    </Button>
                    <Button 
                      size="sm" 
                      variant="danger"
                      onClick={() => handleDeleteProvider(provider.id)}
                    >
                      删除
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      case 'environment':
        return (
          <div>
            <h2 className="text-2xl font-bold mb-6">环境配置</h2>
            <div className="bg-white p-6 rounded-lg shadow">
              <p className="text-gray-600">环境配置功能正在开发中...</p>
            </div>
          </div>
        );
      case 'settings':
        return (
          <div>
            <h2 className="text-2xl font-bold mb-6">系统设置</h2>
            <div className="bg-white p-6 rounded-lg shadow">
              <p className="text-gray-600">系统设置功能正在开发中...</p>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-gray-50">
      {/* 错误提示 */}
      {error && (
        <div className="fixed top-4 right-4 z-50 max-w-md">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
            <div className="flex-1">
              <h4 className="text-sm font-medium text-red-800">错误</h4>
              <p className="text-sm text-red-700 mt-1">{error}</p>
              <Button 
                size="sm" 
                variant="ghost" 
                onClick={clearError}
                className="mt-2"
              >
                关闭
              </Button>
            </div>
          </div>
        </div>
      )}

      <Layout>
        {renderCurrentPage()}
      </Layout>

      {/* 提供商表单弹窗 */}
      <ProviderForm
        isOpen={showProviderForm}
        onClose={() => setShowProviderForm(false)}
        onSubmit={handleAddProvider}
        onValidate={handleValidateProvider}
      />
    </div>
  );
};

const App: React.FC = () => {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
};

export default App;