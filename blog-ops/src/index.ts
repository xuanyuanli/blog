#!/usr/bin/env node

import chalk from 'chalk';
import inquirer from 'inquirer';
import { Command } from 'commander';
import { configManager } from './config.js';
import { nginxSync } from './nginx-sync.js';
import { blogDeploy } from './blog-deploy.js';
import { createSSHClient } from './ssh.js';
import { VersionManager } from './version-manager.js';
import { BlogProjectName } from './types.js';

type MenuItem = {
  name: string;
  value: string;
};

const MENU_ITEMS: MenuItem[] = [
  { name: '配置服务器连接信息', value: 'config' },
  { name: '发布新博客（bops new）', value: 'new' },
  { name: '发布旧博客（bops old）', value: 'old' },
  { name: '发布股票站点（bops stock）', value: 'stock' },
  { name: '发布新旧博客（Astro + VuePress）', value: 'all' },
  { name: '同步 Nginx 配置（bops nginx）', value: 'nginx' },
  { name: '查看版本历史（bops versions）', value: 'versions' },
  { name: '退出', value: 'exit' },
];

function printBanner(): void {
  console.log(chalk.cyan(''));
  console.log(chalk.cyan('  ╔═══════════════════════════════╗'));
  console.log(chalk.cyan('  ║      博客运维工具 bops        ║'));
  console.log(chalk.cyan('  ╚═══════════════════════════════╝'));
  console.log('');
}

/**
 * 处理配置流程
 */
async function handleConfig(): Promise<void> {
  try {
    await configManager.setupConfig();
    console.log(chalk.green('\n配置保存成功！'));
  } catch (err) {
    if (err instanceof Error && err.message === '配置已取消') {
      console.log(chalk.yellow('\n配置已取消'));
    } else {
      console.log(chalk.red(`\n配置失败: ${err instanceof Error ? err.message : String(err)}`));
    }
  }
}

/**
 * 确保已有配置，无则引导配置
 */
async function requireConfig(): Promise<ReturnType<typeof configManager.getConfig>> {
  const config = configManager.getConfig();
  if (!config) {
    console.log(chalk.yellow('\n尚未配置服务器信息，请先完成配置。\n'));
    await handleConfig();
    return configManager.getConfig();
  }
  return config;
}

/**
 * 命令行发布：bops new | bops old | bops stock
 */
async function runProjectDeploy(
  projects: BlogProjectName[],
  skipBuild: boolean
): Promise<void> {
  const config = configManager.getConfig();
  if (!config) {
    console.error(chalk.red('尚未配置服务器信息，请先运行: bops，完成配置'));
    process.exit(1);
  }

  printBanner();
  console.log(chalk.gray('  服务器: ') + chalk.yellow(`${config.server.username}@${config.server.host}`));
  console.log('');

  try {
    await blogDeploy(config, {
      projects,
      skipBuild,
      skipConfirm: true,
    });
    console.log(chalk.green('\n发布完成！'));
  } catch (err) {
    console.error(chalk.red(`\n发布失败: ${err instanceof Error ? err.message : String(err)}`));
    process.exit(1);
  }
}

/**
 * 命令行同步 nginx
 */
async function runNginxSync(): Promise<void> {
  const config = configManager.getConfig();
  if (!config) {
    console.error(chalk.red('尚未配置服务器信息，请先运行: bops，完成配置'));
    process.exit(1);
  }

  printBanner();
  try {
    await nginxSync(config, true);
  } catch (err) {
    console.error(chalk.red(`\n同步失败: ${err instanceof Error ? err.message : String(err)}`));
    process.exit(1);
  }
}

/**
 * 查看版本历史
 */
