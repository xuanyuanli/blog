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
const IMAGE_NAME = 'weekly-rotation';
const CONTAINER_NAME = 'weekly-rotation';

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
 * 打包部署产物：dist/ + package.json + package-lock.json + Dockerfile
 */
async function compressArtifacts(projectDir: string, outputPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const output = fs.createWriteStream(outputPath);
    const archive = archiver('zip', { zlib: { level: 6 } });

    output.on('close', () => resolve());
    archive.on('error', reject);
    archive.pipe(output);

    archive.directory(path.join(projectDir, 'dist'), 'dist');
    for (const file of ['package.json', 'package-lock.json', 'Dockerfile']) {
      const full = path.join(projectDir, file);
      if (fs.existsSync(full)) {
        archive.file(full, { name: file });
      }
    }
    archive.finalize();
  });
}

/**
 * 部署周线轮动服务（Docker 方式，远程无需 Node 环境）：
 * 本地构建 → 上传产物 + Dockerfile → 远程 docker build → 写 .env → 重建容器
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
  console.log(`  ${chalk.white(PROJECT_NAME)}  →  ${chalk.gray(REMOTE_DIR)}（Docker 容器 ${CONTAINER_NAME}）`);

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
      await client.executeCommand('command -v docker');
    } catch {
      throw new Error('远程服务器未安装 docker，请先安装 Docker');
    }
    try {
      await client.executeCommand('command -v unzip');
    } catch {
      const installSpinner = ora('unzip 未安装，正在安装...').start();
      await client.executeCommand('yum install -y unzip || apt-get install -y unzip');
      installSpinner.succeed('unzip 安装完成');
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

    // 解压（只更新构建上下文，保留 .env / data/ 持久化目录）
    const deploySpinner = ora(`[${PROJECT_NAME}] 部署到 ${REMOTE_DIR}...`).start();
    await client.ensureRemoteDir(REMOTE_DIR);
    await client.ensureRemoteDir(`${REMOTE_DIR}/data`);
    await client.executeCommand(`rm -rf ${REMOTE_DIR}/dist`);
    await client.executeCommand(`unzip -o ${remoteZipPath} -d ${REMOTE_DIR}`);
    await client.executeCommand(`rm -f ${remoteZipPath}`);
    deploySpinner.succeed(`[${PROJECT_NAME}] 文件已部署`);

    // 通知密钥注入，优先级：
    // 1. 服务器已配置的环境变量 SERVERCHAN_SENDKEY → docker run 包在 bash -lc 里，
    //    由远程 login shell 展开 -e SERVERCHAN_SENDKEY="$SERVERCHAN_SENDKEY"（值不经过本工具）
    // 2. bops 本地 conf 的 SendKey → 写远程 .env → docker run --env-file
    // 3. 远程已有 .env（历史部署留下）→ docker run --env-file
    const hasRemoteKey = await client
      .executeCommand(`bash -lc 'test -n "$SERVERCHAN_SENDKEY"' 2>/dev/null && echo yes`)
      .then((out) => out.trim() === 'yes')
      .catch(() => false);

    let envArg = '';
    let runInLoginShell = false;
    if (hasRemoteKey) {
      envArg = `-e SERVERCHAN_SENDKEY="$SERVERCHAN_SENDKEY" `;
      runInLoginShell = true;
      console.log(
        chalk.green(`[${PROJECT_NAME}] 使用服务器环境变量 SERVERCHAN_SENDKEY 注入容器`)
      );
    } else if (config.serverChanSendKey) {
      await client.executeCommand(
        `cat > ${REMOTE_DIR}/.env <<'BOPS_EOF'\nSERVERCHAN_SENDKEY=${config.serverChanSendKey}\nBOPS_EOF`
      );
      await client.executeCommand(`chmod 600 ${REMOTE_DIR}/.env`);
      envArg = `--env-file ${REMOTE_DIR}/.env `;
      console.log(chalk.green(`[${PROJECT_NAME}] .env 已写入（含 SERVERCHAN_SENDKEY，权限 600）`));
    } else {
      const hasRemoteEnv = await client
        .executeCommand(`test -f ${REMOTE_DIR}/.env && echo yes`)
        .then((out) => out.trim() === 'yes')
        .catch(() => false);
      if (hasRemoteEnv) {
        envArg = `--env-file ${REMOTE_DIR}/.env `;
      } else {
        console.log(
          chalk.yellow(
            `[${PROJECT_NAME}] 警告: 服务器无 SERVERCHAN_SENDKEY 环境变量、bops 未配置 SendKey 且远程无 .env，将不会推送通知`
          )
        );
      }
    }

    // 构建镜像
    console.log(chalk.cyan(`[${PROJECT_NAME}] 远程构建 Docker 镜像...`));
    await client.executeCommandStream(
      `cd ${REMOTE_DIR} && docker build -t ${IMAGE_NAME}:latest .`
    );

    // 清理历史 systemd 部署残留（早期方案，容错处理）
    await client
      .executeCommand(
        `systemctl disable --now ${CONTAINER_NAME} 2>/dev/null; rm -f /etc/systemd/system/${CONTAINER_NAME}.service; systemctl daemon-reload`
      )
      .catch(() => undefined);

    // 重建容器
    const runSpinner = ora(`[${PROJECT_NAME}] 重建容器...`).start();
    await client.executeCommand(`docker rm -f ${CONTAINER_NAME} 2>/dev/null || true`);
    const runCmd =
      `docker run -d --name ${CONTAINER_NAME} --restart unless-stopped ` +
      envArg +
      `-v ${REMOTE_DIR}/data:/data ${IMAGE_NAME}:latest`;
    // login shell 才能加载 /etc/profile 等处配置的 SERVERCHAN_SENDKEY
    await client.executeCommand(runInLoginShell ? `bash -lc '${runCmd}'` : runCmd);
    runSpinner.succeed(`[${PROJECT_NAME}] 容器已启动`);

    // 确认存活
    await new Promise((r) => setTimeout(r, 3000));
    const running = await client
      .executeCommand(`docker inspect -f '{{.State.Running}}' ${CONTAINER_NAME}`)
      .then((out) => out.trim() === 'true')
      .catch(() => false);
    if (running) {
      console.log(chalk.green(`[${PROJECT_NAME}] 容器运行中`));
      const logs = await client
        .executeCommand(`docker logs --tail 5 ${CONTAINER_NAME} 2>&1 || true`)
        .catch(() => '');
      if (logs) console.log(chalk.gray(logs));
    } else {
      const logs = await client
        .executeCommand(`docker logs --tail 30 ${CONTAINER_NAME} 2>&1 || true`)
        .catch(() => '');
      throw new Error(`容器未能正常运行\n最近日志:\n${logs}`);
    }

    // 清理悬空旧镜像
    await client.executeCommand('docker image prune -f').catch(() => undefined);

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
