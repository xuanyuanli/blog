import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  recommendThreshold,
  isHotSectorName,
  isEtfOrFundCode,
} from "../src/lib/recommend-threshold";

describe("recommendThreshold", () => {
  it("classifies hot sector by name", () => {
    const r = recommendThreshold(
      "SZ300308",
      "中际旭创光模块",
      {
        maxDailyDrawdown: 0.05,
        maxWeeklyDrawdown: 0.1,
        maxBiweeklyDrawdown: 0.12,
        barCount: 100,
      }
    );
    assert.equal(r.tier, "high");
    assert.ok(r.suggestedPct >= 18 && r.suggestedPct <= 25);
  });

  it("classifies ETF as low volatility", () => {
    assert.ok(isEtfOrFundCode("SH510500"));
    const r = recommendThreshold(
      "SH510500",
      "中证500ETF",
      {
        maxDailyDrawdown: 0.02,
        maxWeeklyDrawdown: 0.05,
        maxBiweeklyDrawdown: 0.06,
        barCount: 100,
      }
    );
    assert.equal(r.tier, "low");
    assert.ok(r.suggestedPct >= 8 && r.suggestedPct <= 12);
  });

  it("fallback when insufficient bars", () => {
    const r = recommendThreshold("SH600519", "贵州茅台", {
      maxDailyDrawdown: 0,
      maxWeeklyDrawdown: 0,
      maxBiweeklyDrawdown: 0,
      barCount: 5,
    }, { fallback: true });
    assert.equal(r.suggestedPct, 18);
    assert.equal(r.fallback, true);
  });
});

describe("isHotSectorName", () => {
  it("detects keyword", () => {
    assert.ok(isHotSectorName("半导体设备"));
  });
});
