import assert from "node:assert/strict";
import { test } from "node:test";
import { subsets } from "../src/run-combos";

test("subsets 默认返回大小 >= 2 的全部子集", () => {
  const res = subsets(["a", "b", "c"]);
  // 3 元素全部子集 2^3-1=7，去掉 3 个单元素 → 4 个
  assert.equal(res.length, 4);
  const asStr = res.map((s) => s.join("")).sort();
  assert.deepEqual(asStr, ["ab", "abc", "ac", "bc"]);
});

test("subsets minSize=1 包含单元素与全集", () => {
  const res = subsets(["a", "b"], 1);
  assert.equal(res.length, 3); // a, b, ab
});

test("subsets 数量为 2^n - (大小<minSize 的组合数)", () => {
  const items = [1, 2, 3, 4, 5];
  // 大小>=2：2^5-1 - 5 = 26
  assert.equal(subsets(items).length, 26);
});
