# 个人博客

在线访问：[https://xuanyuanli.cn](https://xuanyuanli.cn)

## 仓库结构

```
.
├── astro/           # 新站（Astro）
├── vuepress/        # 旧博客（VuePress）
├── nginx/           # Nginx 配置
├── blog-ops/        # 运维工具
└── build.sh         # 构建脚本
```

## 子项目

### astro

基于 [Astro](https://astro.build) + React 构建的新版博客。

```bash
cd astro
npm install
npm run dev        # 本地开发
npm run build      # 生产构建
```

### vuepress

基于 [VuePress](https://vuepress.vuejs.org) + [vdoing 主题](https://github.com/xugaoyi/vuepress-theme-vdoing) 构建的旧版博客，存放历史技术文章。

```bash
cd vuepress
npm install
npm run dev        # 本地开发
npm run build      # 生产构建
```

## 构建部署

```bash
bash build.sh
```

或使用运维工具：

```bash
cd blog-ops
node bin/bops.js
```
