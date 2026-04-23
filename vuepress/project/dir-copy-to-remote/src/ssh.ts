import { Client, ConnectConfig } from 'ssh2';
import fs from 'fs';
import path from 'path';
import { SSHConfig, ProgressCallback } from './types.js';

/**
 * SSH 连接和文件传输类
 */
export class SSHClient {
  private client: Client;
  private config: SSHConfig;

  constructor(config: SSHConfig) {
    this.client = new Client();
    this.config = config;
  }

  /**
   * 连接到 SSH 服务器
   */
  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!fs.existsSync(this.config.privateKeyPath)) {
        reject(new Error(`私钥文件不存在: ${this.config.privateKeyPath}`));
        return;
      }

      const privateKey = fs.readFileSync(this.config.privateKeyPath);

      const connectConfig: ConnectConfig = {
        host: this.config.host,
        port: this.config.port,
        username: this.config.username,
        privateKey: privateKey,
        readyTimeout: 30000,
      };

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
   * 上传文件到远程服务器
   */
  async uploadFile(localPath: string, remotePath: string, onProgress?: ProgressCallback): Promise<void> {
    return new Promise((resolve, reject) => {
      this.client.sftp((err, sftp) => {
        if (err) {
          reject(err);
          return;
        }

        const fileSize = fs.statSync(localPath).size;
        let uploadedBytes = 0;

        const readStream = fs.createReadStream(localPath);
        const writeStream = sftp.createWriteStream(remotePath);

        readStream.on('data', (chunk) => {
          uploadedBytes += chunk.length;
          if (onProgress) {
            onProgress(uploadedBytes, fileSize);
          }
        });

        writeStream.on('close', () => {
          sftp.end();
          resolve();
        });

        writeStream.on('error', (error: Error) => {
          sftp.end();
          reject(error);
        });

        readStream.pipe(writeStream);
      });
    });
  }

  /**
   * 执行远程命令
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
   * 关闭连接
   */
  disconnect(): void {
    this.client.end();
  }

  /**
   * 完整的目录传输流程
   */
  async transferDirectory(zipPath: string, onProgress?: ProgressCallback): Promise<void> {
    const remoteZipPath = path.posix.join(this.config.remoteDir, 'upload.zip');
    
    await this.uploadFile(zipPath, remoteZipPath, onProgress);

    const unzipCommand = `cd ${this.config.remoteDir} && unzip -o upload.zip && rm upload.zip`;
    await this.executeCommand(unzipCommand);
  }
}

/**
 * 创建 SSH 客户端并连接
 */
export async function createSSHClient(config: SSHConfig): Promise<SSHClient> {
  const client = new SSHClient(config);
  await client.connect();
  return client;
}
