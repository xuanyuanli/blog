import assert from "node:assert/strict";
import { test } from "node:test";
import {
  findNextRotation,
  rotationInstant,
  shanghaiDateStr,
} from "../src/scheduler";

test("rotationInstant 为上海时间 14:30", () => {
  // 2026-07-10 14:30 上海 = 06:30 UTC
  assert.equal(rotationInstant("2026-07-10"), Date.UTC(2026, 6, 10, 6, 30));
});

test("shanghaiDateStr 按 UTC+8 取自然日", () => {
  // UTC 2026-07-08 20:00 = 上海 2026-07-09 04:00
  assert.equal(shanghaiDateStr(Date.UTC(2026, 6, 8, 20, 0)), "2026-07-09");
});

test("周中运行时，下次轮动为本周五", () => {
  const now = Date.UTC(2026, 6, 8, 2, 0); // 周三 10:00 上海
  const next = findNextRotation(now);
  assert.equal(next.dateStr, "2026-07-10");
  assert.equal(next.atMs, Date.UTC(2026, 6, 10, 6, 30));
});

test("周五 14:30 已过时，顺延到下周", () => {
  const now = Date.UTC(2026, 6, 10, 7, 0); // 周五 15:00 上海
  const next = findNextRotation(now);
  assert.equal(next.dateStr, "2026-07-17");
});

test("整周无交易日时顺延跨周", () => {
  // 2024 春节假期 02-10 ~ 02-17：02-12 所在周全周休市
  const now = Date.UTC(2024, 1, 10, 2, 0); // 周六，本周轮动已过
  const next = findNextRotation(now);
  assert.equal(next.dateStr, "2024-02-23");
});

test("周五逢节假日时，轮动日提前到本周最后交易日", () => {
  // 2025-09-29（周一）10:00 上海，10-01 起放假，最后交易日 09-30
  const now = Date.UTC(2025, 8, 29, 2, 0);
  const next = findNextRotation(now);
  assert.equal(next.dateStr, "2025-09-30");
});
