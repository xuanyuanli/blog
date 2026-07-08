# weekly-rotation

ETF 周线轮动策略：每周最后一个交易日 14:30（上海时间）对比标的池近 4 个交易周的累计涨幅，取最高者——为正则持有它，为负则全部空仓，直到下一次轮动。持仓状态持久化到 `state.json`，决策结果通过 Server酱 推送。

## 标的池

| 标的 | 代码 |
| --- | --- |
| 沪深300ETF | `SH510300` |
| 创业板50ETF | `SZ159949` |
| 科创芯片ETF | `SH588170` |
| 通信ETF | `SH515880` |

## 策略规则

- 每 1 周的周五 14:30 轮动；若周五非交易日，则本周最后一个交易日轮动；若整周无交易日，顺延至下一周。
- 近 4 周累计涨幅 = 当前价 / 倒数第 4 个已完结周的收盘价 - 1。
- 涨幅最高者为正回报 → 持有它；为负回报 → 空仓至下次轮动。

## 用法

```bash
npm install
npm run build

# 常驻调度（服务器上由 systemd 拉起）
node dist/cli.js daemon

# 立即执行一次（--dry-run 只计算打印，不发通知、不写状态）
node dist/cli.js once --dry-run

# 回测：枚举 2/3/4 标的的全部组合（共 11 个），按累计收益排名找最优
node dist/cli.js backtest
node dist/cli.js backtest --start 2024-07-08            # 只测近两年
node dist/cli.js backtest --start 2024-07-08 --end 2026-07-01
```

回测口径：以周收盘价近似周五 14:30 执行价，逐周复利，不计费率与滑点；不指定 `--start` 时每个组合的起点取组合内最晚成立 ETF 的上市周（各组合区间不同，跨组合对比时建议用 `--start` 统一起点）。指标含累计收益、年化、最大回撤、换仓次数、空仓周数，并输出各标的同期买入持有收益作基准。

## 运行时配置

数据目录（`--data-dir`，或环境变量 `WEEKLY_ROTATION_DIR`，默认当前目录）下：

- `config.json`：运行时配置，含 `serverChanSendKey`（Server酱 SendKey，支持 Turbo 与 Server酱3），由 `bops rotation` 部署时写入服务器，不入库。
- `state.json`：当前持仓与轮动历史，由程序维护。

```json
{
  "serverChanSendKey": "SCTxxxxxxxx"
}
```

## 部署

由仓库的 `blog-ops` 部署：

```bash
node blog-ops/bin/bops.js rotation
```

流程：本地构建 → 上传 `dist/` + `package.json` 等到服务器 `/data/apps/weekly-rotation/` → 远程 `npm install --omit=dev` → 安装/更新 systemd 服务 `weekly-rotation` 并重启。日志见服务器 `/data/apps/weekly-rotation/weekly-rotation.log`。

## 测试

```bash
npm test
```
