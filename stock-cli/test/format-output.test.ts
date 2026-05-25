import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { formatHuman, formatJson } from "../src/lib/format-output";
import type { AnalyzeResult } from "../src/lib/analyze";

function mockResult(triggered: boolean): AnalyzeResult {
  return {
    code: "SH600519",
    name: "贵州茅台",
    now: triggered ? 1400 : 1688,
    yesterday: 1670,
    percent: 0.01,
    bars: [],
    klineSource: "eastmoney",
    volatility: {
      maxDailyDrawdown: 0.068,
      maxWeeklyDrawdown: 0.112,
      maxBiweeklyDrawdown: 0.154,
      barCount: 120,
    },
    recommend: {
      tier: "medium",
      tierLabel: "中波动（成长）",
      range: { min: 12, max: 18, label: "中波动（成长）" },
      suggestedPct: 14,
      fallback: false,
      reasons: ["默认成长/中性波动档"],
    },
    trailing: {
      stageHighClose: 1720,
      stopLossLine: 1410.4,
      appliedThresholdPct: 18,
      triggered,
      distanceToStopPct: triggered ? -0.7 : 19.7,
    },
  };
}

describe("format-output", () => {
  it("shows full advice when triggered", () => {
    const text = formatHuman(mockResult(true), { json: false, advice: false });
    assert.match(text, /已触发止损/);
    assert.match(text, /心理过程拆解/);
    assert.match(text, /触发即卖/);
  });

  it("shows brief discipline when not triggered", () => {
    const text = formatHuman(mockResult(false), { json: false, advice: false });
    assert.match(text, /未触发/);
    assert.match(text, /纪律摘要/);
    assert.doesNotMatch(text, /【心理过程拆解】/);
  });

  it("shows full advice with --advice flag", () => {
    const text = formatHuman(mockResult(false), { json: false, advice: true });
    assert.match(text, /心理过程拆解/);
  });

  it("json includes execution block", () => {
    const json = JSON.parse(
      formatJson(mockResult(true), { json: true, advice: false })
    );
    assert.equal(json.trailing.triggered, true);
    assert.equal(json.execution.showFullAdvice, true);
    assert.ok(json.execution.psychology.length >= 5);
  });
});
