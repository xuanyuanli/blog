import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { parseKlineRow } from "../src/lib/kline-eastmoney";

describe("parseKlineRow", () => {
  it("parses eastmoney kline string", () => {
    const bar = parseKlineRow("2026-05-25,107.0,118.1,118.18,106.0");
    assert.deepEqual(bar, {
      date: "2026-05-25",
      open: 107,
      close: 118.1,
      high: 118.18,
      low: 106,
    });
  });

  it("rejects invalid OHLC", () => {
    assert.equal(parseKlineRow("2026-05-25,0,118.1,118.18,106.0"), null);
    assert.equal(parseKlineRow("bad"), null);
  });
});
