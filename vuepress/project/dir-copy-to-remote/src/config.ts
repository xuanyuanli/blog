import Conf from 'conf';
import inquirer from 'inquirer';
import fs from 'fs';
import path from 'path';
import { SSHConfig } from './types.js';
import { createSSHClient } from './ssh.js';
import chalk from 'chalk';
import ora from 'ora';

/**
 * 配置管理类
 */
class ConfigManager {
  private config: Conf<SSHConfig>;

  constructor() {
    this.config = new Conf<SSHConfig>({
      projectName: 'dir-copy-to-remote',
    });
  }

  /**
   * 获取配置
   */
  getConfig(): SSHConfig | null {
    if (!this.hasConfig()) {
      return null;
    }
    return this.config.store as SSHConfig;
  }

  /**
   * 检查配置是否存在
   */
  hasConfig(): boolean {
    return this.config.has('host') && 
           this.config.has('username') && 
           this.config.has('privateKeyPath');
  }

  /**
   * 保存配置
   */
  saveConfig(sshConfig: SSHConfig): void {
    this.config.set(sshConfig as any);
  }

  /**
   * 交互式配置设置
   */
  async setupConfig(): Promise<SSHConfig> {
    const currentConfig = this.getConfig();

    const answers = await inquirer.prompt([
      {
        type: 'input',
        name: 'host',
        message: 'SSH 主机地址:',
        default: currentConfig?.host || '192.168.1.100',
        validate: (input: string) => input.trim() !== '' || '主机地址不能为空',
      },
      {
        type: 'number',
        name: 'port',
        message: 'SSH 端口:',
        default: currentConfig?.port || 22,
        validate: (input: number) => (input > 0 && input <= 65535) || '端口号必须在 1-65535 之间',
      },
      {
        type: 'input',
        name: 'username',
        message: 'SSH 用户名:',
        default: currentConfig?.username || 'root',
        validate: (input: string) => input.trim() !== '' || '用户名不能为空',
      },
      {
        type: 'input',
        name: 'privateKeyPath',
        message: 'SSH 私钥文件路径:',
        default: currentConfig?.privateKeyPath || '',
        validate: (input: string) => {
          if (input.trim() === '') {
            return '私钥路径不能为空';
          }
          const expandedPath = input.replace(/^~/, process.env.HOME || process.env.USERPROFILE || '');
          if (!fs.existsSync(expandedPath)) {
            return `私钥文件不存在: ${expandedPath}`;
          }
          return true;
        },
      },
      {
        type: 'input',
        name: 'localDir',
        message: '本地目录路径:',
        default: currentConfig?.localDir || process.cwd(),
        validate: (input: string) => {
          if (input.trim() === '') {
            return '本地目录不能为空';
          }
          const expandedPath = input.replace(/^~/, process.env.HOME || process.env.USERPROFILE || '');
          if (!fs.existsSync(expandedPath)) {
            return `本地目录不存在: ${expandedPath}`;
          }
          if (!fs.statSync(expandedPath).isDirectory()) {
            return `路径不是目录: ${expandedPath}`;
          }
          return true;
        },
      },
      {
        type: 'input',
        name: 'remoteDir',
        message: '远程目录路径:',
        default: currentConfig?.remoteDir || '/tmp',
        validate: (input: string) => input.trim() !== '' || '远程目录不能为空',
      },
    ]);

    const expandPrivateKeyPath = answers.privateKeyPath.replace(/^~/, process.env.HOME || process.env.USERPROFILE || '');
    const expandLocalDir = answers.localDir.replace(/^~/, process.env.HOME || process.env.USERPROFILE || '');

    const newConfig: SSHConfig = {
      host: answers.host,
      port: answers.port,
      username: answers.username,
      privateKeyPath: path.resolve(expandPrivateKeyPath),
      localDir: path.resolve(expandLocalDir),
      remoteDir: answers.remoteDir,
    };

    const { shouldTest } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'shouldTest',
        message: '是否测试连接和目录有效性?',
        default: true,
      },
    ]);

    if (shouldTest) {
      const testResult = await this.testConfig(newConfig);
      if (!testResult.success) {
        console.log(chalk.yellow('\n⚠️  配置测试失败，但配置仍会保存'));
        console.log(chalk.red(`错误: ${testResult.error}\n`));
        
        const { continueAnyway } = await inquirer.prompt([
          {
            type: 'confirm',
            name: 'continueAnyway',
            message: '是否仍要保存此配置?',
            default: false,
          },
        ]);
        
        if (!continueAnyway) {
          throw new Error('配置已取消');
        }
      } else {
        console.log(chalk.green('\n✅ 配置测试通过!\n'));
      }
    }

    this.saveConfig(newConfig);
    return newConfig;
  }

  /**
   * 测试配置有效性
   */
  async testConfig(config: SSHConfig): Promise<{ success: boolean; error?: string }> {
    const spinner = ora('正在测试配置...').start();

    try {
      spinner.text = '正在连接 SSH 服务器...';
      const client = await createSSHClient(config);
      
      spinner.text = '正在验证远程目录...';
      const testCommand = `test -d ${config.remoteDir} && echo "EXISTS" || echo "NOT_EXISTS"`;
      const result = await client.executeCommand(testCommand);
      
      if (result.trim() === 'NOT_EXISTS') {
        spinner.text = '远程目录不存在，尝试创建...';
        await client.executeCommand(`mkdir -p ${config.remoteDir}`);
      }
      
      spinner.text = '正在测试远程目录写入权限...';
      const testFile = path.posix.join(config.remoteDir, '.dcr_test');
      await client.executeCommand(`touch ${testFile} && rm ${testFile}`);
      
      spinner.text = '正在检查 unzip 命令...';
      await client.executeCommand('which unzip');
      
      client.disconnect();
      spinner.succeed('配置测试通过');
      
      return { success: true };
    } catch (error) {
      spinner.fail('配置测试失败');
      return { 
        success: false, 
        error: error instanceof Error ? error.message : String(error) 
      };
    }
  }

  /**
   * 清除配置
   */
  clearConfig(): void {
    this.config.clear();
  }
}

export const configManager = new ConfigManager();
