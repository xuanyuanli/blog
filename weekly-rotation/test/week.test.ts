import assert from "node:assert/strict";
import { test } from "node:test";
import { addDays, dayOfWeek, formatDate, mondayOf, parseDate } from "../src/week";

test("parseDate / formatDate 往返", () => {
  assert.equal(formatDate(parseDate("2026-07-08")), "2026-07-08");
  assert.equal(formatDate(parseDate("2026-01-01")), "2026-01-01");
});

test("addDays 跨月跨年", () => {
  assert.equal(addDays("2026-07-08", 1), "2026-07-09");
  assert.equal(addDays("2025-12-31", 1), "2026-01-01");
  assert.equal(addDays("2026-03-01", -1), "2026-02-28");
});

test("dayOfWeek", () => {
  assert.equal(dayOfWeek("2026-07-08"), 3); // 周三
  assert.equal(dayOfWeek("2026-07-10"), 5); // 周五
  assert.equal(dayOfWeek("2026-07-12"), 0); // 周日
});

test("mondayOf 周内各天都对齐到周一", () => {
  assert.equal(mondayOf("2026-07-06"), "2026-07-06"); // 周一
  assert.equal(mondayOf("2026-07-08"), "2026-07-06"); // 周三
  assert.equal(mondayOf("2026-07-11"), "2026-07-06"); // 周六
  assert.equal(mondayOf("2026-07-12"), "2026-07-06"); // 周日
});
