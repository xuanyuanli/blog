# weekly-rotation

ETF 周线轮动策略：每周最后一个交易日 14:30（上海时间）对比标的池近 4 个交易周的累计涨幅，取最高者——为正则持有它，为负则全部空仓，直到下一次轮动。持仓状态持久化到 `state.json`，决策结果通过 Server酱 推送。

## 标的池

| 标的 | 代码 |
| --- | --- |
| 沪深300ETF | `SH510300` |
| 创业板50ETF | `SZ159949` |

实盘（daemon / once）与回测默认都只用这两只。池子收窄是为了降低赛道品种带来的换仓噪声和回撤，窗口也能从创业板50上市（约 2016）开始对齐。

## 策略规则

- 每 1 周的周五 14:30 轮动；若周五非交易日，则本周最后一个交易日轮动；若整周无交易日，顺延至下一周。
- 近 4 周累计涨幅 = 当前价 / 倒数第 4 个已完结周的收盘价 - 1。
- 涨幅最高者为正回报 → 持有它；为负回报 → 空仓至下次轮动。

## 用法

```bash
npm install
npm run build

# 常驻调度（服务器上由 Docker 拉起）
node dist/cli.js daemon

# 立即执行一次（--dry-run 只计算打印，不发通知、不写状态）
node dist/cli.js once --dry-run

# 回测当前标的池
node dist/cli.js backtest
node dist/cli.js backtest --start 2024-07-08            # 指定起点
node dist/cli.js backtest --end 2024-12-31              # 截到 2024 年底
```

回测口径：以周收盘价近似周五 14:30 执行价，逐周复利，不计费率与滑点；不指定 `--start` 时起点取池内最晚成立 ETF 的上市周（创业板50ETF，约 2016-08）。指标含累计收益、年化、最大回撤、换仓次数、空仓周数，并输出各标的同期买入持有收益作基准。

参考结果（截至 2026-08-14）：

| 区间 | 周数 | 累计收益 | 年化 | 最大回撤 |
| --- | --- | --- | --- | --- |
| 2016-08-19 ~ 2024-12-27 | 426 | +325.75% | 19.34% | 25.65% |
| 2016-08-19 ~ 2026-08-14 | 510 | +422.09% | 18.35% | 25.65% |

> 备注：曾测试过更多赛道 ETF、以及「持有期内收盘跌破日线均线即卖出」的增强模式。赛道池在短窗口里收益很高但回撤更深、近端偏差大；均线增强（MA5/MA10/MA20）在长窗口全部跑输基础策略。故实盘只保留沪深300+创业板50。

## 运行时配置

- 通知密钥从环境变量 `SERVERCHAN_SENDKEY` 读取（Server酱 SendKey，支持 Turbo 与 Server酱3），未设置则跳过通知。部署时 `bops rotation` 按优先级注入容器：服务器环境变量 `SERVERCHAN_SENDKEY` > bops 本地 conf（写远程 `.env`）。本地调试直接设置环境变量即可。
- `state.json`：当前持仓与轮动历史，由程序维护，位于数据目录（`--data-dir`，或环境变量 `WEEKLY_ROTATION_DIR`，默认当前目录）。容器内为 `/data`，挂载自宿主机 `/data/apps/weekly-rotation/data/`。

```bash
# 本地带通知运行示例（PowerShell: $env:SERVERCHAN_SENDKEY="SCTxxxx"）
SERVERCHAN_SENDKEY=SCTxxxx node dist/cli.js once
```

## 部署

由仓库的 `blog-ops` 以 Docker 方式部署（远程无需 Node 环境，需已安装 Docker）：

```bash
node blog-ops/bin/bops.js rotation
```

流程：本地构建 → 上传 `dist/` + `package.json` + `Dockerfile` 到服务器 `/data/apps/weekly-rotation/` → 远程 `docker build` → 重建容器 `weekly-rotation`（`--restart unless-stopped`，`.env` 注入环境变量，`data/` 挂载为 `/data` 持久化 `state.json`）。

若服务器上已有旧 `state.json` 且持仓是已移除的标的（如科创芯片ETF），下次轮动会按「旧持仓 → 新池决策」记一次换仓/清仓，属预期行为。

服务器上常用命令：

```bash
docker logs -f weekly-rotation      # 查看日志
docker restart weekly-rotation      # 重启
cat /data/apps/weekly-rotation/data/state.json   # 查看持仓状态
```

## 测试

```bash
npm test
```
