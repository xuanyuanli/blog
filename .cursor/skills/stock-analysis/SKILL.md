---
name: stock-analysis
description: 按 stock-pricing-patterns 框架分析 A/H/美股，抓取实时数据，输出含投资评级与操作建议的报告到 stock/data/{代码}-{简称}/{YYYY-MM-DD}.md。触发词：分析股票、公司名、估值、买入卖出、688120 等。
---

# 股票定价框架分析

基于仓库内 [stock/stock-pricing-patterns.html](../../stock/public/stock-pricing-patterns.html) 的「宏观 → 公司 → 市场」三层框架与四种定价范式，对单只或多只股票生成结构化 Markdown 报告。

## 前置条件

```bash
pip install -r .cursor/skills/stock-analysis/requirements.txt
```

依赖：`akshare`（财务/北向/宏观）、`requests`、`yfinance`（美股）。脚本会自动禁用失效的系统代理。

## 工作流

```
Task Progress:
- [ ] 1. 抓取实时数据（必须运行脚本，禁止凭记忆填数）
- [ ] 2. 检查 data_quality.warnings，必要时搜索补事件/校验
- [ ] 5. **撰写「投资建议」专节**（评级、仓位、买卖点、监控指标）
- [ ] 6. 写入 stock/data/{代码}-{简称}/{YYYY-MM-DD}.md（同股同日覆盖）
- [ ] 7. 更新 stock/data/{代码}-{简称}/index.md（最新摘要 + 历史列表）
- [ ] 8. 新股票时更新 stock/data/index.md 总览表
- [ ] 9. 多股时重复 1–8
```

### 1. 抓取数据

```bash
python .cursor/skills/stock-analysis/scripts/fetch_stock.py {代码或公司名} --market-context --pretty
```

**输入格式**

| 类型 | 示例 |
|------|------|
| A 股代码 | `600519`、`000001` |
| A 股公司名 | `贵州茅台`、`比亚迪`、`华海清科` |
| 港股代码/名称 | `00700`、`腾讯控股` |
| 美股代码/名称 | `AAPL`、`Apple`、`微软` |

**数据源（实时优先，自动降级）**

| 数据 | 主源 | 备用 |
|------|------|------|
| A 股行情 | 新浪财经 | 东方财富 |
| 估值 PE/PB | 东方财富 | 腾讯财经 → 财报推算 |
| K 线 / 区间收益 | 东方财富 | 腾讯财经 |
| 财务指标 | 新浪财经（AKShare） | — |
| 北向持股 | AKShare | —（过期则标 stale） |
| 宏观（10Y 国债、上证） | AKShare | 新浪指数 |
| 公司概况 | 东方财富 | F10 页面 API |
| 美股 | Yahoo Finance | — |

脚本输出含 **`data_quality`**（`fields` 新鲜度 + `warnings`），撰写报告时必须逐条检查。

#### 数据质量与降级

| 现象 | 根因 | 脚本处理 |
|------|------|----------|
| `eastmoney: Connection aborted` | 代理干扰 + push2 不稳定 | 新浪行情 + 腾讯估值 + 财报推算 |
| 北向停在 2024 年 | AKShare 源未更新 | `freshness: stale`，勿当实时资金 |
| 腾讯 K 线无换手 | 备用源字段不全 | 换手率写 null，勿写 0% |
| profile 失败 | 东财超时 | 改走 F10 API |

#### 搜索工具二次校验（推荐）

**可行，但分工要明确：**

| 适合搜索 | 不适合搜索 |
|----------|------------|
| 公告、业绩预告、政策 | 实时股价、涨跌幅 |
| 行业景气、订单新闻 | 精确 P/E、北向日持股 |
| 宏观近期表态 | 财务原始数值 |

流程：脚本抓取 → 读 `data_quality.warnings` → 有 stale/missing 则搜索 `{公司名} 最新公告/北向/财报` → 仅补充事件日历与证伪条件 → **禁止**用搜索 snippets 替代价格/PE 数字。

### 2. 撰写分析与投资建议

读取 [reference.md](reference.md)，将 JSON 映射到各节。**必须包含第 10 节「投资建议」**，给出明确评级（买入/增持/持有/观望/减仓/回避）、仓位区间、关注/止损价位。

**评级参考（综合基本面 40% + 估值 30% + 趋势 20% + 宏观 10%）**

| 评级 | 典型条件 |
|------|----------|
| 买入/增持 | 好生意 + 估值合理或便宜 + 趋势/政策顺风 |
| 持有 | 基本面尚可，估值略贵但逻辑未破坏 |
| 观望 | 故事好但估值贵/趋势过热，或数据待验证 |
| 减仓/回避 | 估值极端 + 盈利恶化，或逻辑证伪 |

分析原则：基本面定价值锚、倍数定贵否、资金定短期偏离；必须含免责声明（非个性化投顾）。

### 3. 输出路径

| 文件 | 路径 | 规则 |
|------|------|------|
| 报告 | `stock/data/{代码}-{简称}/{YYYY-MM-DD}.md` | 日期取自 `data_fetched_at` 本地日期，与 frontmatter `date` 一致 |
| 股票概览 | `stock/data/{代码}-{简称}/index.md` | 每次写报告后同步更新 |
| 全站总览 | `stock/data/index.md` | 新股票首次分析时更新 |

简称取自 `quote.name`，去掉非法文件名字符。**同股同日重复分析覆盖当日文件**；禁止覆盖或删除历史日期文件。

部署后在线 URL：

- 概览页：`/stock/data/{代码}-{简称}/`
- 某期报告：`/stock/data/{代码}-{简称}/{YYYY-MM-DD}.html`

本地预览：`cd stock && npm run dev` → `http://localhost:5173/stock/`

### 4. 多股批量

```bash
python .cursor/skills/stock-analysis/scripts/fetch_stock.py 600519 华海清科 AAPL --market-context --pretty
```

## 质量检查

- [ ] 价格、PE、ROE 与 JSON 一致
- [ ] `data_quality.warnings` 已反映到报告
- [ ] 过期数据未当实时依据
- [ ] 含**投资评级**与操作建议
- [ ] 含免责声明
- [ ] 已更新股票 `index.md`（及必要时 `data/index.md`）

## 附加资源

- [reference.md](reference.md) · [stock-pricing-patterns.html](../../stock/public/stock-pricing-patterns.html) · [fetch_stock.py](scripts/fetch_stock.py)
