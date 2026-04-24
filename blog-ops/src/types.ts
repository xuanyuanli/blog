/**
 * SSH 服务器连接配置
 */
export interface ServerConfig {
  /** SSH 主机地址 */
  host: string;
  /** SSH 端口号 */
  port: number;
  /** SSH 用户名 */
  username: string;
  /** 认证方式：私钥 或 密码 */
  authType: 'privateKey' | 'password';
  /** 私钥文件路径（authType 为 privateKey 时必填） */
  privateKeyPath?: string;
  /** 登录密码（authType 为 password 时必填） */
  password?: string;
}

/**
 * 博客部署配置（持久化到本地）
 */
export interface DeployConfig {
  /** 服务器连接信息 */
  server: ServerConfig;
  /** 远程 nginx 配置文件路径（默认 /usr/local/nginx/conf/nginx.conf） */
  nginxConfRemotePath: string;
  /** 远程博客静态文件根目录（默认 /var/www/blog） */
  blogRemoteRoot: string;
}

/**
 * 版本记录
 */
export interface VersionRecord {
  /** 项目名称（nextjs / vuepress） */
  project: string;
  /** 版本 tag（格式：yyyyMMdd-HHmm） */
  tag: string;
  /** 部署时间 */
  deployedAt: string;
  /** 归档路径 */
  archivePath?: string;
}

/**
 * 博客项目定义
 */
export interface BlogProject {
  /** 项目名称 */
  name: string;
  /** 相对于博客根目录的子目录路径 */
  dir: string;
  /** 是否为可选构建（旧博客为可选） */
  optional: boolean;
}

/**
 * 文件传输进度回调
 */
export type ProgressCallback = (uploaded: number, total: number) => void;
