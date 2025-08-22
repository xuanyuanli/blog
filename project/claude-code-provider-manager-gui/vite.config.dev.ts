import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  
  // 解决路径映射
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@/components': path.resolve(__dirname, './src/components'),
      '@/pages': path.resolve(__dirname, './src/pages'),
      '@/services': path.resolve(__dirname, './src/services'),
      '@/types': path.resolve(__dirname, './src/types'),
      '@/utils': path.resolve(__dirname, './src/utils'),
      '@/contexts': path.resolve(__dirname, './src/contexts'),
    },
  },

  // 开发服务器配置
  server: {
    port: 1420,
    host: '0.0.0.0',
    hmr: {
      port: 1421,
    },
  },

  // 构建优化
  build: {
    target: 'esnext',
    sourcemap: true,
    rollupOptions: {
      external: ['keytar', 'electron'],
    },
  },

  // 定义全局变量
  define: {
    __APP_VERSION__: JSON.stringify('1.0.0'),
    __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
    __ELECTRON__: JSON.stringify(false),
  },

  // 清理控制台输出
  clearScreen: false,
});