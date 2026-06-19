# Task 03 — 情绪与 AI ETF 资金流（席勒）

## 任务

1. AI ETF（SMH/BOTZ/AIQ）近期资金流入/媒体热度（ETF.com、ETFdb、财经新闻）
2. 散户情绪：AAII、CNN Fear & Greed（如有公开数据）
3. 媒体是否「全网单边唱多 AI」— 列举 3–5 条可核查标题 + URL

## 输出

`data/agent/03-sentiment.json`

```json
{
  "task_id": "03-sentiment-flows",
  "indicators": [
    { "id": "ai_etf_flows", "confidence": "indirect", "..." },
    { "id": "media_sentiment", "confidence": "indirect", "..." }
  ],
  "narratives": []
}
```

单源 WebSearch 最高 `indirect`，不得标 `confirmed`。
