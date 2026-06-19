# Task 05 — 底部筛选五维（第三部分）

## 任务

对 `watchlists/us_ai_leaders.yaml` 中 **platform_giant** 与 **capex_heavy** 分层：

1. 现金流：OCF、FCF vs CapEx
2. 壁垒：基础设施 / 企业落地 / 平台
3. 财务质量：毛利率、负债
4. 估值：PEG、EV/FCF（能算则算，附公式与 source）
5. 供需：产能/库存公开描述

排除：纯 To C 流量应用、无壁垒小模型、单一客户代工

## 输出

`data/agent/05-bottom.json`：每家公司一条 `narratives` + 聚合 `indicators`（如 `stock_ocf_positive`）
