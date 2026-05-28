---
name: stock-analysis
description: 按 stock-pricing-patterns 框架分析 A/H/美股，抓取实时数据，输出含投资评级与操作建议的报告到 stock/data/{代码}-{简称}/{YYYY-MM-DD}.md。触发词：分析股票、公司名、估值、买入卖出、688120 等。
---

# 股票定价框架分析

基于仓库内 [stock-pricing-patterns.html](../../stock/public/stock-pricing-patterns.html) 的「宏观 → 公司 → 市场」三层框架与四种定价范式，对单只或多只股票生成结构化 Markdown 报告。

## 前置条件

```bash
pip install -r .cursor/skills/stock-analysis/requirements.txt
cd stock-cli && npm install && npm run build
```

依赖：`akshare`（财务/北向/宏观）、`requests`、`yfinance`（美股）。脚本会自动禁用失效的系统代理。

`stock-cli`：A 股尾随止损 CLI（波动分级、建议回撤阈值、止损线、触发状态）。生成 A 股报告前须先构建 `stock-cli/dist/`。

## 工作流

```
Task Progress:
- [ ] 1. 抓取实时数据（必须运行脚本，禁止凭记忆填数）
- [ ] 1c. A 股东财增强（mx_enrich，按 data_quality 缺口补数 + mx-search 事件）
- [ ] 1b. A 股运行 stock-cli（--json），记录尾随止损判断
- [ ] 2. 检查 data_quality.warnings，逐条反映到报告
- [ ] 2a. 近期事件检索（必做；A 股优先用 mx-search，WebSearch 补国际/非东财信源）
- [ ] 3. 事件分类 + 映射到四范式 / §10.2 权重
- [ ] 4. 读取 reference.md，撰写各节分析
- [ ] 5. 撰写「投资建议」专节（评级、仓位、买卖点、监控指标、尾随止损）
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

### 1c. 东财增强（A 股必做，港股/美股跳过）

在步骤 1 完成后，对 **A 股** 运行 `mx_enrich.py`，用东财妙想 skill 补 `fetch_stock.py` 缺口并抓取权威资讯。需已配置环境变量 `MX_APIKEY`（[妙想 Skills 页](https://dl.dfcfs.com/m/itc4)）。

```bash
python .cursor/skills/stock-analysis/scripts/fetch_stock.py {代码或公司名} --market-context --pretty > tmp/fetch.json
python .cursor/skills/stock-analysis/scripts/mx_enrich.py --fetch-json tmp/fetch.json --pretty --output tmp/enriched.json
```

或管道一次完成（Linux/macOS；Windows 建议用 `--output` 写文件）：

```bash
python .cursor/skills/stock-analysis/scripts/fetch_stock.py {代码} --market-context --pretty \
  | python .cursor/skills/stock-analysis/scripts/mx_enrich.py --stdin --pretty --output tmp/enriched.json
