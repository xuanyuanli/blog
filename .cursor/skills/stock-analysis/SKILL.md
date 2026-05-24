---
name: stock-analysis
description: 按 stock-pricing-patterns 三层两时钟框架分析 A 股/港股/美股，抓取实时行情与财务数据并输出到 stock/data/{代码}-{简称}.md。在用户提到分析股票、个股定价、估值框架、公司名（如贵州茅台）、股票代码，或引用 stock-pricing-patterns.html 时使用。
---

# 股票定价框架分析

基于仓库内 [stock/stock-pricing-patterns.html](../../stock/stock-pricing-patterns.html) 的「宏观 → 公司 → 市场」三层框架与四种定价范式，对单只或多只股票生成结构化 Markdown 报告。

## 前置条件

```bash
pip install -r .cursor/skills/stock-analysis/requirements.txt
```

依赖：`akshare`（财务/北向/宏观）、`requests`、`yfinance`（美股）。脚本会自动禁用失效的系统代理。

## 工作流

对每只请求的股票，**按顺序**执行：

```
Task Progress:
- [ ] 1. 抓取实时数据（必须运行脚本，禁止凭记忆填数）
- [ ] 2. 按 reference.md 模板撰写分析
- [ ] 3. 写入 stock/data/{代码}-{简称}.md
- [ ] 4. 多股时重复 1–3，每股一文件
```

### 1. 抓取数据

```bash
python .cursor/skills/stock-analysis/scripts/fetch_stock.py {代码或公司名} --market-context --pretty
```

**输入格式**

| 类型 | 示例 |
|------|------|
| A 股代码 | `600519`、`000001` |
| A 股公司名 | `贵州茅台`、`比亚迪`、`宁德时代` |
| 港股代码/名称 | `00700`、`腾讯控股` |
| 美股代码/名称 | `AAPL`、`Apple`、`微软` |

公司名通过东方财富搜索 API 解析为代码。**名称歧义**时（如「平安」可能对应平安银行、中国平安等），脚本会报错并列出候选；可加 `--best-match` 自动选取最相关的一条（A 股主板优先）。

```bash
# 公司名
python .cursor/skills/stock-analysis/scripts/fetch_stock.py 贵州茅台 --market-context --pretty

# 歧义名称：先看候选，或强制取最佳匹配
python .cursor/skills/stock-analysis/scripts/fetch_stock.py 平安 --best-match --pretty
```

**代码格式（与上表等价）**

**数据源（实时优先，自动降级）**

| 数据 | 主源 | 备用 |
|------|------|------|
| A 股行情 | 新浪财经 | 东方财富 |
| K 线 / 区间收益 | 东方财富 | 腾讯财经 |
| 财务指标 | 新浪财经（AKShare） | — |
| 北向持股 | 东方财富（AKShare） | — |
| 宏观（10Y 国债、上证） | AKShare | — |
| 美股 | Yahoo Finance | — |

若某字段抓取失败，在报告中标注「数据不可用」及原因，**不得编造**。

### 2. 撰写分析

读取 [reference.md](reference.md) 中的报告模板，将 JSON 数据映射到各节：

- **第 1–2 节**：四范式快照（内在价值 / 相对估值 / 供需资金 / 行为情绪）
- **第 3 节**：宏观层 — 用 `market_context` 的利率、上证、成交额
- **第 4–5 节**：基本面 + 相对估值 — 用 `financials`、`quote` 的 P/E、P/B
- **第 6 节**：市场结构 — 用 `kline.stats`、北向、换手率
- **第 7 节**：判定风格类型（价值/成长/周期/防御），套用权重矩阵
- **第 8 节**：检查清单 + 证伪条件
- **第 9 节**：风险与误区

**分析原则**（来自框架原文）：

1. 基本面定**价值锚**，估值倍数定**贵不贵**，资金与情绪定**短期偏离**
2. 先**定时钟**（日～周 vs 季～年），再**定类型**，选对 P/E 或 P/B 或景气指标
3. DCF/绝对估值只给**区间**，不追求精确小数
4. 结尾必须含**免责声明**（非投资建议）

### 3. 输出路径

```
stock/data/{代码}-{简称}.md
```

- 简称取自 `quote.name`，去除 `/\:*?"<>|` 等非法字符
- 示例：`stock/data/600519-贵州茅台.md`
- 若 `stock/data/` 不存在则创建

### 4. 多股批量

```bash
python .cursor/skills/stock-analysis/scripts/fetch_stock.py 600519 000858 00700 AAPL --market-context --pretty
```

一次抓取、分别写文件。可在摘要中交叉对比同行业股票，但**每股独立成文**。

## 质量检查

交付前确认：

- [ ] 报告中的价格、涨跌幅、PE、ROE 等与 JSON 一致
- [ ] `data_fetched_at` 与脚本输出时间一致
- [ ] 缺失数据已标明，无臆测数值
- [ ] 含框架链接与免责声明
- [ ] 文件位于 `stock/data/` 且命名正确

## 附加资源

- 报告模板：[reference.md](reference.md)
- 定价框架原文：[stock/stock-pricing-patterns.html](../../stock/stock-pricing-patterns.html)
- 数据脚本：[scripts/fetch_stock.py](scripts/fetch_stock.py)
