# Vaultwarden

自建 Bitwarden 兼容服务端，数据目录 SQLite，经 Nginx 反代到 `https://vault.xuanyuanli.cn`。

## 前置

1. DNS：`vault.xuanyuanli.cn` A 记录指向博客服务器
2. 服务器磁盘建议空闲 ≥ 5G（可先 `docker image prune` / `docker builder prune`）
3. 已配置 bops SSH（`blog-ops`）

## 本地准备

```bash
cd vaultwarden
cp .env.example .env
# 编辑 .env：生成 ADMIN_TOKEN
#   openssl rand -base64 48
```

`ADMIN_TOKEN` 与 `.env` 不要提交 git。

## 部署

```bash
cd blog-ops
npm run build
node bin/bops.js nginx   # 同步 vault 反代
node bin/bops.js vault   # 上传 compose/.env 并 docker compose up
```

远程目录：`/data/apps/vaultwarden/`  
容器：`vaultwarden`，仅监听 `127.0.0.1:8222`。

日志：

```bash
docker logs -f vaultwarden
```

## 首次使用

1. 打开 https://vault.xuanyuanli.cn ，注册第一个账号（主密码无法找回，务必牢记）
2. 将本地 `.env` 中 `SIGNUPS_ALLOWED=false`，再执行 `node bin/bops.js vault`
3. 管理页：https://vault.xuanyuanli.cn/admin （填 `ADMIN_TOKEN`）
4. 官方 Bitwarden 客户端 → 自托管 → 服务器 URL：`https://vault.xuanyuanli.cn`

## 备份

升级镜像或定期备份宿主机：

```text
/data/apps/vaultwarden/data/
```

至少保留 `db.sqlite3`（及同目录相关文件）。

## 升级镜像

1. 备份 `data/`
2. 修改 `docker-compose.yml` 中的 image tag
3. `node bin/bops.js vault`