```

**触发规则（脚本自动判断，无需手选）**

| fetch_stock 缺口 | mx-data 问句方向 |
|------------------|------------------|
| 北向 `stale` / `missing` | `{公司} 北向资金 持股变动` |
| P/E 缺失或由财报推算 | `{公司} 市盈率 市净率 TTM` |
| profile 缺失 | `{公司} 主营业务 所属行业 总股本` |
| A 股默认 | `{公司} 主力资金流向` |

**mx-search（A 股必跑）**：`{公司} 最新公告 业绩预告 研报` → 写入 `mx_enrich.supplement.events`，供 §6.2 事件表使用。

**合并 JSON 使用约定**

| 字段 | 用途 |
|------|------|
| `mx_enrich.triggers` | 报告「数据说明」中列出已补数项 |
| `mx_enrich.supplement.data_tables` | 资金面/北向/股东/估值交叉验证；**不覆盖** `quote` 主数值 |
| `mx_enrich.supplement.events` | §6.2 事件日历；来源标 `mx-search` |
| `mx_enrich.supplement.errors` | 写入报告数据说明；API 113/401 时提示用户检查 Key/配额 |

**纪律**

- 价格、PE、ROE 仍以 `fetch_stock.py` 的 `quote` / `financials` 为准；mx-data 仅补缺口或交叉验证，冲突时在报告注明双源差异。
- mx-search 可替代步骤 2a 的 **A 股公司层** 检索；行业联动、H/US 事件仍可用 WebSearch。
- 默认输出目录：`tmp/mx_output/`（Windows 友好）；原始 xlsx/json 供审计。

#### 数据质量与降级

| 现象 | 根因 | 脚本处理 |
|------|------|----------|
| `eastmoney: Connection aborted` | 代理干扰 + push2 不稳定 | 新浪行情 + 腾讯估值 + 财报推算 |
| 北向停在 2024 年 | AKShare 源未更新 | `freshness: stale`，勿当实时资金 |
| 腾讯 K 线无换手 | 备用源字段不全 | 换手率写 null，勿写 0% |
| profile 失败 | 东财超时 | 改走 F10 API |

### 2a. 近期事件检索（必做）

**与 `data_quality.warnings` 解耦**：即使行情/财务数据 fresh，也必须检索近期事件。`fetch_stock.py` 不抓新闻，本步骤不可跳过。

**A 股**：优先使用步骤 1c 的 `mx_enrich.supplement.events`（来源 `mx-search`）。若为空或需补充，再运行：

```bash
python .cursor/skills/mx-search/mx_search.py "{公司名} 最新公告 业绩预告 研报" tmp/mx_output
```

**必搜（公司层，H/US 或 mx-search 不足时）**

```text
{公司名或代码} {分析日期} 公告 OR 业绩说明会 OR 增持 OR 减持 OR 解禁 OR 产品发布 OR 订单
{公司名} 最新 财报 业绩预告
```

**条件搜（行业/主题层）** — 满足任一即搜：

- 近 1 月涨跌幅 \|r1m\| > 20%，或当日 \|change_pct\| > 5%
- 风格为成长/周期/主题股（半导体、EDA、AI、新能源等）
- 用户对话中已提及行业热点（如产业链龙头动态）

```text
{行业关键词} {分析日期} 政策 OR 龙头 OR 技术发布
```

**分工（禁止越界）**

| 适合 mx-search / 搜索 | 不适合搜索 |
|----------|------------|
| 公告、业绩预告、政策、产品发布 | 实时股价、涨跌幅 |
| 行业景气、订单新闻、旧闻是否重发 | 精确 P/E、北向持股（须 fetch + mx-data） |
| 宏观近期表态 | 财务原始数值（须来自 fetch_stock JSON；mx-data 仅补缺口） |

**事件新鲜度标签**（每条写入 §6.2 表格）

| 标签 | 含义 | 对评级 |
|------|------|--------|
| **新披露** | 首次出现在交易所/法定披露/当日新公告 | 可影响短期情绪；无收入/订单数据时不单独调升评级 |
| **旧闻重发** | 年报/说明会内容被财经媒体再炒 | 写进报告，一般不单独调评级 |
| **行业联动** | 上下游/竞品/政策，未点名本公司 | 仅作赛道叙事验证，不作订单确认 |

**事件→评级硬规则**

- 产品/技术突破 **无** 收入、订单、客户 Signoff 数据 → 只影响趋势/叙事（20%），**不能** 单独把「观望」改为「增持」
- 业绩 miss / 大股东减持 / 逻辑证伪 → 须在 §10.2 体现下调
- 搜索仅补充 §6.2 事件日历、§9 风险、§10.4 监控指标；**禁止** 用 snippets 替代脚本中的价格/PE/财务数字

### 1b. 尾随止损判断（A 股）

在步骤 1 拿到 `quote.code` 后，对 **A 股** 运行：

```bash
node stock-cli/dist/cli.js {代码} --json
```

| 市场 | 处理 |
|------|------|
| A 股 | 必须运行上述命令，解析 JSON |
| 港股 / 美股 | 跳过；报告中标注「尾随止损 CLI 不适用（仅 A 股）」 |

**须写入报告的 JSON 字段**（禁止凭记忆填数）：

| 字段 | 含义 |
|------|------|
| `trailing.triggered` | 是否已触发止损 |
| `trailing.stopLossLine` | 当前止损线（元） |
| `trailing.stageHighClose` | 阶段最高收盘价 |
| `trailing.appliedThresholdPct` | 采用回撤阈值 % |
| `trailing.distanceToStopPct` | 距止损线 % |
| `recommend.tierLabel` | 波动分级 |
| `recommend.suggestedPct` | 建议回撤阈值 % |
| `recommend.rangeMinPct` / `rangeMaxPct` | 建议区间 |
| `volatility.maxDailyDrawdownPct` 等 | 近 6 月波动依据 |
| `klineSource` | K 线来源（`eastmoney` / `tencent` / `none`） |
| `execution` | 触发时含完整执行规则；未触发时含纪律摘要 |
| `klineWarning` | K 线不足或备用源警告，须反映到报告 |

CLI 失败（网络/代码错误）时：在报告 10.5 节写明失败原因，不阻塞其余分析。

若 `klineWarning` 非空或 `klineSource` 为 `tencent`：在 §10.5 注明止损阈值可信度，并与 `fetch_stock.py` 的 K 线 `rows_count` 交叉核对。

### 3. 事件分类与框架映射

将 2a 检索结果填入：

| 事件 | 四范式 | §10.2 权重 |
|------|--------|------------|
| 产品/技术 | 内在价值 / 供需 | 基本面或趋势 |
| 增持/回购 | 供需资金 | 趋势/资金 |
| 业绩/预告 | 内在价值 | 基本面 |
| 行业政策/龙头动态 | 行为情绪 | 宏观/政策或趋势 |

### 4–5. 撰写分析与投资建议

读取 [reference.md](reference.md)，将 JSON 映射到各节。**必须包含第 10 节「投资建议」**（含 **10.5 尾随止损判断**，A 股），给出明确评级（买入/增持/持有/观望/减仓/回避）、仓位区间、关注/止损价位。10.3「减仓/退出」须引用 CLI 的 `stopLossLine` 作为技术止损参考，与框架证伪条件并列。

**评级参考（综合基本面 40% + 估值 30% + 趋势 20% + 宏观 10%）**

| 评级 | 典型条件 |
|------|----------|
| 买入/增持 | 好生意 + 估值合理或便宜 + 趋势/政策顺风 |
| 持有 | 基本面尚可，估值略贵但逻辑未破坏 |
| 观望 | 故事好但估值贵/趋势过热，或数据待验证 |
| 减仓/回避 | 估值极端 + 盈利恶化，或逻辑证伪 |

分析原则：基本面定价值锚、倍数定贵否、资金定短期偏离；必须含免责声明（非个性化投顾）。

### 6. 输出路径

| 文件 | 路径 | 规则 |
|------|------|------|
| 报告 | `stock/data/{代码}-{简称}/{YYYY-MM-DD}.md` | 日期取自 `data_fetched_at` 本地日期，与 frontmatter `date` 一致 |
| 股票概览 | `stock/data/{代码}-{简称}/index.md` | 每次写报告后同步更新 |
| 全站总览 | `stock/data/index.md` | 新股票首次分析时更新；期数=1 时「查看」直达报告，期数>1 时链至概览页 |

简称取自 `quote.name`，去掉非法文件名字符。**同股同日重复分析覆盖当日文件**；禁止覆盖或删除历史日期文件。

部署后在线 URL：

- 概览页：`https://stock.xuanyuanli.cn/data/{代码}-{简称}/`
- 某期报告：`https://stock.xuanyuanli.cn/data/{代码}-{简称}/{YYYY-MM-DD}.html`

