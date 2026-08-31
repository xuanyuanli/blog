import * as path from "path";

/** 轮动标的池 */
export type Target = {
  /** stock-api 统一代码，如 SH510300 */
  code: string;
  name: string;
};

export const TARGETS: Target[] = [
  { code: "SH510300", name: "沪深300ETF" },
  { code: "SZ159949", name: "创业板50ETF" },
  { code: "SH513100", name: "纳指100ETF" },
];

/** 观察周期：近 N 个交易周的累计涨幅 */
export const LOOKBACK_WEEKS = 4;

/** 轮动时刻（上海时间） */
export const ROTATION_HOUR = 14;
export const ROTATION_MINUTE = 30;

/**
 * 数据目录：state.json 所在目录。
 * 优先 --data-dir 参数，其次环境变量 WEEKLY_ROTATION_DIR，最后当前工作目录。
 */
export function resolveDataDir(cliDataDir?: string): string {
  return path.resolve(
    cliDataDir ?? process.env.WEEKLY_ROTATION_DIR ?? process.cwd()
  );
}

/**
 * Server酱 SendKey，从环境变量读取（不落盘、不入库）。
 * 服务器上由 systemd 的 EnvironmentFile（bops 部署时写入的 .env）注入。
 */
export function getServerChanSendKey(): string | undefined {
  const key = process.env.SERVERCHAN_SENDKEY?.trim();
  return key ? key : undefined;
}
