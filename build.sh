#!/bin/bash
docker run --rm -v /workspace/blog:/app -w /app node:16 sh -c 'npm install --registry=https://registry.npm.taobao.org && npm run build'

# 复制文件到www目录（防止构建期间访问出错，注意Nginx的配置目录为www目录）
if [ ! -d /var/www/blog ];then
  mkdir -p /var/www/blog
fi
#cp -rfu /workspace/blog/docs/.vuepress/dist/* /var/www/blog
rsync -av --delete --ignore-existing /workspace/blog/docs/.vuepress/dist/ /var/www/blog/