本地预览：`cd stock && npm run dev` → `http://localhost:5173/`

### 7. 多股批量

```bash
python .cursor/skills/stock-analysis/scripts/fetch_stock.py 600519 华海清科 AAPL --market-context --pretty
```

## 质量检查

- [ ] 价格、PE、ROE 与 JSON 一致
- [ ] A 股已运行 **mx_enrich**（或等价 mx-data/mx-search 调用），`mx_enrich.supplement.errors` 已反映
- [ ] `data_quality.warnings` 已反映到报告；stale/missing 项已尝试 mx-data 补数
- [ ] 过期数据未当实时依据
- [ ] **已检索近 7 日（含分析当日）公司事件**（步骤 2a；A 股优先 mx-search）
- [ ] §6.2 事件表 ≥2 条，含日期、来源、新鲜度标签
- [ ] 主题/赛道股已检索行业联动事件（或注明「无重大行业新闻」）
- [ ] 重大事件已在 §10.2 权重表体现
- [ ] 含**投资评级**与操作建议
- [ ] A 股报告含 **stock-cli 尾随止损判断**（止损线等数值与 CLI JSON 一致）
- [ ] `klineSource` / `klineWarning` 已在 §10.5 反映（若有）
- [ ] 已触发止损时，报告含执行纪律（触发即卖等）
- [ ] 含免责声明
- [ ] 已更新股票 `index.md`（及必要时 `data/index.md`）

## 附加资源

- [reference.md](reference.md) · [stock-pricing-patterns.html](../../stock/public/stock-pricing-patterns.html) · [fetch_stock.py](scripts/fetch_stock.py) · [mx_enrich.py](scripts/mx_enrich.py) · [mx-data](../mx-data/SKILL.md) · [mx-search](../mx-search/SKILL.md) · [stock-cli](../../stock-cli/)
