import { Client, ConnectConfig } from 'ssh2';
import fs from 'fs';
import path from 'path';
import { ServerConfig, ProgressCallback } from './types.js';

/**
 * SSH 连接和文件传输类
 * 支持私钥和密码两种认证方式
 */
export class SSHClient {
  private client: Client;
  private config: ServerConfig;

  constructor(config: ServerConfig) {
    this.client = new Client();
    this.config = config;
  }

  /**
   * 连接到 SSH 服务器
   */
  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      const connectConfig: ConnectConfig = {
        host: this.config.host,
        port: this.config.port,
        username: this.config.username,
        readyTimeout: 30000,
      };

      if (this.config.authType === 'privateKey') {
        if (!this.config.privateKeyPath) {
          reject(new Error('私钥路径未配置'));
          return;
        }
        if (!fs.existsSync(this.config.privateKeyPath)) {
          reject(new Error(`私钥文件不存在: ${this.config.privateKeyPath}`));
          return;
        }
        connectConfig.privateKey = fs.readFileSync(this.config.privateKeyPath);
      } else {
        if (!this.config.password) {
          reject(new Error('密码未配置'));
          return;
        }
        connectConfig.password = this.config.password;
      }

      this.client.on('ready', () => {
        resolve();
      });

      this.client.on('error', (err) => {
        reject(err);
      });

      this.client.connect(connectConfig);
    });
  }

  /**
   * 上传单个文件到远程服务器
   */
  async uploadFile(localPath: string, remotePath: string, onProgress?: ProgressCallback): Promise<void> {
    return new Promise((resolve, reject) => {
      this.client.sftp((err, sftp) => {
        if (err) {
          reject(err);
          return;
        }

        // 确保远程目录存在
        const remoteDir = path.posix.dirname(remotePath);
        sftp.mkdir(remoteDir, { mode: 0o755 }, () => {
          // 忽略目录已存在的错误
          const fileSize = fs.statSync(localPath).size;
          let uploadedBytes = 0;

          const readStream = fs.createReadStream(localPath);
          const writeStream = sftp.createWriteStream(remotePath);

          readStream.on('data', (chunk: Buffer | string) => {
            uploadedBytes += typeof chunk === 'string' ? Buffer.byteLength(chunk) : chunk.length;
            if (onProgress) {
              onProgress(uploadedBytes, fileSize);
            }
          });

          readStream.on('error', (error: Error) => {
            writeStream.destroy();
            sftp.end();
            reject(error);
          });

          writeStream.on('error', (error: Error) => {
            sftp.end();
            reject(error);
          });

          writeStream.on('close', () => {
            // 上传完成后校验远程文件大小
            sftp.stat(remotePath, (statErr, stats) => {
              sftp.end();
              if (statErr) {
                reject(new Error(`上传后校验失败: ${statErr.message}`));
              } else if (stats.size !== fileSize) {
                reject(new Error(`文件大小不一致: 本地 ${fileSize} 字节, 远程 ${stats.size} 字节`));
              } else {
                resolve();
              }
            });
          });

          readStream.pipe(writeStream);
        });
      });
    });
  }

  /**
   * 执行远程命令，返回完整输出
   */
  async executeCommand(command: string): Promise<string> {
    return new Promise((resolve, reject) => {
      this.client.exec(command, (err, stream) => {
        if (err) {
          reject(err);
          return;
        }

        let stdout = '';
        let stderr = '';

        stream.on('close', (code: number) => {
          if (code !== 0) {
            reject(new Error(`命令执行失败 (exit code ${code}): ${stderr}`));
          } else {
            resolve(stdout);
          }
        });

        stream.on('data', (data: Buffer) => {
          stdout += data.toString();
        });

        stream.stderr.on('data', (data: Buffer) => {
          stderr += data.toString();
        });
      });
    });
  }

  /**
   * 执行远程命令，实时流式输出到控制台
   */
  async executeCommandStream(command: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.client.exec(command, (err, stream) => {
        if (err) {
          reject(err);
          return;
        }

        stream.on('close', (code: number) => {
          if (code !== 0) {
            reject(new Error(`远程命令执行失败 (exit code ${code})`));
          } else {
            resolve();
          }
        });

        stream.on('data', (data: Buffer) => {
          process.stdout.write(data);
        });

        stream.stderr.on('data', (data: Buffer) => {
          process.stderr.write(data);
        });
      });
    });
  }

  /**
   * 确保远程目录存在（递归创建）
   */
  async ensureRemoteDir(remotePath: string): Promise<void> {
    await this.executeCommand(`mkdir -p ${remotePath}`);
  }

  /**
   * 断开连接
   */
  disconnect(): void {
    this.client.end();
  }
}

/**
 * 创建 SSH 客户端并连接
 */
export async function createSSHClient(config: ServerConfig): Promise<SSHClient> {
  const client = new SSHClient(config);
  await client.connect();
  return client;
}

/**
 * 格式化字节大小
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
}
