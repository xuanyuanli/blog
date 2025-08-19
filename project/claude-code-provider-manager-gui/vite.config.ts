import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import electron from 'vite-plugin-electron';
import renderer from 'vite-plugin-electron-renderer';

const host = process.env.TAURI_DEBUG ? 'localhost' : 'localhost';

export default defineConfig(async () => ({
  plugins: [
    react(),
    electron([
      {
        // 主进程入口文件
        entry: 'src/main.ts',
        onstart(options) {
          options.startup();
        },
        vite: {
          build: {
            outDir: 'dist',
          },
        },
      },
      {
        // 预加载脚本
        entry: 'src/preload.ts',
        onstart(options) {
          options.reload();
        },
        vite: {
          build: {
            outDir: 'dist',
          },
        },
      },
    ]),
    renderer(),
  ],
  
  // 解决路径映射
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@/components': path.resolve(__dirname, './src/components'),
      '@/pages': path.resolve(__dirname, './src/pages'),
      '@/services': path.resolve(__dirname, './src/services'),
      '@/types': path.resolve(__dirname, './src/types'),
      '@/utils': path.resolve(__dirname, './src/utils'),
      '@/main': path.resolve(__dirname, './src/main'),
      '@/contexts': path.resolve(__dirname, './src/contexts'),
    },
  },

  // 构建优化
  build: {
    target: 'esnext',
    minify: !process.env.TAURI_DEBUG ? 'esbuild' : false,
    sourcemap: !!process.env.TAURI_DEBUG,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          electron: ['electron'],
          icons: ['lucide-react'],
          forms: ['react-hook-form', 'zod'],
        },
      },
    },
  },

  // 开发服务器配置
  server: {
    port: 1420,
    host: '0.0.0.0',
    hmr: {
      port: 1421,
    },
    watch: {
      ignored: ["**/src-tauri/**", "**/dist/**"],
    },
  },

  // 环境变量
  define: {
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version || '1.0.0'),
    __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
    __ELECTRON__: JSON.stringify(true),
  },

  // 清理控制台输出
  clearScreen: false,
}));