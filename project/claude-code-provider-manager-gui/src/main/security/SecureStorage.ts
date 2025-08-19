import { Keytar } from 'keytar';
import { app } from 'electron';
import * as crypto from 'crypto';

// 安全存储接口
export interface SecureStorage {
  storePassword(service: string, account: string, password: string): Promise<void>;
  getPassword(service: string, account: string): Promise<string | null>;
  deletePassword(service: string, account: string): Promise<boolean>;
  encryptData(data: string): Promise<string>;
  decryptData(encryptedData: string): Promise<string>;
}

// 使用系统 keychain 的安全存储实现
export class SystemKeychainStorage implements SecureStorage {
  private serviceName: string;

  constructor() {
    this.serviceName = `claude-code-provider-manager-${app.getVersion()}`;
  }

  async storePassword(service: string, account: string, password: string): Promise<void> {
    try {
      await Keytar.setPassword(this.serviceName, `${service}:${account}`, password);
    } catch (error) {
      console.error('Failed to store password:', error);
      throw new Error('Failed to store sensitive data securely');
    }
  }

  async getPassword(service: string, account: string): Promise<string | null> {
    try {
      return await Keytar.getPassword(this.serviceName, `${service}:${account}`);
    } catch (error) {
      console.error('Failed to retrieve password:', error);
      throw new Error('Failed to retrieve sensitive data');
    }
  }

  async deletePassword(service: string, account: string): Promise<boolean> {
    try {
      return await Keytar.deletePassword(this.serviceName, `${service}:${account}`);
    } catch (error) {
      console.error('Failed to delete password:', error);
      return false;
    }
  }

  async encryptData(data: string): Promise<string> {
    // 生成加密密钥
    const machineId = this.getMachineId();
    const key = crypto.scryptSync(machineId, 'salt', 32);
    
    // 生成随机 IV
    const iv = crypto.randomBytes(16);
    
    // 加密数据
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
    let encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    // 获取认证标签
    const authTag = cipher.getAuthTag();
    
    // 组合 IV + 认证标签 + 加密数据
    return iv.toString('hex') + ':' + authTag.toString('hex') + ':' + encrypted;
  }

  async decryptData(encryptedData: string): Promise<string> {
    try {
      const parts = encryptedData.split(':');
      if (parts.length !== 3) {
        throw new Error('Invalid encrypted data format');
      }

      const iv = Buffer.from(parts[0], 'hex');
      const authTag = Buffer.from(parts[1], 'hex');
      const encrypted = parts[2];

      // 生成解密密钥
      const machineId = this.getMachineId();
      const key = crypto.scryptSync(machineId, 'salt', 32);

      // 解密数据
      const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
      decipher.setAuthTag(authTag);
      
      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      return decrypted;
    } catch (error) {
      console.error('Failed to decrypt data:', error);
      throw new Error('Failed to decrypt data');
    }
  }

  private getMachineId(): string {
    // 获取机器唯一标识符
    const platform = process.platform;
    let machineId = '';

    if (platform === 'win32') {
      // Windows: 使用计算机名 + 用户名
      machineId = `${process.env.COMPUTERNAME}-${process.env.USERNAME}`;
    } else if (platform === 'darwin') {
      // macOS: 使用主机名
      machineId = process.env.HOSTNAME || '';
    } else {
      // Linux: 使用主机名 + 用户ID
      machineId = `${process.env.HOSTNAME}-${process.getuid?.()}`;
    }

    return machineId || 'default-machine-id';
  }
}

// 文件系统存储作为后备方案
export class FileStorage implements SecureStorage {
  private storagePath: string;
  private fs: typeof import('fs');
  private path: typeof import('path');

  constructor(storagePath: string) {
    this.storagePath = storagePath;
    this.fs = require('fs');
    this.path = require('path');
  }

