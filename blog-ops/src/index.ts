#!/usr/bin/env node

import chalk from 'chalk';
import inquirer from 'inquirer';
import { Command } from 'commander';
import { configManager } from './config.js';
import { nginxSync } from './nginx-sync.js';
import { blogDeploy } from './blog-deploy.js';
import { createSSHClient } from './ssh.js';
import { VersionManager } from './version-manager.js';

type MenuItem = {
  name: string;
  value: string;
};

const MENU_ITEMS: MenuItem[] = [
  { name: '配置服务器连接信息', value: 'config' },
  { name: '构建并发布新博客（Next.js）', value: 'deploy-nextjs' },
  { name: '构建并发布旧博客（VuePress）', value: 'deploy-vuepress' },
  { name: '构建并发布新旧博客（Next.js + VuePress）', value: 'deploy-all' },
  { name: '同步 Nginx 配置', value: 'nginx' },
  { name: '查看版本历史', value: 'versions' },
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
 * 命令行一键发布模式
 * bops deploy [--with-archive | --vuepress-only] [--skip-build]
 */
async function runDeploy(opts: {
  withArchive: boolean;
  vuepressOnly: boolean;
  skipBuild: boolean;
}): Promise<void> {
  const config = configManager.getConfig();
  if (!config) {
    console.error(chalk.red('尚未配置服务器信息，请先运行: bops，完成配置'));
    process.exit(1);
  }

  // 确定要部署的项目
  const projects: ('nextjs' | 'vuepress')[] = opts.vuepressOnly
    ? ['vuepress']
    : opts.withArchive
      ? ['nextjs', 'vuepress']
      : ['nextjs'];

  printBanner();
  console.log(chalk.gray('  服务器: ') + chalk.yellow(`${config.server.username}@${config.server.host}`));
  console.log('');

  try {
    await blogDeploy(config, {
      projects,
      skipBuild: opts.skipBuild,
      skipConfirm: true,
    });
    console.log(chalk.green('\n一键发布完成！'));
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
    .command('deploy')
    .description('构建并发布博客')
    .option('-a, --with-archive', '同时发布旧博客（VuePress）到 /archive/')
    .option('-v, --vuepress-only', '仅发布旧博客（VuePress）')
    .option('-s, --skip-build', '跳过构建，直接部署已有产物')
    .action(async (opts) => {
      await runDeploy({
        withArchive: opts.withArchive ?? false,
        vuepressOnly: opts.vuepressOnly ?? false,
        skipBuild: opts.skipBuild ?? false,
      });
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

  // 有子命令时由 commander 处理
  if (args.length > 0 && !args[0].startsWith('-')) {
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
        case 'deploy-nextjs':
          await blogDeploy(currentConfig, {
            projects: ['nextjs'],
            skipBuild: false,
            skipConfirm: false,
          });
          break;
        case 'deploy-vuepress':
          await blogDeploy(currentConfig, {
            projects: ['vuepress'],
            skipBuild: false,
            skipConfirm: false,
          });
          break;
        case 'deploy-all':
          await blogDeploy(currentConfig, {
            projects: ['nextjs', 'vuepress'],
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
