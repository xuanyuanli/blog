# 个人博客

在线访问：[https://xuanyuanli.cn](https://xuanyuanli.cn)

## 仓库结构

```
.
├── nextjs/          # 新站（Next.js）
├── vuepress/        # 旧博客（VuePress）
├── nginx/           # Nginx 配置
└── build.sh         # 构建脚本
```

## 子项目

### nextjs

基于 [Next.js](https://nextjs.org) 构建的新版博客。

```bash
cd nextjs
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
