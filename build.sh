#!/bin/bash

# 构建 Next.js 新站
docker run --rm -v /workspace/blog:/app -w /app/nextjs docker.1ms.run/node:20 sh -c \
  'npm install --registry=https://registry.npmmirror.com && npm run build'

# 构建 VuePress 旧博客（可选，仅在内容变更时执行）
# docker run --rm -v /workspace/blog:/app -w /app/vuepress docker.1ms.run/node:20 sh -c \
#   'npm install --registry=https://registry.npmmirror.com && npm run build'

# 部署新站
if [ ! -d /var/www/blog ];then
  mkdir -p /var/www/blog
fi
rsync -av --delete /workspace/blog/nextjs/out/ /var/www/blog/

# 部署旧博客到 /archive/ 子路径（可选）
# mkdir -p /var/www/blog/archive
# rsync -av --delete /workspace/blog/vuepress/docs/.vuepress/dist/ /var/www/blog/archive/
