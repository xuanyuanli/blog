import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { computeTrailingStop } from "../src/lib/trailing-stop";
import type { DailyBar } from "../src/lib/kline-eastmoney";

describe("computeTrailingStop", () => {
  it("stop line = stage high * (1 - threshold)", () => {
    const bars: DailyBar[] = [
      { date: "d1", open: 100, close: 100, high: 100, low: 99 },
      { date: "d2", open: 100, close: 200, high: 200, low: 100 },
    ];
    const r = computeTrailingStop(bars, 180, 20);
    assert.equal(r.stageHighClose, 200);
    assert.equal(r.stopLossLine, 160);
    assert.equal(r.triggered, false);
  });

  it("triggered when now <= stop line", () => {
    const bars: DailyBar[] = [
      { date: "d1", open: 100, close: 200, high: 200, low: 100 },
    ];
    const r = computeTrailingStop(bars, 160, 20);
    assert.equal(r.triggered, true);
  });

  it("uses now as stage high when above history", () => {
    const bars: DailyBar[] = [
      { date: "d1", open: 100, close: 100, high: 100, low: 99 },
    ];
    const r = computeTrailingStop(bars, 220, 20);
    assert.equal(r.stageHighClose, 220);
    assert.equal(r.stopLossLine, 176);
  });
});
