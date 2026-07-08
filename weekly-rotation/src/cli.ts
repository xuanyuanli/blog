#!/usr/bin/env node

import { resolveDataDir } from "./config";
import { runBacktest } from "./run-backtest";
import { notifyError, runRotation } from "./run-rotation";
import { runDaemon, shanghaiDateStr } from "./scheduler";

type CliOptions = {
  command: "daemon" | "once" | "backtest";
  dataDir?: string;
  dryRun: boolean;
  start?: string;
  end?: string;
  help: boolean;
};

function printHelp(): void {
  console.log(`weekly-rotation — ETF 周线轮动策略（近 4 周动量 top1，负收益空仓）

用法:
  weekly-rotation [daemon]              常驻调度，每周最后一个交易日 14:30 执行
  weekly-rotation once [--dry-run]      立即执行一次轮动决策
  weekly-rotation backtest [选项]        回测对比 5 标的池与 4 标的池（不含科创芯片）

选项:
  --data-dir <path>   state.json 所在目录
                      （默认环境变量 WEEKLY_ROTATION_DIR，其次当前目录）
  --dry-run           once 专用：只计算打印，不发通知、不写状态
  --start <date>      backtest 专用：起始日期 YYYY-MM-DD
                      （默认取池内最晚成立 ETF 的上市周）
  --end <date>        backtest 专用：结束日期 YYYY-MM-DD
  -h, --help          显示帮助

示例:
  weekly-rotation once --dry-run
  weekly-rotation backtest
  weekly-rotation backtest --start 2024-07-08
`);
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function parseArgs(argv: string[]): CliOptions {
  const opts: CliOptions = { command: "daemon", dryRun: false, help: false };
  const positional: string[] = [];

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "-h" || arg === "--help") {
      opts.help = true;
      continue;
    }
    if (arg === "--dry-run") {
      opts.dryRun = true;
      continue;
    }
    if (arg === "--data-dir") {
      opts.dataDir = argv[++i];
      if (!opts.dataDir) throw new Error("--data-dir 需要指定目录");
      continue;
    }
    if (arg === "--start" || arg === "--end") {
      const v = argv[++i];
      if (!v || !DATE_RE.test(v)) {
        throw new Error(`${arg} 需要 YYYY-MM-DD 格式日期`);
      }
      if (arg === "--start") opts.start = v;
      else opts.end = v;
      continue;
    }
    if (arg.startsWith("-")) throw new Error(`未知选项: ${arg}`);
    positional.push(arg);
  }

  if (positional.length > 0) {
    const cmd = positional[0];
    if (cmd !== "daemon" && cmd !== "once" && cmd !== "backtest") {
      throw new Error(`未知命令: ${cmd}（可用: daemon / once / backtest）`);
    }
    opts.command = cmd;
  }

  return opts;
}

async function main(): Promise<void> {
  const opts = parseArgs(process.argv.slice(2));

  if (opts.help) {
    printHelp();
    return;
  }

  const dataDir = resolveDataDir(opts.dataDir);

  switch (opts.command) {
    case "once": {
      await runRotation({
        dataDir,
        dryRun: opts.dryRun,
        todayStr: shanghaiDateStr(Date.now()),
      });
      return;
    }
    case "backtest": {
      console.log(await runBacktest({ start: opts.start, end: opts.end }));
      return;
    }
    case "daemon": {
      console.log(`[daemon] 数据目录: ${dataDir}`);
      await runDaemon(async (todayStr) => {
        try {
          await runRotation({ dataDir, dryRun: false, todayStr });
        } catch (err) {
          await notifyError(err);
          throw err;
        }
      });
    }
  }
}

main().catch((err: unknown) => {
  console.error(err instanceof Error ? err.message : String(err));
  process.exitCode = 1;
});