async function handleVersions(): Promise<void> {
  const config = configManager.getConfig();
  if (!config) {
    console.log(chalk.yellow('尚未配置服务器信息'));
    return;
  }
  const client = await createSSHClient(config.server);
  try {
    const vm = new VersionManager(client);
    const allVersions = await vm.listVersions();
    VersionManager.printVersions(allVersions);
  } finally {
    client.disconnect();
  }
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);

  // 解析命令行参数
  const program = new Command();
  program
    .name('bops')
    .description('博客运维工具')
    .version('1.0.0')
    .allowUnknownOption();

  program
    .command('new')
    .description('构建并发布新博客（Astro）')
    .option('-s, --skip-build', '跳过构建，直接部署已有产物')
    .action(async (opts) => {
      await runProjectDeploy(['astro'], opts.skipBuild ?? false);
    });

  program
    .command('old')
    .description('构建并发布旧博客（VuePress）到 /archive/')
    .option('-s, --skip-build', '跳过构建，直接部署已有产物')
    .action(async (opts) => {
      await runProjectDeploy(['vuepress'], opts.skipBuild ?? false);
    });

  program
    .command('stock')
    .description('构建并发布股票站点（VitePress）到 stock.xuanyuanli.cn')
    .option('-s, --skip-build', '跳过构建，直接部署已有产物')
    .action(async (opts) => {
      await runProjectDeploy(['stock'], opts.skipBuild ?? false);
    });

  program
    .command('nginx')
    .description('同步 Nginx 配置到服务器')
    .action(async () => {
      await runNginxSync();
    });

  program
    .command('versions')
    .description('查看部署版本历史')
    .action(async () => {
      await handleVersions();
    });

  // 有子命令或 --help / --version 时由 commander 处理
  const isCliFlag = args.some((a) => ['--help', '-h', '--version', '-V'].includes(a));
  if ((args.length > 0 && !args[0].startsWith('-')) || isCliFlag) {
    await program.parseAsync(process.argv);
    return;
  }

  // 无参数，进入交互菜单
  printBanner();

  while (true) {
    // 显示当前配置状态
    const config = configManager.getConfig();
    console.log('');
    if (config) {
      console.log(
        chalk.gray('  服务器: ') +
        chalk.yellow(`${config.server.username}@${config.server.host}:${config.server.port}`)
      );
    } else {
      console.log(
        chalk.red('  未配置')
      );
    }
    console.log('');

    const { action } = await inquirer.prompt([
      {
        type: 'list',
        name: 'action',
        message: '请选择操作:',
        choices: MENU_ITEMS,
        pageSize: 10,
      },
    ]);

    if (action === 'exit') {
      console.log(chalk.cyan('\n再见！\n'));
      process.exit(0);
    }

    if (action === 'config') {
      await handleConfig();
      continue;
    }

    if (action === 'versions') {
      const currentConfig = await requireConfig();
      if (!currentConfig) {
        console.log(chalk.red('\n配置未完成，无法执行此操作'));
        continue;
      }
      try {
        await handleVersions();
      } catch (err) {
        console.log(chalk.red(`\n执行失败: ${err instanceof Error ? err.message : String(err)}`));
      }
      continue;
    }

    // 其他操作需要先有配置
    const currentConfig = await requireConfig();
    if (!currentConfig) {
      console.log(chalk.red('\n配置未完成，无法执行此操作'));
      continue;
    }

    console.log('');

    try {
      switch (action) {
        case 'new':
          await blogDeploy(currentConfig, {
            projects: ['astro'],
            skipBuild: false,
            skipConfirm: false,
          });
          break;
        case 'old':
          await blogDeploy(currentConfig, {
            projects: ['vuepress'],
            skipBuild: false,
            skipConfirm: false,
          });
          break;
        case 'stock':
          await blogDeploy(currentConfig, {
            projects: ['stock'],
            skipBuild: false,
            skipConfirm: false,
          });
          break;
        case 'all':
          await blogDeploy(currentConfig, {
            projects: ['astro', 'vuepress'],
            skipBuild: false,
            skipConfirm: false,
          });
          break;
        case 'nginx':
          await nginxSync(currentConfig);
          break;
      }
    } catch (err) {
      console.log(chalk.red(`\n执行失败: ${err instanceof Error ? err.message : String(err)}`));
    }

    console.log('');
  }
}

main().catch((err) => {
  console.error(chalk.red('\n程序异常退出:'), err);
  process.exit(1);
});
