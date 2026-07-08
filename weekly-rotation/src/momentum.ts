/**
 * 近 N 个交易周累计涨幅。
 *
 * 在第 t 周（进行中或刚收盘）观察：涨幅 = 当前价 / 倒数第 N 个已完结周的收盘价 - 1。
 * 已完结周收盘序列为 c[0..len-1]（旧→新），基准即 c[len - N]。
 */

/** 基准收盘价：倒数第 lookback 个已完结周的收盘；数据不足返回 null */
export function basisClose(
  completedCloses: number[],
  lookback: number
): number | null {
  if (completedCloses.length < lookback) return null;
  return completedCloses[completedCloses.length - lookback];
}

export function cumulativeReturn(current: number, basis: number): number {
  return current / basis - 1;
}
