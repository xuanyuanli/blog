#!/usr/bin/env node

import { analyzeStock } from "./lib/analyze";
import { formatHuman, formatJson } from "./lib/format-output";
import { CodeNormalizeError } from "./lib/normalize-code";

type CliOptions = {
  code?: string;
  threshold: number;
  months: number;
  json: boolean;
  advice: boolean;
  help: boolean;
};

function printHelp(): void {
  console.log(`stock — A 股尾随止损阈值与止损线工具

用法:
  stock <code> [选项]

参数:
  code              股票代码，如 600519、SH510500、920186、BJ920186

选项:
  -t, --threshold <n>   采用回撤阈值百分比（默认 0=建议阈值）
  --months <n>          回看月数（默认 6）
  -a, --advice          输出完整心理拆解与执行规则
  --json                JSON 输出
  -h, --help            显示帮助

示例:
  stock 600519
  stock SH510500 -t 20
  stock 300502 -a
  stock 600519 --json

安装:
  cd stock-cli && npm install && npm run build && npm link
`);
}

function parseArgs(argv: string[]): CliOptions {
  const opts: CliOptions = {
    threshold: 0,
    months: 6,
    json: false,
    advice: false,
    help: false,
  };

  const positional: string[] = [];

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];

    if (arg === "-h" || arg === "--help") {
      opts.help = true;
      continue;
    }
    if (arg === "--json") {
      opts.json = true;
      continue;
    }
    if (arg === "-a" || arg === "--advice") {
      opts.advice = true;
      continue;
    }
    if (arg === "-t" || arg === "--threshold") {
      const v = Number(argv[++i]);
      if (Number.isNaN(v) || v < 0 || v >= 100) {
        throw new Error("阈值须为 0-100 之间的数（0 表示采用建议回撤阈值）");
      }
      opts.threshold = v;
      continue;
    }
    if (arg === "--months") {
      const v = Number(argv[++i]);
      if (Number.isNaN(v) || v <= 0 || v > 24) {
        throw new Error("回看月数须为 1-24");
      }
      opts.months = v;
      continue;
    }

    if (arg.startsWith("-")) {
      throw new Error(`未知选项: ${arg}`);
    }

    positional.push(arg);
  }

  if (positional.length > 0) {
    opts.code = positional[0];
  }

  return opts;
}

async function main(): Promise<void> {
  const opts = parseArgs(process.argv.slice(2));

  if (opts.help || !opts.code) {
    printHelp();
    process.exitCode = opts.help ? 0 : 1;
    return;
  }

  const result = await analyzeStock(opts.code, {
    thresholdPct: opts.threshold,
    months: opts.months,
  });

  if (result.klineWarning && !opts.json) {
    console.error(`警告: ${result.klineWarning}`);
  }

  const formatOpts = { json: opts.json, advice: opts.advice, months: opts.months };
  const output = opts.json
    ? formatJson(result, formatOpts)
    : formatHuman(result, formatOpts);

  console.log(output);
}

main().catch((err: unknown) => {
  if (err instanceof CodeNormalizeError) {
    console.error(err.message);
  } else if (err instanceof Error) {
    console.error(err.message);
  } else {
    console.error(String(err));
  }
  process.exitCode = 1;
});
