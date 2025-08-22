# CLAUDE.md

此文件为 Claude Code (claude.ai/code) 在本仓库中工作时提供指导。

## 项目概述

这是一个跨平台的 Claude API 提供商管理和配置桌面应用程序。使用 Tauri（Rust 后端）+ React（TypeScript 前端）构建，为 Claude Code 用户提供安全的凭证存储、提供商验证和环境切换功能。

## 架构设计

### 前端（React + TypeScript）
- **React 18** 配合 TypeScript 确保类型安全
- **Tailwind CSS** 用于原子化设计原则的样式设计
- **Vite** 用于快速开发和构建
- **组件结构**：UI 组件 → 业务组件 → 页面 → 布局
- **状态管理**：Context API + 自定义 hooks 模式
- **路径别名**：`@/` 映射到 `src/` 实现清晰的导入

### 后端（Tauri + Rust）
- **Tauri** 跨平台桌面应用框架
- **Rust** 后端确保安全性、性能和系统集成
- **安全存储**：平台原生凭证存储（Windows DPAPI、macOS Keychain、Linux Secret Service）
- **命令系统**：Tauri 命令将 Rust 功能暴露给前端
- **跨平台支持**：Windows、macOS 和 Linux

### 关键目录结构
```
src/
├── main.tsx              # React 应用入口点
├── App.tsx               # 主应用组件
├── components/           # 可重用的 UI 和业务组件
│   ├── ui/              # 基础 UI 组件（Button、Input、Modal）
│   ├── business/        # 领域特定组件（ProviderCard、ProviderForm）
│   └── layout/          # 布局组件
├── pages/               # 页面组件（Dashboard）
├── contexts/            # React Context 提供器（AppContext）
├── services/            # 前端 API 服务
├── types/               # TypeScript 类型定义
└── utils/               # 工具函数

src-tauri/src/
├── main.rs              # Tauri 应用入口点
├── commands/            # Tauri 命令处理器
│   ├── config.rs       # 配置管理
│   ├── provider.rs     # 提供商 CRUD 操作
│   ├── environment.rs  # 环境变量管理
│   ├── validation.rs   # 提供商验证
│   └── launcher.rs     # Claude Code 启动器
├── services/            # 核心业务服务
├── models/              # 数据模型和结构
├── utils/               # 工具函数（加密、文件系统）
└── errors/              # 错误定义
```

## 开发命令

### 开发工作流
```bash
# 安装依赖
npm install

# 启动开发模式（前端 + 后端热重载）
npm run dev

# 仅启动前端开发服务器
npm run dev:renderer

# 仅启动主进程（Electron 风格）
npm run dev:main

# 启动 Tauri 开发模式
npm run tauri:dev
```

### 构建
```bash
# 仅构建前端
npm run build:renderer

# 仅构建主进程
npm run build:main

# 构建完整应用程序
npm run build

# 构建 Tauri 应用程序用于分发
npm run tauri:build

# 创建可分发包
npm run dist
```

### 代码质量
```bash
# 检查 TypeScript/React 代码
npm run lint

# 自动修复代码检查问题
npm run lint:fix

# 类型检查（不生成文件）
npm run type-check

# 使用 Prettier 格式化代码
npm run format

# 验证项目结构和依赖
npm run validate
```

### 测试
```bash
# 运行单元测试（Jest）
npm test

# 以监视模式运行测试
npm run test:watch

# 生成测试覆盖率报告
npm run test:coverage

# 运行端到端测试（Playwright）
npm run test:e2e
```

## 配置文件

### 核心配置文件
- **`vite.config.ts`**: 前端构建配置，包含 Electron/Tauri 插件
- **`tsconfig.json`**: TypeScript 配置，包含路径映射
- **`src-tauri/tauri.conf.json`**: Tauri 应用程序配置
- **`electron-builder.json`**: Electron 打包配置（备选构建方式）
- **`jest.config.js`**: 单元测试配置
- **`playwright.config.ts`**: 端到端测试配置

### 环境特定配置
- **`vite.config.dev.ts`**: 开发环境特定的 Vite 配置
- **`tsconfig.main.json`**: 主进程的 TypeScript 配置
- **`tsconfig.test.json`**: 测试的 TypeScript 配置

## 核心功能实现

### 提供商管理
- Claude API 提供商的 CRUD 操作
- 使用平台原生 API 的安全令牌存储
- 提供商验证和健康检查
- Claude Code 的环境变量管理

