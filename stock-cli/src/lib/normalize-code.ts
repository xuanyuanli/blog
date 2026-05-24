const SH_PREFIXES = ["5", "6", "9"];
const SZ_PREFIXES = ["0", "1", "2", "3"];

/** 北交所新代码（92 开头 6 位） */
function isBseNewCode(digits: string): boolean {
  return digits.length === 6 && digits.startsWith("92");
}

export class CodeNormalizeError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CodeNormalizeError";
  }
}

export function normalizeCode(input: string): string {
  const raw = String(input).trim().toUpperCase().replace(/\s/g, "");

  if (!raw) {
    throw new CodeNormalizeError("股票代码不能为空");
  }

  if (raw.startsWith("HK") || raw.startsWith("US")) {
    throw new CodeNormalizeError(
      "当前仅支持沪深北 A 股、ETF、场内基金（HK/US 暂不支持）"
    );
  }

  if (raw.startsWith("BJ")) {
    const digits = raw.slice(2);
    if (!/^\d{5,6}$/.test(digits)) {
      throw new CodeNormalizeError(`无效代码格式: ${input}`);
    }
    return `BJ${digits}`;
  }

  if (raw.startsWith("SH") || raw.startsWith("SZ")) {
    const digits = raw.slice(2);
    if (!/^\d{5,6}$/.test(digits)) {
      throw new CodeNormalizeError(`无效代码格式: ${input}`);
    }
    if (isBseNewCode(digits)) {
      return `BJ${digits}`;
    }
    return raw.slice(0, 2) + digits;
  }

  if (!/^\d{5,6}$/.test(raw)) {
    throw new CodeNormalizeError(
      `无法识别代码: ${input}。示例: 600519、SH600519、SZ000651`
    );
  }

  if (isBseNewCode(raw)) {
    return `BJ${raw}`;
  }

  if (raw.startsWith("68") || raw.startsWith("60") || raw.startsWith("688")) {
    return `SH${raw}`;
  }

  const first = raw[0];
  if (SH_PREFIXES.includes(first) || raw.startsWith("51") || raw.startsWith("56")) {
    return `SH${raw}`;
  }

  if (SZ_PREFIXES.includes(first)) {
    return `SZ${raw}`;
  }

  throw new CodeNormalizeError(
    `无法判断交易所: ${input}。请使用 SH/SZ/BJ 前缀，如 SH600519、BJ920186`
  );
}

/** stock-api / 东财对北交所使用 SZ 前缀行情代码 */
export function toStockApiCode(code: string): string {
  const normalized = normalizeCode(code);
  if (normalized.startsWith("BJ")) {
    return `SZ${normalized.slice(2)}`;
  }
  return normalized;
}

export function toEastmoneySecid(code: string): string {
  const normalized = normalizeCode(code);
  if (normalized.startsWith("SH")) {
    return `1.${normalized.slice(2)}`;
  }
  return `0.${normalized.slice(2)}`;
}
