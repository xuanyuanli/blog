import React from 'react';
import { Settings, Home, Database, Zap, HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface LayoutProps {
  children: React.ReactNode;
}

interface SidebarProps {
  activePage: string;
  onPageChange: (page: string) => void;
}

const navigationItems = [
  { id: 'dashboard', label: '概览', icon: Home },
  { id: 'providers', label: '提供商管理', icon: Database },
  { id: 'environment', label: '环境配置', icon: Zap },
  { id: 'settings', label: '系统设置', icon: Settings },
];

const Sidebar: React.FC<SidebarProps> = ({ activePage, onPageChange }) => {
  return (
    <div className="w-64 bg-gray-50 border-r border-gray-200 h-full flex flex-col">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-gray-900">Claude Code</h1>
            <p className="text-xs text-gray-500">Provider Manager</p>
          </div>
        </div>
      </div>
      
      <nav className="flex-1 p-4">
        <ul className="space-y-1">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = activePage === item.id;
            
            return (
              <li key={item.id}>
                <Button
                  variant={isActive ? 'primary' : 'ghost'}
                  className={`w-full justify-start ${
                    isActive 
                      ? 'bg-blue-600 text-white' 
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                  onClick={() => onPageChange(item.id)}
                >
                  <Icon className="w-4 h-4 mr-3" />
                  {item.label}
                </Button>
              </li>
            );
          })}
        </ul>
      </nav>
      
      <div className="p-4 border-t border-gray-200">
        <Button
          variant="ghost"
          className="w-full justify-start text-gray-500 hover:text-gray-700"
        >
          <HelpCircle className="w-4 h-4 mr-3" />
          帮助与支持
        </Button>
      </div>
    </div>
  );
};

interface HeaderProps {
  title: string;
  subtitle?: string;
}

const Header: React.FC<HeaderProps> = ({ title, subtitle }) => {
  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">{title}</h1>
          {subtitle && (
            <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
          )}
        </div>
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="sm">
            <Settings className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </header>
  );
};

interface MainContentProps {
  children: React.ReactNode;
}

const MainContent: React.FC<MainContentProps> = ({ children }) => {
  return (
    <main className="flex-1 overflow-y-auto">
      <div className="p-6">
        {children}
      </div>
    </main>
  );
};

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [activePage, setActivePage] = React.useState('dashboard');
  
  const getPageTitle = () => {
    switch (activePage) {
      case 'dashboard':
        return { title: '概览', subtitle: '当前状态和快速操作' };
      case 'providers':
        return { title: '提供商管理', subtitle: '管理您的Claude API提供商' };
      case 'environment':
        return { title: '环境配置', subtitle: '环境变量和启动设置' };
      case 'settings':
        return { title: '系统设置', subtitle: '应用配置和偏好设置' };
      default:
        return { title: 'Claude Code Provider Manager' };
    }
  };

  const { title, subtitle } = getPageTitle();

  return (
    <div className="h-screen flex bg-gray-50">
      <Sidebar activePage={activePage} onPageChange={setActivePage} />
      <div className="flex-1 flex flex-col">
        <Header title={title} subtitle={subtitle} />
        <MainContent>
          {React.cloneElement(children as React.ReactElement, { activePage })}
        </MainContent>
      </div>
    </div>
  );
};