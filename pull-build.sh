!#/bin/bash
set -e

cd /workspace/blog
git pull
docker run --rm -v /workspace/blog:/app -w /app node:16 sh -c 'npm install --registry=https://registry.npm.taobao.org && npm run build'