### 安全架构
- **多层加密**：应用程序级 + 系统级
- **平台特定的安全存储**：
  - Windows: DPAPI（数据保护 API）
  - macOS: Keychain Services  
  - Linux: Secret Service API
- **最小权限**：仅所需的系统访问权限
- **证书验证**：仅 HTTPS API 通信

### 跨平台功能
- **系统托盘集成**
- **深度链接协议**：`claude-code://` URL 方案
- **文件关联**：`.claude`、`.ccp` 配置文件
- **全局快捷键** 快速访问
- **自动启动** 配置

## 架构模式

### 前端模式
- **原子化设计**：组件按复杂度组织（原子 → 分子 → 有机体）
- **自定义 Hooks**：业务逻辑封装在可重用的 hooks 中
- **Context 提供器**：无需外部库的全局状态管理
- **错误边界**：优雅的错误处理和恢复

### 后端模式
- **命令模式**：Tauri 命令作为 API 端点
- **服务层**：业务逻辑与命令处理器分离
- **仓储模式**：数据访问抽象
- **平台适配器**：跨平台代码组织

### 安全模式
- **深度防御**：多层安全防护
- **最小权限原则**：最少的系统权限
- **默认安全**：开箱即用的安全配置
- **输入验证**：所有用户输入在边界处验证

## 重要开发说明

### 状态管理
- 使用 React Context 进行全局应用程序状态管理
- 优先使用自定义 hooks 而非直接使用 Context
- 尽可能保持组件状态本地化
- 对复杂状态转换使用 reducers

### Tauri 集成  
- 所有后端功能通过 Tauri 命令暴露
- 命令是异步的，返回 `Result<T, AppError>`
- 前端通过 `@tauri-apps/api` 调用函数进行通信
- IPC 通信是类型安全的，使用共享的 TypeScript 定义

### 性能考量
- **前端**: 对昂贵组件使用 React.memo，使用 useMemo/useCallback 优化
- **后端**: 全面使用 async/await，HTTP 客户端连接池
- **缓存**: 缓存提供商验证结果以减少 API 调用
- **代码分割**: 供应商代码块分离以改善加载

### 错误处理
- **前端**: 错误边界捕获 React 错误，useAsyncError 处理异步操作
- **后端**: 带上下文的自定义 AppError 类型，结构化错误响应
- **用户体验**: 友好的错误消息、重试机制、优雅降级

### 测试策略
- **单元测试**: 组件和 hooks（React Testing Library）、Rust 函数
- **集成测试**: 完整命令流程、跨平台行为
- **E2E 测试**: 用户工作流（Playwright）、系统集成
- **安全测试**: 加密/解密、权限验证

### 平台特定说明
- **Windows**: NSIS 安装程序，分发需要代码签名
- **macOS**: DMG 打包，Gatekeeper 需要公证
- **Linux**: 支持 AppImage、.deb、.rpm 包
- **开发**: 热重载在所有平台的开发模式下都能工作

## 部署

### 构建产物
- **Windows**: `.msi` 安装程序，便携式 `.exe`
- **macOS**: `.dmg` 磁盘映像，`.app` 包  
- **Linux**: `.AppImage`、`.deb`、`.rpm` 包

### CI/CD 流水线
- **GitHub Actions**: 自动化构建、测试和发布
- **多平台构建**: Windows、macOS（x64/ARM64）、Linux
- **代码签名**: 平台特定的安全签名
- **发布自动化**: 基于标签的发布和变更日志生成

## 常见工作流程

### 添加新的提供商字段
1. 更新 `src-tauri/src/models/provider.rs` 中的 Rust 模型
2. 更新 `src/types/index.ts` 中的 TypeScript 类型
3. 修改数据库架构/配置格式
4. 更新 `src/components/business/ProviderForm.tsx` 中的 UI 表单
5. 在前端和后端添加验证逻辑
6. 为新字段更新测试

### 添加新的 Tauri 命令
1. 在 `src-tauri/src/commands/` 中定义命令
2. 在 `src-tauri/src/main.rs` 中注册命令
3. 添加 TypeScript 定义
4. 创建前端服务函数
5. 为命令添加错误处理
6. 为命令功能编写测试

### 跨平台测试
- 使用 GitHub Actions 矩阵进行多操作系统构建
- 测试平台特定功能（安全存储、系统托盘）
- 验证文件关联和协议处理器
- 检查不同主题/缩放下的 UI 一致性