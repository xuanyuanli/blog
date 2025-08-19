# Claude Code Provider Manager GUI

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-4.x-blue.svg)](https://www.typescriptlang.org/)
[![Electron](https://img.shields.io/badge/Electron-28.x-9cf.svg)](https://www.electronjs.org/)
[![React](https://img.shields.io/badge/React-18.x-61dafb.svg)](https://reactjs.org/)]

一个跨平台的 Claude API 提供商管理桌面应用，支持多个 API 提供商的配置、验证和快速切换。

## ✨ 特性

### 🚀 核心功能
- **多提供商管理**: 支持同时配置多个 Claude API 提供商
- **一键切换**: 快速在激活的提供商之间切换
- **实时验证**: 自动验证提供商的连接状态和模型可用性
- **安全存储**: 使用系统 keychain 安全存储认证令牌
- **快速启动**: 一键启动 Claude Code 并自动配置环境变量

### 🎨 用户体验
- **现代化界面**: 基于 Tailwind CSS 的响应式设计
- **深色模式**: 支持浅色/深色主题切换
- **系统托盘**: 后台运行，托盘图标快速访问
- **全局快捷键**: 支持全局快捷键操作
- **文件关联**: 支持配置文件的拖拽打开

### 🔧 高级功能
- **深度链接**: 支持 `claude-code://` 协议
- **自动启动**: 支持开机自启动
- **配置导入导出**: 便于备份和迁移配置
- **实时监控**: 性能指标和系统状态监控
- **错误处理**: 完善的错误边界和错误报告

### 🌐 跨平台支持
- **Windows**: 完整的 Windows 功能支持
- **macOS**: 原生 macOS 体验
- **Linux**: 主流 Linux 发行版支持

## 📦 安装

### 系统要求
- **Node.js**: >= 18.0.0
- **npm**: >= 8.0.0
- **操作系统**: Windows 10+, macOS 10.14+, Ubuntu 18.04+

### 从源码构建

1. **克隆仓库**
   ```bash
   git clone https://github.com/your-username/claude-code-provider-manager-gui.git
   cd claude-code-provider-manager-gui
   ```

2. **安装依赖**
   ```bash
   npm install
   ```

3. **开发模式运行**
   ```bash
   npm run dev
   ```

4. **构建应用**
   ```bash
   npm run build
   ```

5. **打包为可执行文件**
   ```bash
   npm run dist
   ```

### Docker 部署

1. **使用 Docker Compose**
   ```bash
   docker-compose up -d
   ```

2. **开发环境**
   ```bash
   docker-compose -f docker-compose.dev.yml up
   ```

## 🚀 使用指南

### 首次运行

1. **启动应用**
   ```bash
   npm run electron:dev
   ```

2. **添加提供商**
   - 点击"添加提供商"按钮
   - 填写提供商信息：
     - 名称: 提供商名称
     - 基础 URL: API 端点
     - 模型: 默认模型
     - 快速模型: 轻量级模型
     - 认证令牌: API 密钥

3. **验证配置**
   - 点击"验证"按钮
   - 确认连接状态和模型可用性

4. **激活提供商**
   - 选择要使用的提供商
   - 点击"激活"按钮

### 日常使用

#### 🎮 界面操作
- **概览页面**: 查看系统状态和提供商统计
- **提供商管理**: 添加、编辑、删除提供商
- **环境配置**: 管理启动参数和环境变量
- **系统设置**: 配置应用偏好设置

#### ⌨️ 快捷键
- `Ctrl/Cmd + Shift + C`: 显示/隐藏主窗口
- `Ctrl/Cmd + Shift + N`: 新建提供商
- `Ctrl/Cmd + Shift + L`: 快速启动 Claude Code
- `Ctrl/Cmd + Shift + V`: 验证当前提供商
- `Ctrl/Cmd + Shift + S`: 切换提供商
- `Ctrl/Cmd + ,`: 打开设置

#### 🔗 深度链接
应用支持以下深度链接操作：

```bash
# 添加提供商
claude-code://provider?name=MyProvider&baseUrl=https://api.example.com&token=your_token

# 切换提供商
claude-code://switch?id=provider-id

# 启动 Claude Code
claude-code://launch?provider=provider-id&dir=/path/to/project

# 打开设置
claude-code://settings?section=providers
```

#### 📁 文件关联
应用支持以下文件类型：

- `.claude`: Claude 配置文件
- `.ccp`: Claude Code Provider 配置文件
- `.json`: JSON 配置文件

## 🛠️ 开发指南

### 项目结构

```
claude-code-provider-manager-gui/
├── src/
│   ├── main/                    # 主进程代码
│   │   ├── config/              # 配置管理
│   │   ├── security/            # 安全存储
│   │   ├── platform/            # 跨平台适配
│   │   ├── system/              # 系统集成
│   │   ├── ipc/                 # IPC 通信
│   │   └── services/            # API 服务
│   ├── renderer/               # 渲染进程代码
│   │   ├── components/          # React 组件
│   │   ├── pages/               # 页面组件
│   │   ├── contexts/            # Context 管理
│   │   ├── services/            # 前端服务
│   │   ├── types/               # 类型定义
│   │   └── utils/               # 工具函数
│   └── preload.ts              # 预加载脚本
├── tests/                      # 测试文件
├── docs/                       # 文档
├── assets/                     # 静态资源
├── build/                      # 构建配置
└── docker/                     # Docker 配置
```

### 开发环境设置

1. **安装开发依赖**
   ```bash
   npm install
   ```

2. **启动开发服务器**
   ```bash
   npm run dev
   ```

3. **启动 Electron 开发模式**
   ```bash
   npm run electron:dev
   ```

### 代码规范

项目使用以下工具保证代码质量：

- **ESLint**: JavaScript/TypeScript 代码检查
- **Prettier**: 代码格式化
- **TypeScript**: 类型检查
- **Jest**: 单元测试
- **Testing Library**: 组件测试

### 提交规范

使用 [Conventional Commits](https://www.conventionalcommits.org/) 规范：

```bash
feat: 添加新功能
fix: 修复 bug
docs: 更新文档
style: 代码格式化
refactor: 重构代码
test: 添加测试
chore: 构建或辅助工具变动
```

### 测试

运行测试套件：

```bash
# 运行所有测试
npm test

# 运行测试并生成覆盖率报告
npm run test:coverage

# 运行 E2E 测试
npm run test:e2e
```

## 🔧 配置

### 应用配置

应用配置文件位于 `~/.config/claude-code-provider-manager/config.json`：

```json
{
  "providers": [
    {
      "id": "provider-1",
      "name": "Anthropic",
      "baseUrl": "https://api.anthropic.com",
      "model": "claude-3-sonnet-20240229",
      "smallFastModel": "claude-3-haiku-20240307",
      "isActive": true,
      "isValid": true
    }
  ],
  "settings": {
    "theme": "system",
    "language": "zh-CN",
    "autoValidate": true,
    "autoStart": false,
    "closeToTray": true
  },
  "security": {
    "encryptSensitiveData": true,
    "requireConfirmationForDelete": true
  }
}
```

### 环境变量

支持以下环境变量：

```bash
# 开发模式
NODE_ENV=development

# 调试模式
DEBUG=app:*

# 应用配置路径
APP_CONFIG_PATH=/path/to/config

# 日志级别
LOG_LEVEL=info
```

## 🚀 部署

### 本地构建

```bash
# 构建生产版本
npm run build

# 打包应用
npm run dist

# 创建便携版本
npm run dist:dir
```

### Docker 部署

```bash
# 构建镜像
docker build -t claude-code-manager .

# 运行容器
docker run -d \
  --name claude-manager \
  -p 1420:1420 \
  -v $(pwd)/config:/app/config \
  claude-code-manager
```

### CI/CD

项目配置了完整的 CI/CD 流水线：

- **自动测试**: 每次提交自动运行测试
- **代码质量**: ESLint 和 TypeScript 检查
- **安全扫描**: 依赖安全检查
- **自动构建**: 构建应用和 Docker 镜像
- **自动部署**: 发布到 GitHub Releases

## 📚 API 文档

### 主进程 API

#### 配置管理
```typescript
// 获取配置
const config = await electronAPI.config.getConfig();

// 更新配置
await electronAPI.config.updateConfig(updates);

// 导出配置
await electronAPI.config.exportConfig();
```

#### 提供商管理
```typescript
// 获取所有提供商
const providers = await electronAPI.providers.getProviders();

// 添加提供商
const newProvider = await electronAPI.providers.addProvider(providerData);

// 删除提供商
await electronAPI.providers.deleteProvider(id);
```

#### 系统功能
```typescript
// 显示通知
await electronAPI.system.showNotification(title, body);

// 打开文件对话框
const result = await electronAPI.system.showFileDialog(options);

// 打开外部链接
await electronAPI.system.openExternal(url);
```

### 渲染进程 API

#### Context Hooks
```typescript
// 使用应用上下文
const { providers, addProvider, switchProvider } = useApp();

// 使用性能监控
const { metrics, grade } = usePerformance();

// 使用错误处理
const { error, setError } = useAsyncError();
```

#### 组件 API
```typescript
// 错误边界
<ErrorBoundary fallback={<ErrorFallback />}>
  <YourComponent />
</ErrorBoundary>

// 懒加载
const LazyComponent = React.lazy(() => import('./Component'));

// 性能优化
const optimizedCallback = useDebounce(callback, 300);
```

## 🐛 故障排除

### 常见问题

#### 1. 应用无法启动
- 检查 Node.js 版本是否 >= 18.0.0
- 确认所有依赖已正确安装
- 查看控制台错误信息

#### 2. 提供商验证失败
- 检查 API URL 是否正确
- 确认证令牌是否有效
- 验证网络连接状态

#### 3. 快捷键不工作
- 确认全局快捷键已正确注册
- 检查是否有其他应用占用相同快捷键
- 尝试重新启动应用

#### 4. 系统托盘不显示
- 检查系统是否支持托盘功能
- 确认应用有正确的权限
- 尝试重新安装应用

### 调试模式

启用调试模式：

```bash
# 设置调试环境变量
DEBUG=app:* npm run electron:dev

# 或在应用中启用
# 设置 -> 高级 -> 调试模式 -> 开启
```

### 日志文件

日志文件位置：

- **Windows**: `%APPDATA%/claude-code-provider-manager/logs/`
- **macOS**: `~/Library/Logs/claude-code-provider-manager/`
- **Linux**: `~/.config/claude-code-provider-manager/logs/`

## 🤝 贡献

我们欢迎社区贡献！请阅读 [贡献指南](CONTRIBUTING.md) 了解详细信息。

### 开发流程

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'Add amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 创建 Pull Request

### 代码规范

- 使用 TypeScript 编写类型安全的代码
- 遵循 ESLint 和 Prettier 规范
- 编写测试用例
- 更新相关文档

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详细信息。

## 🙏 致谢

- [Electron](https://www.electronjs.org/) - 跨平台桌面应用框架
- [React](https://reactjs.org/) - 用户界面库
- [TypeScript](https://www.typescriptlang.org/) - 类型安全的 JavaScript
- [Tailwind CSS](https://tailwindcss.com/) - 实用优先的 CSS 框架
- [Lucide React](https://lucide.dev/) - 美观的图标库

## 📞 联系我们

- **GitHub Issues**: [报告问题](https://github.com/your-username/claude-code-provider-manager-gui/issues)
- **讨论**: [GitHub Discussions](https://github.com/your-username/claude-code-provider-manager-gui/discussions)
- **邮件**: support@example.com

---

**祝你变得更强!** 🚀