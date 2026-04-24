import inquirer from 'inquirer';
import chalk from 'chalk';
import ora from 'ora';
import path from 'path';
import fs from 'fs';
import os from 'os';
import archiver from 'archiver';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { DeployConfig, BlogProject } from './types.js';
import { createSSHClient, formatBytes } from './ssh.js';
import { VersionManager } from './version-manager.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** 项目根目录（blog-ops 的上级，即博客仓库根目录） */
const ROOT_DIR = path.resolve(__dirname, '../..');

/**
 * 博客项目列表
 * nextjs: 新博客（必选）
 * vuepress: 旧博客（可选，部署到 /archive/ 子路径）
 */
const BLOG_PROJECTS: BlogProject[] = [
  {
    name: 'nextjs',
    dir: 'nextjs',
    optional: false,
  },
  {
    name: 'vuepress',
    dir: 'vuepress',
    optional: true,
  },
];

/** 归档根目录 */
const ARCHIVES_ROOT = '/data/deploy/blog-archives';
/** 最大归档版本数 */
const MAX_ARCHIVE_VERSIONS = 5;

/**
 * 执行本地命令（实时输出）
 */
function runLocal(cmd: string, args: string[], cwd: string): Promise<number> {
  return new Promise((resolve, reject) => {
    const proc = spawn(cmd, args, {
      cwd,
      stdio: 'inherit',
      shell: process.platform === 'win32',
    });
    proc.on('error', (err) => reject(new Error(`命令启动失败: ${err.message}`)));
    proc.on('close', (code) => resolve(code ?? 0));
  });
}

/**
 * 压缩目录为 zip 文件
 */
async function compressDir(sourceDir: string, outputPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (!fs.existsSync(sourceDir)) {
      reject(new Error(`目录不存在: ${sourceDir}`));
      return;
    }

    const output = fs.createWriteStream(outputPath);
    const archive = archiver('zip', { zlib: { level: 6 } });

    output.on('close', () => resolve());
    archive.on('error', reject);

    archive.pipe(output);
    archive.glob('**/*', {
      cwd: sourceDir,
      dot: true,
    });
    archive.finalize();
  });
}

/**
 * 生成当前时间 tag（格式：yyyyMMdd-HHmm）
 */
