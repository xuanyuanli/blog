import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  normalizeCode,
  toEastmoneySecid,
  toStockApiCode,
  CodeNormalizeError,
} from "../src/lib/normalize-code";

describe("normalizeCode", () => {
  it("adds SH for Shanghai main board", () => {
    assert.equal(normalizeCode("600519"), "SH600519");
  });

  it("adds SZ for Shenzhen", () => {
    assert.equal(normalizeCode("000651"), "SZ000651");
  });

  it("keeps existing prefix", () => {
    assert.equal(normalizeCode("sh510500"), "SH510500");
  });

  it("rejects HK/US", () => {
    assert.throws(() => normalizeCode("HK00700"), CodeNormalizeError);
  });

  it("maps BSE new code 92xxxx to BJ", () => {
    assert.equal(normalizeCode("920186"), "BJ920186");
    assert.equal(normalizeCode("BJ920186"), "BJ920186");
    assert.equal(normalizeCode("SZ920186"), "BJ920186");
  });

  it("maps BJ to SZ for stock-api", () => {
    assert.equal(toStockApiCode("920186"), "SZ920186");
  });

  it("maps BJ to eastmoney secid 0.xxx", () => {
    assert.equal(toEastmoneySecid("920186"), "0.920186");
  });
});
