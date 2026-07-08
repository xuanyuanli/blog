# AGENTS.md

本文件为 AI 编码代理在本仓库中工作时提供上下文和约定。仓库是个人博客项目，线上访问地址为 <https://xuanyuanli.cn>。

## 项目概览

这是一个多子项目博客仓库：

```text
.
├── astro/           # 新站，Astro + React + Tailwind CSS
├── vuepress/        # 旧博客，VuePress + vdoing 主题，历史技术文章归档
├── stock/           # 股票研究 VitePress 站点，部署到 stock.xuanyuanli.cn
├── stock-cli/       # A 股尾随止损 CLI（波动分级、止损线）
├── weekly-rotation/ # ETF 周线轮动策略常驻服务（含回测），部署为 systemd 服务
├── nginx/           # Nginx 配置
├── blog-ops/        # 博客运维 CLI
├── agents/          # Cursor CLI 调研编排（如 ai-bubble-playbook）
└── build.sh         # 服务器侧构建部署脚本
```

新站负责当前个人品牌页和 AI 编程相关内容；旧站保存大量历史技术文章，并通常部署到归档路径。

## 通用工作规则

- 主要内容语言为中文，除代码、命令和专有名词外，优先使用简体中文。
- 修改文章时，短代码、命令、关键字和 API 名称使用反引号包裹。
- VuePress 旧文章末尾通常保留 `**祝你变得更强!**`。
- 不要随意移动历史文章目录。VuePress 依赖目录结构、数字前缀和 frontmatter 生成导航与分类。
- 不要提交或写入服务器密码、私钥、Token 等敏感信息。部署工具的连接配置由本地 `conf` 持久化管理。
- 跨子项目改动时分别在对应目录安装依赖、运行命令，不要假设根目录存在统一的 npm 工作区。

## Astro 新站

目录：`astro/`

技术栈：

- Astro 5
- React 19
- TypeScript
- Tailwind CSS
- Framer Motion

常用命令：

```bash
cd astro
npm install
npm run dev
npm run build
npm run preview
```

关键目录：

- `src/pages/`：页面路由。
- `src/components/`：React 展示组件。
- `src/layouts/`：Astro 布局。
- `src/styles/globals.css`：全局样式。
- `src/content/thoughts/`：思考文章内容集合。
- `src/content/config.ts`：内容集合 schema。
- `src/content/site.ts`：个人信息、导航、核心观点和案例配置。

内容约定：

- `thoughts` 文章需要包含 frontmatter：`title`、`date`、`excerpt`，可选 `path`。
- 站点身份信息集中在 `src/content/site.ts`，修改姓名、标语、联系方式、导航或首页文案时优先检查这里。
- 新增页面或组件时遵循现有 Astro 页面 + React 组件的分工，避免把全站配置散落到组件内部。

## VuePress 旧博客

目录：`vuepress/`

技术栈：

- VuePress 1.9.10
- vuepress-theme-vdoing
- Node.js 18.x 到 20.x

常用命令：

```bash
cd vuepress
npm install
npm run dev
npm run build
```

其他脚本：

```bash
npm run editFm
npm run baiduPush
npm run deploy
```

关键目录：

- `docs/01.后端/`：Java、Spring、JVM、企业应用等后端文章。
- `docs/02.前端/`：JavaScript、TypeScript、Node.js、浏览器和 Web API 等前端文章。
- `docs/03.架构/`：架构设计、分布式系统、安全、中间件、AI 等文章。
- `docs/00.目录页/`：目录聚合页。
- `docs/.vuepress/`：VuePress 配置、主题扩展、静态资源和样式。
- `utils/`：frontmatter 编辑、百度推送、FTP 同步等脚本。
- `project/spring-jdk17-demo/`：Java 17 / Spring Boot 示例项目。

内容约定：

- 文章文件和目录大量使用数字前缀控制排序，新增或重命名时要保持当前命名风格。
- Markdown frontmatter 会影响分类、归档、导航和 SEO，批量修改前优先查看相邻文章格式。
- 优化文章时，保持作者原有中文表达风格，不要把文章改成生硬的模板化说明。

## Stock 股票研究站点

目录：`stock/`

技术栈：

- VitePress 1.x
- Node.js >= 18

常用命令：

```bash
cd stock
npm install
npm run dev
npm run build
npm run preview
```

关键目录：

- `data/{代码}-{简称}/`：个股报告目录，含 `index.md` 概览页与 `{YYYY-MM-DD}.md` 各期报告。
- `data/index.md`：全站报告总览表。
- `public/`：框架 HTML（stock-pricing-patterns、h200-industry-chain 等）。
- `.vitepress/config.ts`：站点配置，`base: '/'`（独立子域名 stock.xuanyuanli.cn）。

内容约定：

- 报告由 `.cursor/skills/stock-analysis/` skill 生成，输出到 `data/{代码}-{简称}/{YYYY-MM-DD}.md`。
- 同股同日重复分析覆盖当日文件；禁止覆盖历史日期文件。
- 每次写报告后同步更新该股的 `index.md`。
- A 股报告生成时会调用根目录 `stock-cli/`（`node stock-cli/dist/cli.js {代码} --json`），将尾随止损判断写入报告 10.5 节。

部署：`node bin/bops.js stock`（远程 `/var/www/stock/`，线上 https://stock.xuanyuanli.cn）。

## stock-cli 尾随止损工具

目录：`stock-cli/`

用途：A 股尾随止损 CLI — 根据近 6 月波动给出建议回撤阈值、当前止损线、触发状态与执行纪律。仅支持沪深北 A 股。

