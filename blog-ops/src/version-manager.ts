import chalk from 'chalk';
import { SSHClient } from './ssh.js';
import { VersionRecord } from './types.js';

/** 远程版本文件路径 */
const VERSIONS_FILE = '/data/deploy/blog-versions.json';
/** 每个项目最大保留版本数 */
const MAX_VERSIONS_PER_PROJECT = 20;

/**
 * 远程版本管理器
 * 在服务器上维护 /data/deploy/blog-versions.json，记录博客部署版本历史
 */
export class VersionManager {
  private client: SSHClient;

  constructor(client: SSHClient) {
    this.client = client;
  }

  /**
   * 读取远程 versions.json
   */
  async readVersions(): Promise<Record<string, VersionRecord[]>> {
    try {
      await this.client.executeCommand(`test -f ${VERSIONS_FILE}`);
      const content = await this.client.executeCommand(`cat ${VERSIONS_FILE}`);
      return JSON.parse(content.trim());
    } catch {
      return {};
    }
  }

  /**
   * 写入远程 versions.json
   */
  private async writeVersions(data: Record<string, VersionRecord[]>): Promise<void> {
    await this.client.executeCommand(`mkdir -p $(dirname ${VERSIONS_FILE})`);
    const json = JSON.stringify(data, null, 2);
    // 使用 heredoc 写入 JSON 文件，避免转义问题
    await this.client.executeCommand(`cat > ${VERSIONS_FILE} << 'VERSIONS_EOF'\n${json}\nVERSIONS_EOF`);
  }

  /**
   * 记录新版本
   */
  async recordVersion(record: VersionRecord): Promise<void> {
    const data = await this.readVersions();
    if (!data[record.project]) {
      data[record.project] = [];
    }
    // 头部插入（最新的在前）
    data[record.project].unshift(record);
    // 保留最近 N 个版本
    if (data[record.project].length > MAX_VERSIONS_PER_PROJECT) {
      data[record.project] = data[record.project].slice(0, MAX_VERSIONS_PER_PROJECT);
    }
    await this.writeVersions(data);
  }

  /**
   * 获取指定项目的版本历史
   */
  async listVersions(project?: string): Promise<Record<string, VersionRecord[]>> {
    const data = await this.readVersions();
    if (project) {
      return { [project]: data[project] || [] };
    }
    return data;
  }

  /**
   * 打印版本历史到控制台
   */
  static printVersions(data: Record<string, VersionRecord[]>): void {
    const projects = Object.keys(data);
    if (projects.length === 0) {
      console.log(chalk.yellow('暂无版本记录'));
      return;
    }

    for (const project of projects) {
      const records = data[project];
      console.log(chalk.cyan(`\n${project}`) + chalk.gray(` (${records.length} 个版本)`));
      if (records.length === 0) {
        console.log(chalk.gray('  暂无版本记录'));
        continue;
      }
      for (let i = 0; i < records.length; i++) {
        const r = records[i];
        const prefix = i === 0 ? chalk.green('  ★ ') : '    ';
        const tagStr = chalk.white(r.tag);
        const timeStr = chalk.gray(r.deployedAt);
        const archiveStr = r.archivePath ? chalk.gray(` → ${r.archivePath}`) : '';
        console.log(`${prefix}${tagStr}  ${timeStr}${archiveStr}`);
      }
    }
  }
}
