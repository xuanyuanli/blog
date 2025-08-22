#!/usr/bin/env node

/**
 * Claude Code Provider Manager GUI - 项目验证脚本
 * 用于验证项目结构和配置的完整性
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PROJECT_ROOT = process.cwd();
const REQUIRED_FILES = [
  'package.json',
  'README.md',
  'LICENSE',
  'CHANGELOG.md',
  'CONTRIBUTING.md',
  'tsconfig.json',
  'vite.config.ts',
  'tailwind.config.js',
  'jest.config.js',
  'playwright.config.ts',
  'electron-builder.json',
  '.github/workflows/ci-cd.yml',
  'Dockerfile',
  'docker-compose.yml',
];

const REQUIRED_DIRS = [
  'src',
  'src/components',
  'src/pages',
  'src/contexts',
  'src/types',
  'src/utils',
  'src/main',
  'src/services',
  'src/assets',
  'tests',
  'docs',
  'docker',
];

const PACKAGE_JSON_REQUIRED_SCRIPTS = [
  'dev',
  'build',
  'test',
  'test:coverage',
  'test:e2e',
  'lint',
  'electron:dev',
  'dist',
];

const PACKAGE_JSON_REQUIRED_DEPENDENCIES = [
  'react',
  'react-dom',
  'electron',
  'typescript',
  'tailwindcss',
  'lucide-react',
];

function checkFileExists(filePath) {
  return fs.existsSync(path.join(PROJECT_ROOT, filePath));
}

function checkDirectoryExists(dirPath) {
  return fs.existsSync(path.join(PROJECT_ROOT, dirPath)) && 
         fs.statSync(path.join(PROJECT_ROOT, dirPath)).isDirectory();
}

function readPackageJson() {
  try {
    const packageJson = fs.readFileSync(path.join(PROJECT_ROOT, 'package.json'), 'utf8');
    return JSON.parse(packageJson);
  } catch (error) {
    console.error('❌ 无法读取 package.json:', error.message);
    return null;
  }
}

function validatePackageJson(packageJson) {
  const issues = [];
  
  // 检查必需的脚本
  const scripts = packageJson.scripts || {};
  PACKAGE_JSON_REQUIRED_SCRIPTS.forEach(script => {
    if (!scripts[script]) {
      issues.push(`缺少必需的 npm 脚本: ${script}`);
    }
  });
  
  // 检查必需的依赖
  const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };
  PACKAGE_JSON_REQUIRED_DEPENDENCIES.forEach(dep => {
    if (!dependencies[dep]) {
      issues.push(`缺少必需的依赖: ${dep}`);
    }
  });
  
  // 检查 Node.js 版本要求
  if (!packageJson.engines || !packageJson.engines.node) {
    issues.push('缺少 Node.js 版本要求');
  }
  
  return issues;
}

function runCommand(command, options = {}) {
  try {
    execSync(command, { 
      stdio: 'pipe', 
      cwd: PROJECT_ROOT,
      ...options 
    });
    return { success: true, output: '' };
  } catch (error) {
    return { success: false, output: error.message };
  }
}

function main() {
  console.log('🔍 开始验证 Claude Code Provider Manager GUI 项目...\n');
  
  let hasErrors = false;
  
  // 检查必需文件
  console.log('📁 检查必需文件...');
  REQUIRED_FILES.forEach(file => {
    if (checkFileExists(file)) {
      console.log(`✅ ${file}`);
    } else {
      console.log(`❌ ${file} - 文件不存在`);
      hasErrors = true;
    }
  });
  
  // 检查必需目录
  console.log('\n📂 检查必需目录...');
  REQUIRED_DIRS.forEach(dir => {
    if (checkDirectoryExists(dir)) {
      console.log(`✅ ${dir}`);
    } else {
      console.log(`❌ ${dir} - 目录不存在`);
      hasErrors = true;
    }
  });
  
  // 检查 package.json
  console.log('\n📦 检查 package.json...');
  const packageJson = readPackageJson();
  if (packageJson) {
    const issues = validatePackageJson(packageJson);
    if (issues.length === 0) {
      console.log('✅ package.json 配置正确');
    } else {
      console.log('❌ package.json 存在问题:');
      issues.forEach(issue => console.log(`   - ${issue}`));
      hasErrors = true;
    }
  }
  
  // 检查 TypeScript 配置
  console.log('\n🔧 检查 TypeScript 配置...');
  if (checkFileExists('tsconfig.json')) {
    console.log('✅ tsconfig.json 存在');
  } else {
    console.log('❌ tsconfig.json 不存在');
    hasErrors = true;
  }
  
  // 检查构建配置
  console.log('\n🏗️ 检查构建配置...');
  const buildConfigs = ['vite.config.ts', 'electron-builder.json'];
  buildConfigs.forEach(config => {
    if (checkFileExists(config)) {
      console.log(`✅ ${config} 存在`);
    } else {
      console.log(`❌ ${config} 不存在`);
      hasErrors = true;
    }
  });
  
  // 检查测试配置
  console.log('\n🧪 检查测试配置...');
  const testConfigs = ['jest.config.js', 'playwright.config.ts'];
  testConfigs.forEach(config => {
    if (checkFileExists(config)) {
      console.log(`✅ ${config} 存在`);
    } else {
      console.log(`❌ ${config} 不存在`);
      hasErrors = true;
    }
  });
  
  // 检查 CI/CD 配置
  console.log('\n🚀 检查 CI/CD 配置...');
  if (checkFileExists('.github/workflows/ci-cd.yml')) {
    console.log('✅ GitHub Actions 工作流存在');
  } else {
    console.log('❌ GitHub Actions 工作流不存在');
    hasErrors = true;
  }
  
  // 检查 Docker 配置
  console.log('\n🐳 检查 Docker 配置...');
  const dockerConfigs = ['Dockerfile', 'docker-compose.yml'];
  dockerConfigs.forEach(config => {
    if (checkFileExists(config)) {
      console.log(`✅ ${config} 存在`);
    } else {
      console.log(`❌ ${config} 不存在`);
      hasErrors = true;
    }
  });
  
  // 尝试运行一些命令（仅检查，不执行）
  console.log('\n🔧 检查开发环境...');
  const commands = [
    { name: 'npm install', cmd: 'npm install --dry-run' },
    { name: 'npm run lint', cmd: 'npm run lint --dry-run' },
    { name: 'npm run build', cmd: 'npm run build --dry-run' },
  ];
  
  commands.forEach(({ name, cmd }) => {
    const result = runCommand(cmd, { timeout: 10000 });
    if (result.success) {
      console.log(`✅ ${name} 可用`);
    } else {
      console.log(`⚠️ ${name} 可能存在问题: ${result.output.split('\n')[0]}`);
    }
  });
  
  // 总结
  console.log('\n📊 验证结果:');
  if (hasErrors) {
    console.log('❌ 项目验证失败，请修复上述问题后再继续');
    process.exit(1);
  } else {
    console.log('✅ 项目验证通过！所有必需的文件和配置都已就绪');
    console.log('\n🚀 您可以开始开发:');
    console.log('   npm install     # 安装依赖');
    console.log('   npm run dev     # 启动开发服务器');
    console.log('   npm run test    # 运行测试');
    console.log('   npm run build   # 构建项目');
  }
}

// 如果是直接运行脚本
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}