/**
 * SSH 连接配置接口
 */
export interface SSHConfig {
  /**
   * SSH 主机地址
   */
  host: string;
  
  /**
   * SSH 端口号
   */
  port: number;
  
  /**
   * SSH 用户名
   */
  username: string;
  
  /**
   * SSH 私钥文件路径
   */
  privateKeyPath: string;
  
  /**
   * 本地目录路径
   */
  localDir: string;
  
  /**
   * 远程目录路径
   */
  remoteDir: string;
}

/**
 * 传输进度回调函数类型
 */
export type ProgressCallback = (progress: number, total: number) => void;

/**
 * 压缩选项接口
 */
export interface CompressOptions {
  /**
   * 源目录路径
   */
  sourceDir: string;
  
  /**
   * 输出 zip 文件路径
   */
  outputPath: string;
  
  /**
   * 排除的文件/目录模式列表
   */
  exclude?: string[];
}
