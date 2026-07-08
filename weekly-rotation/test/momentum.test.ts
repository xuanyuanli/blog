import assert from "node:assert/strict";
import { test } from "node:test";
import { basisClose, cumulativeReturn } from "../src/momentum";

test("basisClose 取倒数第 N 个已完结周收盘", () => {
  const closes = [10, 11, 12, 13, 14, 15];
  assert.equal(basisClose(closes, 4), 12);
  assert.equal(basisClose(closes, 6), 10);
});

test("basisClose 数据不足返回 null", () => {
  assert.equal(basisClose([10, 11, 12], 4), null);
  assert.equal(basisClose([], 1), null);
});

test("cumulativeReturn", () => {
  assert.ok(Math.abs(cumulativeReturn(110, 100) - 0.1) < 1e-12);
  assert.ok(Math.abs(cumulativeReturn(90, 100) - -0.1) < 1e-12);
});
