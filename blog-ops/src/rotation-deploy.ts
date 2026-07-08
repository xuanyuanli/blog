import chalk from 'chalk';
import ora from 'ora';
import path from 'path';
import fs from 'fs';
import os from 'os';
import archiver from 'archiver';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { DeployConfig } from './types.js';
import { createSSHClient, formatBytes } from './ssh.js';
import { VersionManager } from './version-manager.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(__dirname, '../..');

const PROJECT_NAME = 'weekly-rotation';
const REMOTE_DIR = '/data/apps/weekly-rotation';
const SERVICE_NAME = 'weekly-rotation';
const SERVICE_REMOTE_PATH = `/etc/systemd/system/${SERVICE_NAME}.service`;

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
 * 打包部署产物：dist/ + package.json + package-lock.json + systemd 单元
 */
async function compressArtifacts(projectDir: string, outputPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const output = fs.createWriteStream(outputPath);
    const archive = archiver('zip', { zlib: { level: 6 } });

    output.on('close', () => resolve());
    archive.on('error', reject);
    archive.pipe(output);

    archive.directory(path.join(projectDir, 'dist'), 'dist');
    for (const file of ['package.json', 'package-lock.json', `${SERVICE_NAME}.service`]) {
      const full = path.join(projectDir, file);
      if (fs.existsSync(full)) {
        archive.file(full, { name: file });
      }
    }
    archive.finalize();
  });
}

/**
 * 部署周线轮动服务：
 * 本地构建 → 上传 → 远程 npm install → 写 config.json → 安装 systemd 服务并重启
 */