  async storePassword(service: string, account: string, password: string): Promise<void> {
    try {
      const encrypted = await this.encryptData(password);
      const filePath = this.getFilePath(service, account);
      
      // 确保目录存在
      const dir = this.path.dirname(filePath);
      if (!this.fs.existsSync(dir)) {
        this.fs.mkdirSync(dir, { recursive: true, mode: 0o700 });
      }
      
      // 写入文件
      this.fs.writeFileSync(filePath, encrypted, { mode: 0o600 });
    } catch (error) {
      console.error('Failed to store password to file:', error);
      throw new Error('Failed to store sensitive data');
    }
  }

  async getPassword(service: string, account: string): Promise<string | null> {
    try {
      const filePath = this.getFilePath(service, account);
      if (!this.fs.existsSync(filePath)) {
        return null;
      }
      
      const encrypted = this.fs.readFileSync(filePath, 'utf8');
      return await this.decryptData(encrypted);
    } catch (error) {
      console.error('Failed to retrieve password from file:', error);
      return null;
    }
  }

  async deletePassword(service: string, account: string): Promise<boolean> {
    try {
      const filePath = this.getFilePath(service, account);
      if (this.fs.existsSync(filePath)) {
        this.fs.unlinkSync(filePath);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to delete password file:', error);
      return false;
    }
  }

  async encryptData(data: string): Promise<string> {
    // 简单的 Base64 编码（生产环境应使用更安全的加密）
    return Buffer.from(data).toString('base64');
  }

  async decryptData(encryptedData: string): Promise<string> {
    return Buffer.from(encryptedData, 'base64').toString('utf8');
  }

  private getFilePath(service: string, account: string): string {
    const safeService = service.replace(/[^a-zA-Z0-9]/g, '_');
    const safeAccount = account.replace(/[^a-zA-Z0-9]/g, '_');
    return this.path.join(this.storagePath, `${safeService}_${safeAccount}.enc`);
  }
}

// 安全存储管理器
export class SecureStorageManager {
  private storage: SecureStorage;

  constructor(useKeychain: boolean = true, fallbackPath?: string) {
    if (useKeychain) {
      try {
        this.storage = new SystemKeychainStorage();
      } catch (error) {
        console.warn('Failed to initialize keychain, falling back to file storage:', error);
        this.storage = new FileStorage(fallbackPath || app.getPath('userData'));
      }
    } else {
      this.storage = new FileStorage(fallbackPath || app.getPath('userData'));
    }
  }

  // 存储提供商认证令牌
  async storeProviderToken(providerId: string, token: string): Promise<void> {
    await this.storage.storePassword('provider', providerId, token);
  }

  // 获取提供商认证令牌
  async getProviderToken(providerId: string): Promise<string | null> {
    return await this.storage.getPassword('provider', providerId);
  }

  // 删除提供商认证令牌
  async deleteProviderToken(providerId: string): Promise<boolean> {
    return await this.storage.deletePassword('provider', providerId);
  }

  // 存储加密的配置数据
  async storeEncryptedConfig(key: string, data: any): Promise<void> {
    const jsonData = JSON.stringify(data);
    const encrypted = await this.storage.encryptData(jsonData);
    await this.storage.storePassword('config', key, encrypted);
  }

  // 获取加密的配置数据
  async getEncryptedConfig(key: string): Promise<any | null> {
    const encrypted = await this.storage.getPassword('config', key);
    if (!encrypted) {
      return null;
    }
    
    try {
      const jsonData = await this.storage.decryptData(encrypted);
      return JSON.parse(jsonData);
    } catch (error) {
      console.error('Failed to decrypt config:', error);
      return null;
    }
  }

  // 存储系统设置
  async storeSystemSettings(settings: any): Promise<void> {
    await this.storeEncryptedConfig('system-settings', settings);
  }

  // 获取系统设置
  async getSystemSettings(): Promise<any | null> {
    return await this.getEncryptedConfig('system-settings');
  }

  // 清理所有存储的数据
  async clearAllData(): Promise<void> {
    // 这里需要根据具体的存储方式实现清理逻辑
    console.warn('Clear all data not implemented yet');
  }
}

// 导出单例实例
export const secureStorage = new SecureStorageManager();