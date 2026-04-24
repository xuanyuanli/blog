import inquirer from 'inquirer';
import chalk from 'chalk';
import ora from 'ora';
import path from 'path';
import fs from 'fs';
import { DeployConfig } from './types.js';
import { createSSHClient } from './ssh.js';
import { defaultNginxLocalPath } from './config.js';

/**
 * Nginx 配置同步主流程
 * 将本地 nginx/nginx.conf 上传到服务器 /usr/local/nginx/conf/nginx.conf
 * @param config 环境配置
 * @param skipConfirm 跳过确认（命令行模式）
 */
export async function nginxSync(config: DeployConfig, skipConfirm: boolean = false): Promise<void> {
  const nginxLocalPath = defaultNginxLocalPath();

  if (!fs.existsSync(nginxLocalPath)) {
    console.log(chalk.red(`本地 nginx 配置文件不存在: ${nginxLocalPath}`));
    return;
  }

  const remotePath = config.nginxConfRemotePath;

  // 显示操作信息
  console.log(chalk.yellow('\n即将同步 nginx 配置:'));
  console.log(`  ${chalk.gray(nginxLocalPath)}  →  ${chalk.white(`${config.server.host}:${remotePath}`)}`);

  if (!skipConfirm) {
    const { confirmed } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'confirmed',
        message: '确认同步?',
        default: true,
      },
    ]);
    if (!confirmed) {
      console.log(chalk.yellow('已取消'));
      return;
    }
  }

  // SSH 连接
  const connectSpinner = ora('连接 SSH...').start();
  const client = await createSSHClient(config.server);
  connectSpinner.succeed('SSH 连接成功');

  try {
    // 备份远程 nginx 配置
    const backupSpinner = ora('备份远程 nginx 配置...').start();
    try {
      const backupPath = `${remotePath}.bak.${Date.now()}`;
      await client.executeCommand(`cp ${remotePath} ${backupPath} 2>/dev/null || true`);
      backupSpinner.succeed(`已备份到 ${backupPath}`);
    } catch {
      backupSpinner.warn('备份失败（远程可能无原配置）');
    }

    // 上传 nginx.conf
    const uploadSpinner = ora('上传 nginx.conf...').start();
    await client.uploadFile(nginxLocalPath, remotePath);
    uploadSpinner.succeed('已上传 nginx.conf');

    // 验证 nginx 配置
    const testSpinner = ora('验证 nginx 配置 (nginx -t)...').start();
    try {
      const testOutput = await client.executeCommand('/usr/local/nginx/sbin/nginx -t 2>&1');
      testSpinner.succeed('nginx 配置验证通过');
      if (testOutput.trim()) {
        console.log(chalk.gray(testOutput.trim()));
      }
    } catch (err) {
      testSpinner.fail('nginx 配置验证失败');
      const errMsg = err instanceof Error ? err.message : String(err);
      console.log(chalk.red(errMsg));
      console.log(chalk.yellow('\nnginx 配置有误，已跳过重载。请检查配置文件后重试。'));
      client.disconnect();
      return;
    }

    // 重载 nginx
    const reloadSpinner = ora('重载 nginx (nginx -s reload)...').start();
    try {
      await client.executeCommand('/usr/local/nginx/sbin/nginx -s reload');
      reloadSpinner.succeed('nginx 重载成功');
    } catch (err) {
      reloadSpinner.warn('nginx 重载失败，尝试使用 kill 信号重载...');
      try {
        await client.executeCommand('kill -HUP $(cat /usr/local/nginx/logs/nginx.pid) 2>/dev/null || true');
        reloadSpinner.succeed('nginx 重载成功（通过 kill 信号）');
      } catch {
        reloadSpinner.fail('nginx 重载失败，请手动重载');
      }
    }

    console.log(chalk.green('\nnginx 配置同步完成！'));
  } finally {
    client.disconnect();
  }
}
