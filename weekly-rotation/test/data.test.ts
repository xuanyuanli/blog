import assert from "node:assert/strict";
import { test } from "node:test";
import { parseTencentFqWeek } from "../src/data";

test("parseTencentFqWeek 优先读 qfqweek", () => {
  const rows = parseTencentFqWeek(
    {
      data: {
        sz159949: {
          qfqweek: [["2024-01-05", "1.1", "1.2"]],
          week: [["2024-01-05", "2.1", "2.2"]],
        },
      },
    },
    "sz159949"
  );
  assert.deepEqual(rows, [{ date: "2024-01-05", close: 1.2 }]);
});

test("parseTencentFqWeek 无 qfqweek 时回退 week（159949 实际形态）", () => {
  const rows = parseTencentFqWeek(
    {
      data: {
        sz159949: {
          week: [
            ["2026-07-24", "1.664", "1.668"],
            ["2026-07-31", "1.666", "1.583"],
          ],
        },
      },
    },
    "sz159949"
  );
  assert.equal(rows.length, 2);
  assert.equal(rows[0].close, 1.668);
  assert.equal(rows[1].close, 1.583);
});

test("parseTencentFqWeek 缺字段或非法收盘返回空", () => {
  assert.deepEqual(parseTencentFqWeek({}, "sz159949"), []);
  assert.deepEqual(
    parseTencentFqWeek({ data: { sz159949: { week: [["", "1", "x"]] } } }, "sz159949"),
    []
  );
});