常用命令：

```bash
cd stock-cli
npm install
npm run build
node dist/cli.js 688120 --json
npm test
```

与 stock-analysis 集成：生成 A 股报告前运行 `node stock-cli/dist/cli.js {代码} --json`，将 JSON 中的止损线、波动分级等写入报告。

## weekly-rotation 周线轮动服务

目录：`weekly-rotation/`

用途：ETF 周线轮动策略常驻服务 — 每周最后一个交易日 14:30（上海时间）对比标的池（沪深300ETF/创业板50ETF/科创芯片ETF/通信ETF）近 4 个交易周累计涨幅，取最高者，为正则持有、为负则空仓；决策经 Server酱 推送，持仓状态写 `state.json`。内置回测，可枚举 2/3/4 标的全部组合找最优。

技术栈：TypeScript（CJS + strict）、`stock-api`（行情与前复权周K）、`chinese-days`（节假日）。

常用命令：

```bash
cd weekly-rotation
npm install
npm run build
node dist/cli.js once --dry-run       # 立即计算一次，不发通知不写状态
node dist/cli.js backtest             # 全组合回测
node dist/cli.js backtest --start 2024-07-08
npm test
```

部署：`node blog-ops/bin/bops.js rotation` — 上传到远程 `/data/apps/weekly-rotation/`，`npm install --omit=dev`，写 `config.json`（Server酱 SendKey，来自 bops 本地 conf），安装并重启 systemd 服务 `weekly-rotation`。远程日志：`/data/apps/weekly-rotation/weekly-rotation.log`。

## blog-ops 运维工具

目录：`blog-ops/`

用途：本地构建、SSH 上传、Nginx 配置同步和远程版本管理。

常用命令：

```bash
cd blog-ops
npm install
npm run build
npm run start
```

CLI 用法：

```bash
node bin/bops.js
node bin/bops.js new
node bin/bops.js old
node bin/bops.js stock
node bin/bops.js stock --skip-build
node bin/bops.js new --skip-build
node bin/bops.js rotation
node bin/bops.js rotation --skip-build
node bin/bops.js nginx
node bin/bops.js versions
```

部署工具会把旧版本归档到远程服务器，并记录版本历史。修改部署逻辑时重点检查：

- `src/blog-deploy.ts`
- `src/rotation-deploy.ts`
- `src/nginx-sync.ts`
- `src/ssh.ts`
- `src/version-manager.ts`
- `src/config.ts`

## Nginx 与部署

Nginx 配置位于 `nginx/nginx.conf`。

服务器侧脚本：

```bash
bash build.sh
bash build.sh --with-archive
```

`build.sh` 默认只构建并部署 Astro 新站；传入 `--with-archive` 或 `-a` 时会同时构建 VuePress 旧博客并部署到归档路径。

注意：`build.sh` 和 `blog-ops` 都能部署博客，但实现方式和远程路径约定可能不同。修改部署相关代码前，需要同时检查脚本、运维工具和 Nginx 配置，避免线上路径不一致。

## 验证建议

- 修改 `astro/` 后，至少运行 `npm run build`。
- 修改 `vuepress/` 后，至少运行 `npm run build`。
- 修改 `stock/` 后，至少运行 `npm run build`。
- 修改 `stock-cli/` 后，运行 `npm run build` 与 `npm test`。
- 修改 `weekly-rotation/` 后，运行 `npm run build` 与 `npm test`，必要时用 `node dist/cli.js once --dry-run` 验证。
- 修改 `blog-ops/` 后，运行 `npm run build`。
- 修改 Nginx 配置后，部署前应执行 `nginx -t`，`blog-ops` 的同步流程会在远程验证后再 reload。

## DOCX 文档（Word）

处理 `tmp/` 或其它目录下的 `.docx` 时，使用仓库封装工具（依赖 Claude docx skill 的 `scripts/office`）：

```bash
python scripts/docx/docx.py setup
python scripts/docx/docx.py read path/to/file.docx
python scripts/docx/docx.py unpack path/to/file.docx path/to/unpacked/
```

需已安装 **pandoc**（`winget install JohnMacFarlane.Pandoc`）与 Python 包（`setup` 子命令）。详见 `scripts/docx/README.md`。

## 常见任务入口

- 修改首页展示、个人信息、AI 编程观点：优先查看 `astro/src/content/site.ts` 和 `astro/src/components/`。
- 新增思考文章：放在 `astro/src/content/thoughts/`，并补齐 frontmatter。
- 修改历史技术文章：在 `vuepress/docs/` 下按分类查找，保持相邻文件格式。
- 调整旧博客主题或插件：查看 `vuepress/docs/.vuepress/`。
- 新增/更新股票分析报告：使用 `.cursor/skills/stock-analysis/`，输出到 `stock/data/`。
- AI 算力主线 + 成交额 Top200 + 右侧技术筛选：使用 `.cursor/skills/ai-right-side-screen/`；结果持久化在 `data/ai-pool.json`、`data/exclude-codes.txt`。
- 调整 AI 泡沫预警实操报告：`.cursor/skills/ai-bubble-playbook/`，Git Bash 运行 `agents/ai-bubble-playbook/scripts/orchestrate.sh`，HTML 输出 `stock/public/ai-bubble-playbook.html`。
- 调整 ETF 周线轮动策略或回测：查看 `weekly-rotation/src/`（策略参数在 `config.ts`，回测在 `backtest.ts`），部署用 `bops rotation`。
- 调整部署流程：查看 `build.sh`、`blog-ops/` 和 `nginx/nginx.conf`。
