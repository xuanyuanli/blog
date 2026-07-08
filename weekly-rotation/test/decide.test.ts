import assert from "node:assert/strict";
import { test } from "node:test";
import { decide, resolveAction } from "../src/decide";

const c = (code: string, momentum: number) => ({ code, name: code, momentum });

test("top1 为正则持有", () => {
  const { ranked, target } = decide([c("A", 0.02), c("B", 0.05), c("C", -0.01)]);
  assert.equal(target?.code, "B");
  assert.deepEqual(
    ranked.map((x) => x.code),
    ["B", "A", "C"]
  );
});

test("top1 为负则空仓", () => {
  const { target } = decide([c("A", -0.02), c("B", -0.05)]);
  assert.equal(target, null);
});

test("top1 为 0 视为非正，空仓", () => {
  const { target } = decide([c("A", 0), c("B", -0.05)]);
  assert.equal(target, null);
});

test("resolveAction 各分支", () => {
  assert.equal(resolveAction(null, "A"), "open");
  assert.equal(resolveAction("A", "A"), "hold");
  assert.equal(resolveAction("A", "B"), "switch");
  assert.equal(resolveAction("A", null), "clear");
  assert.equal(resolveAction(null, null), "stay_empty");
});
