import assert from "node:assert/strict";
import { test } from "node:test";
import { alignWeeks, backtest } from "../src/backtest";
import type { Target } from "../src/config";
import type { WeeklyBar } from "../src/data";
import { addDays } from "../src/week";

const A: Target = { code: "A", name: "甲" };
const B: Target = { code: "B", name: "乙" };

/** 从收盘序列构造周 bar：周键从 2025-01-06（周一）起逐周递增，日期取周五 */
function bars(closes: (number | null)[]): WeeklyBar[] {
  const out: WeeklyBar[] = [];
  closes.forEach((close, i) => {
    if (close === null) return;
    const weekKey = addDays("2025-01-06", i * 7);
    out.push({ weekKey, date: addDays(weekKey, 4), close });
  });
  return out;
}

test("alignWeeks 取交集，起点为最晚上市标的的首周", () => {
  const byCode = new Map([
    ["A", bars([1, 2, 3, 4])],
    ["B", bars([null, null, 30, 40])],
  ]);
  const aligned = alignWeeks(byCode, ["A", "B"]);
  assert.equal(aligned.weekKeys.length, 2);
  assert.equal(aligned.weekKeys[0], addDays("2025-01-06", 14));
  assert.deepEqual(aligned.closes.get("A"), [3, 4]);
  assert.deepEqual(aligned.closes.get("B"), [30, 40]);
});

test("backtest 基本模拟：持有、换仓、收益", () => {
  const byCode = new Map([
    ["A", bars([100, 100, 110, 121, 121, 121])],
    ["B", bars([100, 100, 100, 100, 130, 130])],
  ]);
  const aligned = alignWeeks(byCode, ["A", "B"]);
  const r = backtest(aligned, [A, B], { lookback: 2 })!;

  // i=2: A 动量 10% > 0 → 开仓 A，第 3 周收益 10%
  // i=3: A 动量 21% 领先 → 持有，第 4 周收益 0
  // i=4: B 动量 30% 领先 → 换仓 B，第 5 周收益 0
  assert.equal(r.weeks, 3);
  assert.ok(Math.abs(r.cumulativeReturn - 0.1) < 1e-12);
  assert.equal(r.switches, 2);
  assert.equal(r.emptyWeeks, 0);
  assert.deepEqual(
    r.trades.map((t) => [t.action, t.to]),
    [
      ["open", "A"],
      ["switch", "B"],
    ]
  );
  assert.ok(Math.abs(r.buyHold["A"] - (121 / 110 - 1)) < 1e-12);
  assert.ok(Math.abs(r.buyHold["B"] - 0.3) < 1e-12);
});

test("backtest 全程下跌时保持空仓", () => {
  const byCode = new Map([
    ["A", bars([100, 95, 90, 85, 80])],
    ["B", bars([100, 96, 92, 88, 84])],
  ]);
  const aligned = alignWeeks(byCode, ["A", "B"]);
  const r = backtest(aligned, [A, B], { lookback: 2 })!;
  assert.equal(r.cumulativeReturn, 0);
  assert.equal(r.emptyWeeks, r.weeks);
  assert.equal(r.switches, 0);
  assert.equal(r.maxDrawdown, 0);
});

test("backtest 尊重 start，动量可用 start 之前的数据", () => {
  const closes = [100, 100, 110, 121, 133, 146];
  const byCode = new Map([
    ["A", bars(closes)],
    ["B", bars([100, 100, 100, 100, 100, 100])],
  ]);
  const aligned = alignWeeks(byCode, ["A", "B"]);
  const startDate = aligned.dates[3];
  const r = backtest(aligned, [A, B], { lookback: 2, start: startDate })!;
  assert.equal(r.startDate, startDate);
  assert.equal(r.weeks, 2);
  // 第 3 周决策持有 A：第 4、5 周收益 (133/121)*(146/133)-1 = 146/121-1
  assert.ok(Math.abs(r.cumulativeReturn - (146 / 121 - 1)) < 1e-12);
});

test("backtest 区间不足返回 null", () => {
  const byCode = new Map([
    ["A", bars([100, 101, 102])],
    ["B", bars([100, 101, 102])],
  ]);
  const aligned = alignWeeks(byCode, ["A", "B"]);
  assert.equal(backtest(aligned, [A, B], { lookback: 4 }), null);
});
