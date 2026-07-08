import * as fs from "fs";
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
  { code: "SH588170", name: "科创芯片ETF" },
  { code: "SH515880", name: "通信ETF" },
];

/** 观察周期：近 N 个交易周的累计涨幅 */
export const LOOKBACK_WEEKS = 4;

/** 轮动时刻（上海时间） */
export const ROTATION_HOUR = 14;
export const ROTATION_MINUTE = 30;

/** 运行时配置（config.json，不入库；由 bops 部署时写到服务器） */
export type RuntimeConfig = {
  serverChanSendKey?: string;
};

/**
 * 数据目录：state.json / config.json 所在目录。
 * 优先 --data-dir 参数，其次环境变量 WEEKLY_ROTATION_DIR，最后当前工作目录。
 */
export function resolveDataDir(cliDataDir?: string): string {
  return path.resolve(
    cliDataDir ?? process.env.WEEKLY_ROTATION_DIR ?? process.cwd()
  );
}

export function loadRuntimeConfig(dataDir: string): RuntimeConfig {
  const file = path.join(dataDir, "config.json");
  if (!fs.existsSync(file)) return {};
  try {
    return JSON.parse(fs.readFileSync(file, "utf8")) as RuntimeConfig;
  } catch {
    console.error(`警告: 无法解析 ${file}，忽略运行时配置`);
    return {};
  }
}
