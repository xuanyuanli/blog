#!/bin/bash

# 用法: bash build.sh [-a|--with-archive]
#   无参数           仅构建并部署新站
#   -a, --with-archive 同时构建并部署旧博客到 /archive/ 子路径

WITH_ARCHIVE=false
for arg in "$@"; do
    case $arg in
        -a|--with-archive) WITH_ARCHIVE=true ;;
    esac
done

# 构建 Next.js 新站
docker run --rm -v /workspace/blog:/app -w /app/nextjs docker.1ms.run/node:20 sh -c \
  'npm install --registry=https://registry.npmmirror.com && npm run build'

# 构建旧博客（可选）
if [ "$WITH_ARCHIVE" = true ]; then
    echo "==> 构建 VuePress 旧博客..."
    docker run --rm -v /workspace/blog:/app -w /app/vuepress docker.1ms.run/node:20 sh -c \
      'npm install --registry=https://registry.npmmirror.com && npm run build'
fi

# 部署新站
if [ ! -d /var/www/blog ];then
  mkdir -p /var/www/blog
fi
rsync -av --delete /workspace/blog/nextjs/out/ /var/www/blog/

# 部署旧博客到 /archive/ 子路径（可选）
if [ "$WITH_ARCHIVE" = true ]; then
    echo "==> 部署旧博客到 /archive/..."
    mkdir -p /var/www/blog/archive
    rsync -av --delete /workspace/blog/vuepress/docs/.vuepress/dist/ /var/www/blog/archive/
fi
