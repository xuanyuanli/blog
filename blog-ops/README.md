# bops - 博客运维工具

博客项目的命令行部署工具，支持本地构建、SSH 上传、Nginx 配置同步和版本管理。

## 安装

```bash
cd blog-ops
npm install
```

## 使用

### 交互模式

直接运行，通过菜单选择操作：

```bash
node bin/bops.js
```

菜单选项：

```
  ╔═══════════════════════════════╗
  ║      博客运维工具 bops        ║
  ╚═══════════════════════════════╝

❯ 配置服务器连接信息
  构建并发布新博客（Next.js）
  构建并发布旧博客（VuePress）
  构建并发布新旧博客（Next.js + VuePress）
  同步 Nginx 配置
  查看版本历史
  退出
```

### 命令行模式

```bash
# 部署新博客
node bin/bops.js deploy

# 仅部署旧博客到 /archive/
node bin/bops.js deploy --vuepress-only
node bin/bops.js deploy -v

# 部署新旧博客
node bin/bops.js deploy --with-archive
node bin/bops.js deploy -a

# 跳过构建，直接部署已有产物
node bin/bops.js deploy --skip-build
node bin/bops.js deploy -s

# 同步 Nginx 配置
node bin/bops.js nginx

# 查看版本历史
node bin/bops.js versions
```

## 首次使用

1. 运行 `node bin/bops.js`，选择「配置服务器连接信息」
2. 输入服务器 IP、SSH 端口、用户名
3. 选择认证方式（私钥 / 密码）
4. 确认远程路径：
   - Nginx 配置路径：`/usr/local/nginx/conf/nginx.conf`
   - 博客静态文件根目录：`/var/www/blog`
5. 测试连接并保存

配置持久化在本地（通过 [conf](https://github.com/sindresorhus/conf)），无需每次输入。

## 部署流程

以 `deploy` 为例，完整流程：

1. **本地构建** — 在 `nextjs/` 或 `vuepress/` 目录执行 `npm run build`
2. **压缩产物** — 将构建输出目录打包为 zip
3. **SSH 上传** — 通过 SFTP 上传 zip 到服务器 `/tmp/`
4. **归档旧版本** — 将服务器当前版本备份到 `/data/deploy/blog-archives/<项目>/<tag>/`
5. **远程解压** — 清空目标目录，解压 zip
6. **记录版本** — 写入 `/data/deploy/blog-versions.json`

### 项目与远程路径对应

| 项目 | 本地目录 | 远程路径 | 构建产物 |
|------|----------|----------|----------|
| nextjs | `nextjs/` | `/var/www/blog/` | `nextjs/out/` |
| vuepress | `vuepress/` | `/var/www/blog/archive/` | `vuepress/docs/.vuepress/dist/` |

## Nginx 同步

将本地 `nginx/nginx.conf` 上传到服务器 `/usr/local/nginx/conf/nginx.conf`：

1. 备份远程配置
2. 上传新配置
3. 执行 `nginx -t` 验证
4. 执行 `nginx -s reload` 重载

如果验证失败，不会重载，避免服务中断。

## 版本管理

每次部署自动归档旧版本，保留最近 5 个。查看历史：

```bash
node bin/bops.js versions
```

## 项目结构

```
blog-ops/
├── bin/bops.js              # CLI 入口
├── src/
│   ├── types.ts             # 类型定义
│   ├── ssh.ts               # SSH 连接与文件传输
│   ├── config.ts            # 交互式配置管理
│   ├── nginx-sync.ts        # Nginx 配置同步
│   ├── blog-deploy.ts       # 博客构建与部署
│   ├── version-manager.ts   # 远程版本管理
│   └── index.ts             # CLI 入口与交互菜单
├── package.json
└── tsconfig.json
```

## 环境要求

- Node.js >= 18
- 远程服务器已安装 nginx 和 unzip（工具会自动尝试安装 unzip）
