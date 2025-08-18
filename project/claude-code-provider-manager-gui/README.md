# Claude Code Provider Manager GUI

Claude Code Provider Manager GUI 是一个跨平台的桌面应用程序，为 Claude Code 用户提供直观、便捷的提供商管理界面。

## 功能特性

- 🔧 **提供商管理**: 添加、编辑、删除 Claude API 提供商配置
- 🔄 **快速切换**: 一键切换不同的提供商环境
- ✅ **配置验证**: 自动验证配置有效性和连接状态
- 🚀 **一键启动**: 直接启动 Claude Code 并应用当前配置
- 🌙 **主题支持**: 明/暗主题切换
- 📱 **跨平台**: 支持 Windows、macOS、Linux

## 技术栈

- **前端**: React 18 + TypeScript + Tailwind CSS
- **桌面框架**: Tauri
- **构建工具**: Vite
- **状态管理**: React Context
- **图标**: Lucide React

## 开发环境要求

- Node.js 18+
- Rust 1.70+
- Claude Code 已安装

## 快速开始

### 安装依赖

```bash
npm install
```

### 开发模式

```bash
npm run tauri:dev
```

### 构建应用

```bash
npm run tauri:build
```

## 项目结构

```
src/
├── components/     # React 组件
├── pages/         # 页面组件
├── services/      # 业务逻辑服务
├── types/         # TypeScript 类型定义
├── utils/         # 工具函数
└── App.tsx        # 主应用组件

src-tauri/         # Tauri 后端代码
├── src/           # Rust 源码
└── tauri.conf.json # Tauri 配置
```

## 开发规范

- 使用 TypeScript 编写类型安全的代码
- 遵循 React Hooks 最佳实践
- 使用 Tailwind CSS 进行样式开发
- 保持组件的可复用性和模块化

## 贡献指南

1. Fork 本仓库
2. 创建功能分支
3. 提交代码变更
4. 推送到分支
5. 创建 Pull Request

## 许可证

MIT License

**祝你变得更强!**