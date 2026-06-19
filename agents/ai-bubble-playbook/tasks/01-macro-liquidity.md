# Task 01 — 宏观流动性（Agent CLI WebSearch 专用）

## 禁止

- 凭记忆填数
- 使用 Python 脚本抓 FRED（已由仓库移除）

## 必须 WebSearch 的指标

| id | 搜索词 | 首选来源 |
|----|--------|----------|
| real_rate_10y | FRED DFII10 latest | fred.stlouisfed.org/series/DFII10 |
| credit_spread_bbb | FRED BAMLC0A4CBBB | fred.stlouisfed.org |
| finra_margin_debt | FRED MDODFS | fred.stlouisfed.org |

## 输出

写入 `data/agent/01-macro.json`：

```json
{
  "task_id": "01-macro-liquidity",
  "as_of": "YYYY-MM-DD",
  "indicators": [{
    "id": "real_rate_10y",
    "value": 2.14,
    "unit": "percent",
    "as_of": "YYYY-MM-DD",
    "source": "FRED DFII10",
    "source_url": "https://fred.stlouisfed.org/series/DFII10",
    "fetch_layer": "agent_search",
    "confidence": "confirmed"
  }],
  "narratives": [{ "topic": "...", "summary": "...", "sources": [{ "title": "...", "url": "..." }] }]
}
```

`confidence: confirmed` 必须含可点击 `source_url`。
