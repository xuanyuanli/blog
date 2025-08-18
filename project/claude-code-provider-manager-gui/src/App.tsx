import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';

const App: React.FC = () => {
  return (
    <Router>
      <div className="h-full bg-gray-50 dark:bg-gray-900" data-testid="app-loaded">
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Claude Code Provider Manager
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-300 mb-8">
              项目基础设施搭建完成！
            </p>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 max-w-md mx-auto">
              <h2 className="text-xl font-semibold mb-4">下一步计划</h2>
              <ul className="text-left space-y-2 text-sm text-gray-600 dark:text-gray-300">
                <li className="flex items-center">
                  <span className="text-green-500 mr-2">✓</span>
                  配置文件和工具链
                </li>
                <li className="flex items-center">
                  <span className="text-blue-500 mr-2">→</span>
                  Rust 后端核心功能
                </li>
                <li className="flex items-center">
                  <span className="text-gray-400 mr-2">○</span>
                  React 前端应用
                </li>
                <li className="flex items-center">
                  <span className="text-gray-400 mr-2">○</span>
                  安全存储和跨平台适配
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </Router>
  );
};

export default App;