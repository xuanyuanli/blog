import Conf from 'conf';
import inquirer from 'inquirer';
import fs from 'fs';
import path from 'path';
import chalk from 'chalk';
import ora from 'ora';
import { DeployConfig, ServerConfig } from './types.js';
import { createSSHClient } from './ssh.js';

/**
 * 在执行 fn 期间监听 ESC 键，按下时中断配置流程
 */
async function withEscCancel<T>(fn: () => Promise<T>): Promise<T> {
  let rejectFn: ((err: Error) => void) | null = null;

  const escPromise = new Promise<never>((_, reject) => {
    rejectFn = reject;
  });

  const onData = (buf: Buffer) => {
    // ESC = 0x1b，且不是方向键前缀
    if (buf[0] === 0x1b && buf.length === 1 && rejectFn) {
      rejectFn(new Error('配置已取消'));
    }
  };

  const stdin = process.stdin;
  stdin.on('data', onData);

  try {
    return await Promise.race([fn(), escPromise]);
  } finally {
    stdin.off('data', onData);
    rejectFn = null;
  }
}

/** 默认配置值 */
const DEFAULTS = {
  port: 22,
  username: 'root',
  nginxConfRemotePath: '/usr/local/nginx/conf/nginx.conf',
  blogRemoteRoot: '/var/www/blog',
};

/**
 * 根据环境自动计算本地 nginx 配置文件路径
 * 始终基于项目根目录动态解析，避免绝对路径在换目录后失效
 */
