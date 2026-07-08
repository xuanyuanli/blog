import assert from "node:assert/strict";
import { test } from "node:test";
import { isTradingDay, lastTradingDayOfWeek } from "../src/trading-day";

test("普通工作日是交易日", () => {
  assert.equal(isTradingDay("2026-07-08"), true); // 周三
  assert.equal(isTradingDay("2026-07-10"), true); // 周五
});

test("周末不是交易日", () => {
  assert.equal(isTradingDay("2026-07-11"), false); // 周六
  assert.equal(isTradingDay("2026-07-12"), false); // 周日
});

test("法定节假日不是交易日", () => {
  assert.equal(isTradingDay("2026-01-01"), false); // 元旦（周四）
  assert.equal(isTradingDay("2025-10-01"), false); // 国庆
});

test("调休补班的周末也不是交易日", () => {
  // 2025-09-28 为国庆调休补班日（周日），A 股不开市
  assert.equal(isTradingDay("2025-09-28"), false);
});

test("周五为交易日时，轮动日为周五", () => {
  assert.equal(lastTradingDayOfWeek("2026-07-08"), "2026-07-10");
});

test("周五逢节假日时，取本周最后一个交易日", () => {
  // 2025-09-29（周一）所在周：10-01 起国庆放假，最后交易日为 09-30（周二）
  assert.equal(lastTradingDayOfWeek("2025-09-29"), "2025-09-30");
});

test("整周无交易日返回 null", () => {
  // 2024 春节假期 02-10 ~ 02-17，02-12（周一）所在周全周休市
  assert.equal(lastTradingDayOfWeek("2024-02-12"), null);
});
