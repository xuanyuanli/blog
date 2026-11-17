import chalk from 'chalk';
import ora from 'ora';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { DeployConfig } from './types.js';
import { createSSHClient } from './ssh.js';
import { VersionManager } from './version-manager.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(__dirname, '../..');

const PROJECT_NAME = 'vaultwarden';
const REMOTE_DIR = '/data/apps/vaultwarden';
const CONTAINER_NAME = 'vaultwarden';

/**
 * 解析远程可用的 compose 命令：优先 docker compose，其次 docker-compose
 */
async function resolveComposeCmd(
  execute: (cmd: string) => Promise<string>
): Promise<string> {
  const hasPlugin = await execute('docker compose version >/dev/null 2>&1 && echo yes')
    .then((out) => out.trim() === 'yes')
    .catch(() => false);
  if (hasPlugin) return 'docker compose';

  const hasBinary = await execute('command -v docker-compose >/dev/null 2>&1 && echo yes')
    .then((out) => out.trim() === 'yes')
    .catch(() => false);
  if (hasBinary) return 'docker-compose';

  throw new Error('远程未找到 docker compose / docker-compose，请先安装 Compose 插件');
}

/**
 * 部署 Vaultwarden：上传 compose + .env，远程 pull && up -d
 */
export async function vaultwardenDeploy(config: DeployConfig): Promise<void> {
  const projectDir = path.join(ROOT_DIR, PROJECT_NAME);
  const composeLocal = path.join(projectDir, 'docker-compose.yml');
  const envLocal = path.join(projectDir, '.env');

  if (!fs.existsSync(composeLocal)) {
    throw new Error(`本地缺少 ${composeLocal}`);
  }

  console.log(chalk.yellow('\n即将执行：'));
  console.log(`  目标服务器: ${chalk.white(`${config.server.username}@${config.server.host}`)}`);
  console.log(`  ${chalk.white(PROJECT_NAME)}  →  ${chalk.gray(REMOTE_DIR)}（容器 ${CONTAINER_NAME}）`);

  const connectSpinner = ora('连接 SSH...').start();
  const client = await createSSHClient(config.server);
  connectSpinner.succeed('SSH 连接成功');

  try {
    try {
      await client.executeCommand('command -v docker');
    } catch {
      throw new Error('远程服务器未安装 docker，请先安装 Docker');
    }

    const composeCmd = await resolveComposeCmd((cmd) => client.executeCommand(cmd));
    console.log(chalk.gray(`[${PROJECT_NAME}] 使用: ${composeCmd}`));

    await client.ensureRemoteDir(REMOTE_DIR);
    await client.ensureRemoteDir(`${REMOTE_DIR}/data`);

    const uploadSpinner = ora(`[${PROJECT_NAME}] 上传 docker-compose.yml...`).start();
    await client.uploadFile(composeLocal, `${REMOTE_DIR}/docker-compose.yml`);
    uploadSpinner.succeed(`[${PROJECT_NAME}] docker-compose.yml 已上传`);

    const hasLocalEnv = fs.existsSync(envLocal);
    if (hasLocalEnv) {
      const envSpinner = ora(`[${PROJECT_NAME}] 上传 .env...`).start();
      await client.uploadFile(envLocal, `${REMOTE_DIR}/.env`);
      await client.executeCommand(`chmod 600 ${REMOTE_DIR}/.env`);
      envSpinner.succeed(`[${PROJECT_NAME}] .env 已上传（权限 600）`);
    } else {
      const hasRemoteEnv = await client
        .executeCommand(`test -f ${REMOTE_DIR}/.env && echo yes`)
        .then((out) => out.trim() === 'yes')
        .catch(() => false);
      if (!hasRemoteEnv) {
        throw new Error(
          `本地无 vaultwarden/.env 且远程无 ${REMOTE_DIR}/.env。` +
            `请先: cp vaultwarden/.env.example vaultwarden/.env 并填写 ADMIN_TOKEN`
        );
      }
      console.log(chalk.green(`[${PROJECT_NAME}] 沿用远程已有 .env`));
    }

    const hasAdminToken = await client
      .executeCommand(
        `grep -E '^ADMIN_TOKEN=.+' ${REMOTE_DIR}/.env >/dev/null && echo yes`
      )
      .then((out) => out.trim() === 'yes')
      .catch(() => false);
    if (!hasAdminToken) {
      throw new Error(
        `${REMOTE_DIR}/.env 中 ADMIN_TOKEN 为空，请填写后再部署（openssl rand -base64 48）`
      );
    }

    console.log(chalk.cyan(`[${PROJECT_NAME}] 拉取镜像并启动...`));
    await client.executeCommandStream(
      `cd ${REMOTE_DIR} && ${composeCmd} pull && ${composeCmd} up -d`
    );

    await new Promise((r) => setTimeout(r, 3000));
    const running = await client
      .executeCommand(`docker inspect -f '{{.State.Running}}' ${CONTAINER_NAME}`)
      .then((out) => out.trim() === 'true')
      .catch(() => false);

    if (running) {
      console.log(chalk.green(`[${PROJECT_NAME}] 容器运行中`));
      const logs = await client
        .executeCommand(`docker logs --tail 8 ${CONTAINER_NAME} 2>&1 || true`)
        .catch(() => '');
      if (logs) console.log(chalk.gray(logs));
    } else {
      const logs = await client
        .executeCommand(`docker logs --tail 40 ${CONTAINER_NAME} 2>&1 || true`)
        .catch(() => '');
      throw new Error(`容器未能正常运行\n最近日志:\n${logs}`);
    }

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
    console.log(chalk.gray('  访问: https://vault.xuanyuanli.cn'));
    console.log(chalk.gray('  管理: https://vault.xuanyuanli.cn/admin'));
  } finally {
    client.disconnect();
  }
}
