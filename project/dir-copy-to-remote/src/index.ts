#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { configManager } from './config.js';
import { compressDirectory, formatBytes } from './compress.js';
import { createSSHClient } from './ssh.js';

const program = new Command();

program
  .name('dcr')
  .description('SSH remote directory copy tool with compression')
  .version('1.0.0');

program
  .command('config')
  .description('配置 SSH 连接信息')
  .action(async () => {
    try {
      console.log(chalk.cyan('\n📝 配置 SSH 连接信息\n'));
      await configManager.setupConfig();
      console.log(chalk.green('\n✅ 配置保存成功!\n'));
    } catch (error) {
      console.error(chalk.red('\n❌ 配置失败:'), error);
      process.exit(1);
    }
  });

program
  .action(async () => {
    try {
      const config = configManager.getConfig();
      
      if (!config) {
        console.log(chalk.yellow('\n⚠️  未找到配置，请先运行 dcr config 进行配置\n'));
        process.exit(1);
      }

      console.log(chalk.cyan('\n🚀 开始目录传输\n'));
      console.log(chalk.gray(`本地目录: ${config.localDir}`));
      console.log(chalk.gray(`远程目录: ${config.remoteDir}`));
      console.log(chalk.gray(`目标服务器: ${config.username}@${config.host}:${config.port}\n`));

      const tempDir = os.tmpdir();
      const zipPath = path.join(tempDir, `dcr-${Date.now()}.zip`);

      const compressSpinner = ora('正在压缩目录...').start();
      await compressDirectory({
        sourceDir: config.localDir,
        outputPath: zipPath,
      });
      
      const zipSize = fs.statSync(zipPath).size;
      compressSpinner.succeed(`压缩完成 (${formatBytes(zipSize)})`);

      const connectSpinner = ora('正在连接到远程服务器...').start();
      const sshClient = await createSSHClient(config);
      connectSpinner.succeed('连接成功');

      const uploadSpinner = ora('正在上传文件...').start();
      let lastProgress = 0;
      
      await sshClient.transferDirectory(zipPath, (uploaded, total) => {
        const progress = Math.floor((uploaded / total) * 100);
        if (progress > lastProgress) {
          lastProgress = progress;
          uploadSpinner.text = `正在上传文件... ${progress}% (${formatBytes(uploaded)}/${formatBytes(total)})`;
        }
      });
      
      uploadSpinner.succeed('文件传输完成');

      sshClient.disconnect();

      fs.unlinkSync(zipPath);

      console.log(chalk.green('\n✅ 目录传输成功!\n'));
    } catch (error) {
      console.error(chalk.red('\n❌ 传输失败:'), error);
      process.exit(1);
    }
  });

program.parse();
