FROM node:20-alpine

ENV TZ=Asia/Shanghai
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm install --omit=dev --no-audit --no-fund --registry=https://registry.npmmirror.com

COPY dist ./dist

# state.json 持久化目录，运行时挂载宿主机目录
ENV WEEKLY_ROTATION_DIR=/data
VOLUME /data

CMD ["node", "dist/cli.js", "daemon"]