export function defaultNginxLocalPath(): string {
  const base = path.resolve(new URL('../../nginx', import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1'));
  return path.join(base, 'nginx.conf');
}

/**
 * 配置管理类，使用 conf 持久化到本地
 */
class ConfigManager {
  private store: Conf<Record<string, unknown>>;

  constructor() {
    this.store = new Conf({ projectName: 'blog-ops' });
  }

  /**
   * 获取配置，不存在则返回 null
   */
  getConfig(): DeployConfig | null {
    if (!this.store.has('server.host')) {
      return null;
    }
    return this.store.store as unknown as DeployConfig;
  }

  /**
   * 保存配置
   */
  saveConfig(config: DeployConfig): void {
    this.store.store = config as unknown as Record<string, unknown>;
  }

  /**
   * 交互式配置服务器连接信息
   */
  async setupConfig(): Promise<DeployConfig> {
    return withEscCancel(() => this._doSetupConfig());
  }

  private async _doSetupConfig(): Promise<DeployConfig> {
    const current = this.getConfig();

    if (current) {
      console.log(chalk.cyan('\n更新服务器连接信息'));
      console.log(chalk.gray('  （直接回车保留现有值，输入新值则覆盖）\n'));
    } else {
      console.log(chalk.cyan('\n配置服务器连接信息\n'));
    }

    // 服务器连接信息
    const serverAnswers = await inquirer.prompt([
      {
        type: 'input',
        name: 'host',
        message: '服务器 IP / 域名:',
        default: current?.server.host || '',
        validate: (v: string) => v.trim() !== '' || '主机地址不能为空',
      },
      {
        type: 'number',
        name: 'port',
        message: 'SSH 端口:',
        default: current?.server.port ?? DEFAULTS.port,
        validate: (v: number) => (v > 0 && v <= 65535) || '端口号范围 1-65535',
      },
      {
        type: 'input',
        name: 'username',
        message: 'SSH 用户名:',
        default: current?.server.username || DEFAULTS.username,
        validate: (v: string) => v.trim() !== '' || '用户名不能为空',
      },
      {
        type: 'list',
        name: 'authType',
        message: '认证方式:',
        choices: [
          { name: '私钥文件', value: 'privateKey' },
          { name: '密码', value: 'password' },
        ],
        default: current?.server.authType === 'password' ? 1 : 0,
      },
    ]);

    let authExtra: Partial<ServerConfig> = {};

    if (serverAnswers.authType === 'privateKey') {
      const { privateKeyPath } = await inquirer.prompt([
        {
          type: 'input',
          name: 'privateKeyPath',
          message: 'SSH 私钥文件路径:',
          default: current?.server.privateKeyPath || `${process.env.HOME || process.env.USERPROFILE || '~'}/.ssh/id_rsa`,
          validate: (v: string) => {
            if (!v.trim()) return '私钥路径不能为空';
            const expanded = v.replace(/^~/, process.env.HOME || process.env.USERPROFILE || '');
            return fs.existsSync(expanded) || `私钥文件不存在: ${expanded}`;
          },
        },
      ]);
      authExtra = {
        privateKeyPath: path.resolve(
          privateKeyPath.replace(/^~/, process.env.HOME || process.env.USERPROFILE || '')
        ),
      };
    } else {
      if (current?.server.password) {
        const { changePassword } = await inquirer.prompt([
          {
            type: 'confirm',
            name: 'changePassword',
            message: 'SSH 密码已配置，是否修改?',
            default: false,
          },
        ]);
        if (changePassword) {
          const { password } = await inquirer.prompt([
            {
              type: 'password',
              name: 'password',
              message: '新 SSH 密码:',
              mask: '*',
              validate: (v: string) => v.trim() !== '' || '密码不能为空',
            },
          ]);
          authExtra = { password };
        } else {
          authExtra = { password: current.server.password };
        }
      } else {
        const { password } = await inquirer.prompt([
          {
            type: 'password',
            name: 'password',
            message: 'SSH 密码:',
            mask: '*',
            validate: (v: string) => v.trim() !== '' || '密码不能为空',
          },
        ]);
        authExtra = { password };
      }
    }

    console.log(chalk.cyan('\n配置路径信息\n'));

    const pathAnswers = await inquirer.prompt([
      {
        type: 'input',
        name: 'nginxConfRemotePath',
        message: '远程 nginx 配置文件路径:',
        default: current?.nginxConfRemotePath || DEFAULTS.nginxConfRemotePath,
        validate: (v: string) => v.trim() !== '' || '不能为空',
      },
      {
        type: 'input',
        name: 'blogRemoteRoot',
        message: '远程博客静态文件根目录:',
        default: current?.blogRemoteRoot || DEFAULTS.blogRemoteRoot,
        validate: (v: string) => v.trim() !== '' || '不能为空',
      },
    ]);

    const server: ServerConfig = {
      host: serverAnswers.host.trim(),
      port: serverAnswers.port,
      username: serverAnswers.username.trim(),
      authType: serverAnswers.authType,
      ...authExtra,
    };

    const newConfig: DeployConfig = {
      server,
      nginxConfRemotePath: pathAnswers.nginxConfRemotePath.trim(),
      blogRemoteRoot: pathAnswers.blogRemoteRoot.trim(),
    };

    // 确认保存或取消
    const { confirmAction } = await inquirer.prompt([
      {
        type: 'list',
        name: 'confirmAction',
        message: '请选择下一步操作:',
        choices: [
          { name: '测试 SSH 连接并保存', value: 'test-save' },
          { name: '直接保存（跳过测试）', value: 'save' },
          { name: '取消，不保存', value: 'cancel' },
        ],
        default: 0,
      },
    ]);

    if (confirmAction === 'cancel') {
      throw new Error('配置已取消');
    }

    if (confirmAction === 'test-save') {
      const spinner = ora('正在测试 SSH 连接...').start();
      let client;
      try {
        client = await createSSHClient(server);
        await client.executeCommand('echo "connection ok"');
        spinner.succeed('SSH 连接测试通过');
      } catch (err) {
        spinner.fail('SSH 连接测试失败');
        console.log(chalk.red(`错误: ${err instanceof Error ? err.message : String(err)}`));

        const { saveAnyway } = await inquirer.prompt([
          {
            type: 'list',
            name: 'saveAnyway',
            message: '连接失败，如何处理?',
            choices: [
              { name: '仍然保存配置', value: 'save' },
              { name: '取消，不保存', value: 'cancel' },
            ],
            default: 1,
          },
        ]);
        if (saveAnyway === 'cancel') {
          throw new Error('配置已取消');
        }
      }

      // 验证远程路径是否存在
      if (client) {
        const remotePaths: Array<{ label: string; path: string }> = [
          { label: 'Nginx 配置目录', path: path.posix.dirname(newConfig.nginxConfRemotePath) },
          { label: '博客静态文件根目录', path: newConfig.blogRemoteRoot },
        ];

        const missingPaths: string[] = [];
        const checkSpinner = ora('正在验证远程路径...').start();
        for (const { label, path: remotePath } of remotePaths) {
          try {
            await client.executeCommand(`test -d ${remotePath}`);
          } catch {
            missingPaths.push(`  ${chalk.yellow('!')} ${label}: ${chalk.white(remotePath)}`);
          }
        }
        client.disconnect();

        if (missingPaths.length > 0) {
          checkSpinner.warn('以下远程路径不存在（目录将在首次部署时自动创建）:');
          missingPaths.forEach(msg => console.log(msg));
        } else {
          checkSpinner.succeed('远程路径验证通过');
        }
      }
    }

    this.saveConfig(newConfig);
    return newConfig;
  }

  /**
   * 打印当前配置信息
   */
  printConfig(): void {
    const config = this.getConfig();
    if (!config) {
      console.log(chalk.yellow('尚未配置，请先运行配置向导'));
      return;
    }
    const { server } = config;
    console.log(chalk.cyan('\n当前配置：'));
    console.log(`  服务器:             ${chalk.white(`${server.username}@${server.host}:${server.port}`)}`);
    console.log(`  认证方式:           ${chalk.white(server.authType === 'privateKey' ? `私钥 (${server.privateKeyPath})` : '密码')}`);
    console.log(`  Nginx 配置路径:     ${chalk.white(config.nginxConfRemotePath)}`);
    console.log(`  博客远程根目录:     ${chalk.white(config.blogRemoteRoot)}`);
    console.log('');
  }
}

export const configManager = new ConfigManager();