function generateTag(): string {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}`;
}

/**
 * 博客构建与部署主流程
 * @param config 环境配置
 * @param options 部署选项
 */
export async function blogDeploy(
  config: DeployConfig,
  options: {
    /** 要部署的项目列表 */
    projects: ('nextjs' | 'vuepress')[];
    /** 是否跳过构建（直接部署已有产物） */
    skipBuild: boolean;
    /** 是否跳过确认 */
    skipConfirm: boolean;
  } = { projects: ['nextjs'], skipBuild: false, skipConfirm: false }
): Promise<void> {
  // 确定要部署的项目
  const selectedProjects = BLOG_PROJECTS.filter((p) => options.projects.includes(p.name as 'nextjs' | 'vuepress'));

  // 显示操作信息
  console.log(chalk.yellow('\n即将执行：'));
  console.log(`  目标服务器: ${chalk.white(`${config.server.username}@${config.server.host}`)}`);
  for (const p of selectedProjects) {
    const remoteDesc = p.name === 'nextjs'
      ? config.blogRemoteRoot
      : `${config.blogRemoteRoot}/archive/`;
    console.log(`  ${chalk.white(p.name)}  →  ${chalk.gray(remoteDesc)}`);
  }

  if (!options.skipConfirm) {
    const { confirmed } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'confirmed',
        message: '确认执行?',
        default: true,
      },
    ]);
    if (!confirmed) {
      console.log(chalk.yellow('已取消'));
      return;
    }
  }

  // SSH 连接（提前建立，复用连接）
  const connectSpinner = ora('连接 SSH...').start();
  const client = await createSSHClient(config.server);
  connectSpinner.succeed('SSH 连接成功');

  // 检测 unzip，不存在则自动安装
  try {
    await client.executeCommand('command -v unzip');
  } catch {
    const installSpinner = ora('unzip 未安装，正在安装...').start();
    try {
      await client.executeCommand('yum install -y unzip || apt-get install -y unzip');
      installSpinner.succeed('unzip 安装完成');
    } catch (err) {
      installSpinner.fail('unzip 安装失败');
      throw err;
    }
  }

  try {
    const tag = generateTag();

    for (const project of selectedProjects) {
      const projectDir = path.join(ROOT_DIR, project.dir);

      if (!fs.existsSync(projectDir)) {
        throw new Error(`[${project.name}] 本地项目目录不存在: ${projectDir}`);
      }

      // 确定构建产物目录
      const distDir = project.name === 'nextjs'
        ? path.join(projectDir, 'out')
        : path.join(projectDir, 'docs', '.vuepress', 'dist');

      // 构建（除非跳过）
      if (!options.skipBuild) {
        console.log(chalk.cyan(`\n[${project.name}] 开始构建\n`));

        const buildCmd = project.name === 'nextjs' ? 'npm run build' : 'npm run build';
        console.log(chalk.green(`执行 ${buildCmd}...`));
        const buildCode = await runLocal('npm', ['run', 'build'], projectDir);
        if (buildCode !== 0) {
          throw new Error(`[${project.name}] 构建失败 (exit code ${buildCode})`);
        }
      }

      if (!fs.existsSync(distDir)) {
        throw new Error(`[${project.name}] 构建产物目录不存在: ${distDir}，请先构建项目`);
      }

      // 压缩 dist
      const zipName = `${project.name}-${Date.now()}.zip`;
      const zipPath = path.join(os.tmpdir(), zipName);
      const compressSpinner = ora(`[${project.name}] 压缩构建产物...`).start();
      await compressDir(distDir, zipPath);
      const zipSize = fs.statSync(zipPath).size;
      compressSpinner.succeed(`[${project.name}] 压缩完成 (${formatBytes(zipSize)})`);

      // 确定远程目标目录
      const remoteTargetDir = project.name === 'nextjs'
        ? config.blogRemoteRoot
        : `${config.blogRemoteRoot}/archive/`;
      const remoteZipPath = `/tmp/${zipName}`;

      // 上传 zip
      const uploadSpinner = ora(`[${project.name}] 上传到服务器...`).start();
      let lastProgress = 0;
      await client.uploadFile(zipPath, remoteZipPath, (uploaded, total) => {
        const pct = Math.floor((uploaded / total) * 100);
        if (pct > lastProgress) {
          lastProgress = pct;
          uploadSpinner.text = `[${project.name}] 上传到服务器... ${pct}% (${formatBytes(uploaded)}/${formatBytes(total)})`;
        }
      });
      uploadSpinner.succeed(`[${project.name}] 上传完成`);

      // 归档当前版本（在清空目标目录之前）
      const archiveDir = `${ARCHIVES_ROOT}/${project.name}/${tag}`;
      const archiveSpinner = ora(`[${project.name}] 归档当前版本到 ${archiveDir}...`).start();
      try {
        const hasContent = await client.executeCommand(`ls -A ${remoteTargetDir} 2>/dev/null | head -1`).catch(() => '');
        if (hasContent.trim()) {
          await client.executeCommand(`mkdir -p ${archiveDir}`);
          await client.executeCommand(`cp -r ${remoteTargetDir}/* ${archiveDir}/ 2>/dev/null || true`);
          archiveSpinner.succeed(`[${project.name}] 已归档到 ${archiveDir}`);
        } else {
          archiveSpinner.succeed(`[${project.name}] 目标目录为空，跳过归档`);
        }
      } catch {
        archiveSpinner.warn(`[${project.name}] 归档失败（不影响部署）`);
      }

      // 清理老版本归档
      try {
        await client.executeCommand(
          `cd ${ARCHIVES_ROOT}/${project.name} 2>/dev/null && ls -dt */ 2>/dev/null | tail -n +${MAX_ARCHIVE_VERSIONS + 1} | xargs rm -rf 2>/dev/null || true`
        );
      } catch {
        // 清理失败不影响部署
      }

      // 远程解压（先清空目标目录再解压）
      const deploySpinner = ora(`[${project.name}] 部署到 ${remoteTargetDir}...`).start();
      await client.ensureRemoteDir(remoteTargetDir);
      // 清空目标目录内容（保留目录本身）
      await client.executeCommand(`rm -rf ${remoteTargetDir}/* ${remoteTargetDir}/.[!.]* 2>/dev/null || true`);
      // 解压
      await client.executeCommand(`unzip -o ${remoteZipPath} -d ${remoteTargetDir}`);
      // 清理临时 zip
      await client.executeCommand(`rm -f ${remoteZipPath}`);
      deploySpinner.succeed(`[${project.name}] 已部署到 ${remoteTargetDir}`);

      // 清理本地临时 zip
      fs.unlinkSync(zipPath);

      console.log(chalk.green(`[${project.name}] 发布完成`));

      // 记录版本
      const versionMgr = new VersionManager(client);
      await versionMgr.recordVersion({
        project: project.name,
        tag,
        deployedAt: new Date().toISOString(),
        archivePath: `${ARCHIVES_ROOT}/${project.name}/${tag}`,
      });
    }

    console.log(chalk.green('\n所有博客项目发布完成！'));
  } finally {
    client.disconnect();
  }
}
