#!/bin/bash
docker run --rm -v /workspace/blog:/app -w /app node:18 sh -c 'npm install --registry=https://registry.npmmirror.com && npm run build'

# 复制文件到www目录（防止构建期间访问出错，注意Nginx的配置目录为www目录）
if [ ! -d /var/www/blog ];then
  mkdir -p /var/www/blog
fi
#cp -rfu /workspace/blog/docs/.vuepress/dist/* /var/www/blog
rsync -av --delete /workspace/blog/docs/.vuepress/dist/ /var/www/blog/
