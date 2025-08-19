# 贡献指南

感谢您对 Claude Code Provider Manager GUI 项目的兴趣！我们欢迎任何形式的贡献。

## 📋 目录

- [行为准则](#行为准则)
- [如何贡献](#如何贡献)
- [开发流程](#开发流程)
- [代码规范](#代码规范)
- [提交规范](#提交规范)
- [问题报告](#问题报告)
- [功能请求](#功能请求)
- [Pull Request 流程](#pull-request-流程)

## 🤝 行为准则

本项目采用 [Contributor Covenant](https://www.contributorcovenant.org/) 行为准则。请确保：

- 使用友好和包容的语言
- 尊重不同的观点和经验
- 优雅地接受建设性批评
- 专注于对社区最有益的事情
- 对其他社区成员表示同理心

## 🚀 如何贡献

### 报告问题

如果您发现了 bug，请通过 [GitHub Issues](https://github.com/your-username/claude-code-provider-manager-gui/issues) 报告。

### 功能请求

我们欢迎新功能建议！请在创建 issue 前先搜索现有功能请求。

### 代码贡献

- 修复 bug
- 添加新功能
- 改进文档
- 优化性能
- 完善测试

### 文档改进

- 修复拼写错误
- 添加示例
- 改进说明
- 翻译文档

## 🛠️ 开发流程

### 1. 准备开发环境

```bash
# 克隆仓库
git clone https://github.com/your-username/claude-code-provider-manager-gui.git
cd claude-code-provider-manager-gui

# 安装依赖
npm install

# 启动开发模式
npm run dev
```

### 2. 创建功能分支

```bash
# 创建新分支
git checkout -b feature/your-feature-name

# 或者修复分支
git checkout -b fix/your-fix-name
```

### 3. 进行开发

- 遵循代码规范
- 编写测试用例
- 更新相关文档
- 确保代码可以正常构建

### 4. 提交更改

```bash
# 添加更改到暂存区
git add .

# 提交更改
git commit -m "feat: add new feature"
```

### 5. 推送到分支

```bash
# 推送到您的分支
git push origin feature/your-feature-name
```

### 6. 创建 Pull Request

- 在 GitHub 上创建 PR
- 填写 PR 描述
- 链接相关 issue
- 等待代码审查

## 📝 代码规范

### TypeScript 规范

- 使用严格的 TypeScript 配置
- 为所有函数、变量、参数添加类型
- 使用接口定义对象结构
- 避免使用 `any` 类型

```typescript
// ✅ 好的示例
interface User {
  id: string;
  name: string;
  email: string;
}

const getUser = (id: string): User | null => {
  // 实现
};

// ❌ 避免的示例
const getUser = (id) => {
  // 实现
};
```

### React 规范

- 使用函数组件和 Hooks
- 组件名称使用 PascalCase
- 文件名与组件名称一致
- 使用 TypeScript 类型

```typescript
// ✅ 好的示例
interface ButtonProps {
  children: React.ReactNode;
  onClick: () => void;
  variant?: 'primary' | 'secondary';
}

const Button: React.FC<ButtonProps> = ({ children, onClick, variant = 'primary' }) => {
  return (
    <button className={`btn btn-${variant}`} onClick={onClick}>
      {children}
    </button>
  );
};

// ❌ 避免的示例
function Button(props) {
  return (
    <button className="btn" onClick={props.onClick}>
      {props.children}
    </button>
  );
}
```

### 样式规范

- 使用 Tailwind CSS 类
- 避免内联样式
- 使用响应式设计
- 保持样式一致性

```typescript
// ✅ 好的示例
<div className="p-4 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow">
  <h2 className="text-xl font-semibold text-gray-800">标题</h2>
</div>

// ❌ 避免的示例
<div style={{ padding: '16px', backgroundColor: 'white', borderRadius: '8px' }}>
  <h2 style={{ fontSize: '20px', fontWeight: '600' }}>标题</h2>
</div>
```

### 测试规范

- 为所有新功能编写测试
- 使用 Jest 和 Testing Library
- 保持测试简洁和可读
- 测试覆盖率不低于 80%

```typescript
// ✅ 好的示例
describe('Button Component', () => {
  it('renders with default props', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole('button', { name: /click me/i })).toBeInTheDocument();
  });

  it('handles click events', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click me</Button>);
    
    fireEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
```

## 📋 提交规范

我们使用 [Conventional Commits](https://www.conventionalcommits.org/) 规范：

### 提交类型

- `feat`: 新功能
- `fix`: 修复 bug
- `docs`: 文档更新
- `style`: 代码格式化
- `refactor`: 代码重构
- `test`: 添加或修改测试
- `chore`: 构建或辅助工具变动

### 提交格式

```
<type>(<scope>): <subject>

<body>

<footer>
```

### 示例

```bash
# 新功能
feat(provider): add provider validation functionality

# 修复 bug
fix(ui): fix button hover state on mobile devices

# 文档更新
docs(readme): update installation instructions

# 代码格式化
style(components): format button component styles

# 重构
refactor(api): simplify provider API calls

# 测试
test(provider): add unit tests for provider validation

# 构建工具
chore(deps): update dependencies to latest versions
```

### 提交消息最佳实践

- 使用现在时态："add feature" 而不是 "added feature"
- 首字母小写
- 以动词开头
- 保持简洁明了（不超过 50 个字符）
- 在正文中详细说明变更内容

## 🐛 问题报告

### 报告 Bug

使用 [Bug Report 模板](https://github.com/your-username/claude-code-provider-manager-gui/issues/new?template=bug_report.yml)：

```markdown
## Bug 描述
简要描述 bug 的情况

## 复现步骤
1. 执行操作 '...'
2. 点击 '....'
3. 滚动到 '....'
4. 看到错误

## 期望行为
简要描述您期望发生的情况

## 截图
如果适用，请添加截图来帮助解释您的问题

## 环境信息
- 操作系统: [例如 iOS]
- 浏览器: [例如 chrome, safari]
- 应用版本: [例如 1.0.0]
```

### 功能请求

使用 [Feature Request 模板](https://github.com/your-username/claude-code-provider-manager-gui/issues/new?template=feature_request.yml)：

```markdown
## 功能描述
简要描述您希望添加的功能

## 问题背景
这个功能解决了什么问题？
为什么这个功能对项目很重要？

## 建议的解决方案
描述您希望的实现方式
可以包含伪代码或设计稿

## 替代方案
描述您考虑过的其他解决方案
为什么这些方案不如您的建议

## 额外信息
添加任何其他关于功能请求的信息或截图
```

## 🔄 Pull Request 流程

### 1. 准备 PR

- 确保您的代码是最新的
- 运行测试确保所有通过
- 检查代码格式
- 更新相关文档

### 2. 创建 PR

- 使用清晰的标题
- 描述变更内容
- 链接相关 issue
- 添加测试结果

### 3. PR 标题格式

```
<type>(<scope>): <description>

Fixes #<issue-number>
```

示例：
```
feat(api): add provider validation endpoint

Fixes #123
```

### 4. PR 描述模板

```markdown
## 变更描述
简要描述此 PR 的变更内容

## 变更类型
- [ ] Bug 修复
- [ ] 新功能
- [ ] 文档更新
- [ ] 代码重构
- [ ] 性能优化
- [ ] 测试改进

## 测试
- [ ] 添加了新测试
- [ ] 更新了现有测试
- [ ] 所有测试通过

## 检查清单
- [ ] 代码遵循项目规范
- [ ] 所有测试通过
- [ ] 文档已更新
- [ ] 变更已自测

## 相关 issue
Fixes #<issue-number>
Closes #<issue-number>
```

### 5. 代码审查

我们会尽快审查您的 PR。请确保：

- 响应审查意见
- 及时更新代码
- 保持友好的沟通

### 6. 合并 PR

在满足以下条件后，您的 PR 将被合并：

- 所有自动化测试通过
- 代码审查通过
- 相关文档已更新
- CI/CD 检查通过

## 🎯 开发目标

### 短期目标

- [ ] 完善核心功能
- [ ] 提高测试覆盖率
- [ ] 改进用户体验
- [ ] 修复已知问题

### 长期目标

- [ ] 支持更多平台
- [ ] 添加高级功能
- [ ] 性能优化
- [ ] 社区建设

## 📞 联系方式

如果您有任何问题或需要帮助，请通过以下方式联系我们：

- GitHub Issues: [报告问题](https://github.com/your-username/claude-code-provider-manager-gui/issues)
- GitHub Discussions: [讨论](https://github.com/your-username/claude-code-provider-manager-gui/discussions)
- 邮箱: support@example.com

## 🙏 致谢

感谢您为 Claude Code Provider Manager GUI 做出贡献！您的每一份贡献都让这个项目变得更好。

---

**祝您编码愉快！** 🚀