export async function rotationDeploy(
  config: DeployConfig,
  options: { skipBuild: boolean }
): Promise<void> {
  const projectDir = path.join(ROOT_DIR, PROJECT_NAME);
  if (!fs.existsSync(projectDir)) {
    throw new Error(`本地项目目录不存在: ${projectDir}`);
  }

  console.log(chalk.yellow('\n即将执行：'));
  console.log(`  目标服务器: ${chalk.white(`${config.server.username}@${config.server.host}`)}`);
  console.log(`  ${chalk.white(PROJECT_NAME)}  →  ${chalk.gray(REMOTE_DIR)}（systemd 服务 ${SERVICE_NAME}）`);

  // 本地构建
  if (!options.skipBuild) {
    console.log(chalk.cyan(`\n[${PROJECT_NAME}] 开始构建\n`));
    const buildCode = await runLocal('npm', ['run', 'build'], projectDir);
    if (buildCode !== 0) {
      throw new Error(`[${PROJECT_NAME}] 构建失败 (exit code ${buildCode})`);
    }
  }

  const distDir = path.join(projectDir, 'dist');
  if (!fs.existsSync(distDir)) {
    throw new Error(`[${PROJECT_NAME}] 构建产物目录不存在: ${distDir}，请先构建`);
  }

  // 压缩
  const zipName = `${PROJECT_NAME}-${Date.now()}.zip`;
  const zipPath = path.join(os.tmpdir(), zipName);
  const compressSpinner = ora(`[${PROJECT_NAME}] 压缩部署产物...`).start();
  await compressArtifacts(projectDir, zipPath);
  compressSpinner.succeed(
    `[${PROJECT_NAME}] 压缩完成 (${formatBytes(fs.statSync(zipPath).size)})`
  );

  const connectSpinner = ora('连接 SSH...').start();
  const client = await createSSHClient(config.server);
  connectSpinner.succeed('SSH 连接成功');

  try {
    // 依赖检测
    try {
      await client.executeCommand('command -v unzip');
    } catch {
      const installSpinner = ora('unzip 未安装，正在安装...').start();
      await client.executeCommand('yum install -y unzip || apt-get install -y unzip');
      installSpinner.succeed('unzip 安装完成');
    }
    try {
      await client.executeCommand('command -v node && command -v npm');
    } catch {
      throw new Error('远程服务器未安装 node/npm，请先安装 Node.js >= 18');
    }

    // 上传
    const remoteZipPath = `/tmp/${zipName}`;
    const uploadSpinner = ora(`[${PROJECT_NAME}] 上传到服务器...`).start();
    let lastProgress = 0;
    await client.uploadFile(zipPath, remoteZipPath, (uploaded, total) => {
      const pct = Math.floor((uploaded / total) * 100);
      if (pct > lastProgress) {
        lastProgress = pct;
        uploadSpinner.text = `[${PROJECT_NAME}] 上传到服务器... ${pct}%`;
      }
    });
    uploadSpinner.succeed(`[${PROJECT_NAME}] 上传完成`);

    // 解压（只更新 dist 和包描述文件，保留 config.json / state.json / node_modules / 日志）
    const deploySpinner = ora(`[${PROJECT_NAME}] 部署到 ${REMOTE_DIR}...`).start();
    await client.ensureRemoteDir(REMOTE_DIR);
    await client.executeCommand(`rm -rf ${REMOTE_DIR}/dist`);
    await client.executeCommand(`unzip -o ${remoteZipPath} -d ${REMOTE_DIR}`);
    await client.executeCommand(`rm -f ${remoteZipPath}`);
    deploySpinner.succeed(`[${PROJECT_NAME}] 文件已部署`);

    // 安装生产依赖
    console.log(chalk.cyan(`[${PROJECT_NAME}] 远程安装依赖...`));
    await client.executeCommandStream(
      `cd ${REMOTE_DIR} && npm install --omit=dev --no-audit --no-fund`
    );

    // 写运行时配置（含 Server酱 SendKey）
    if (config.serverChanSendKey) {
      const configJson = JSON.stringify(
        { serverChanSendKey: config.serverChanSendKey },
        null,
        2
      );
      await client.executeCommand(
        `cat > ${REMOTE_DIR}/config.json <<'BOPS_EOF'\n${configJson}\nBOPS_EOF`
      );
      console.log(chalk.green(`[${PROJECT_NAME}] config.json 已写入（含 Server酱 SendKey）`));
    } else {
      const hasRemoteConfig = await client
        .executeCommand(`test -f ${REMOTE_DIR}/config.json && echo yes`)
        .then((out) => out.trim() === 'yes')
        .catch(() => false);
      if (!hasRemoteConfig) {
        console.log(
          chalk.yellow(
            `[${PROJECT_NAME}] 警告: 未配置 Server酱 SendKey 且远程无 config.json，将不会推送通知（可运行 bops 配置向导补充）`
          )
        );
      }
    }

    // 安装/更新 systemd 服务并重启
    const serviceSpinner = ora(`[${PROJECT_NAME}] 更新 systemd 服务...`).start();
    await client.executeCommand(
      `cp ${REMOTE_DIR}/${SERVICE_NAME}.service ${SERVICE_REMOTE_PATH}`
    );
    await client.executeCommand('systemctl daemon-reload');
    await client.executeCommand(`systemctl enable ${SERVICE_NAME}`);
    await client.executeCommand(`systemctl restart ${SERVICE_NAME}`);
    serviceSpinner.succeed(`[${PROJECT_NAME}] 服务已重启`);

    // 确认存活
    await new Promise((r) => setTimeout(r, 2000));
    const active = await client
      .executeCommand(`systemctl is-active ${SERVICE_NAME}`)
      .then((out) => out.trim())
      .catch(() => 'failed');
    if (active === 'active') {
      console.log(chalk.green(`[${PROJECT_NAME}] 服务运行中`));
      const status = await client
        .executeCommand(`systemctl status ${SERVICE_NAME} --no-pager -n 5 || true`)
        .catch(() => '');
      if (status) console.log(chalk.gray(status));
    } else {
      const log = await client
        .executeCommand(`tail -n 30 ${REMOTE_DIR}/${SERVICE_NAME}.log 2>/dev/null || true`)
        .catch(() => '');
      throw new Error(
        `服务未能正常启动（状态: ${active}）\n最近日志:\n${log}`
      );
    }

    // 记录版本
    const tag = (() => {
      const now = new Date();
      const pad = (n: number) => String(n).padStart(2, '0');
      return `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}`;
    })();
    const versionMgr = new VersionManager(client);
    await versionMgr.recordVersion({
      project: PROJECT_NAME,
      tag,
      deployedAt: new Date().toISOString(),
    });

    console.log(chalk.green(`\n[${PROJECT_NAME}] 发布完成！`));
  } finally {
    fs.unlinkSync(zipPath);
    client.disconnect();
  }
}
