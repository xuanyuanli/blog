import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { computeVolatility } from "../src/lib/volatility";
import type { DailyBar } from "../src/lib/kline-eastmoney";

function bar(
  date: string,
  close: number,
  low: number,
  high: number
): DailyBar {
  return { date, open: close, close, high, low };
}

describe("computeVolatility", () => {
  it("computes max daily drawdown from prev close to low", () => {
    const bars: DailyBar[] = [
      bar("2025-01-02", 100, 98, 102),
      bar("2025-01-03", 95, 90, 96),
    ];
    const stats = computeVolatility(bars);
    assert.equal(stats.maxDailyDrawdown, 0.1);
  });

  it("computes window drawdown over 5 days", () => {
    const bars: DailyBar[] = Array.from({ length: 6 }, (_, i) =>
      bar(`d${i}`, 100 - i, 80, 100)
    );
    const stats = computeVolatility(bars);
    assert.ok(stats.maxWeeklyDrawdown > 0);
  });
});
