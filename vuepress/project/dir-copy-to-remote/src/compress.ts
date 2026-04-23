import archiver from 'archiver';
import fs from 'fs';
import path from 'path';
import { CompressOptions } from './types.js';

/**
 * 默认排除的文件和目录模式
 */
const DEFAULT_EXCLUDE_PATTERNS = [
  'node_modules',
  '.git',
  '.vscode',
  '.idea',
  'dist',
  'build',
  '*.log',
  '.DS_Store',
  'Thumbs.db',
];

/**
 * 压缩目录为 zip 文件
 */
export async function compressDirectory(options: CompressOptions): Promise<void> {
  const { sourceDir, outputPath, exclude = DEFAULT_EXCLUDE_PATTERNS } = options;

  return new Promise((resolve, reject) => {
    if (!fs.existsSync(sourceDir)) {
      reject(new Error(`源目录不存在: ${sourceDir}`));
      return;
    }

    const output = fs.createWriteStream(outputPath);
    const archive = archiver('zip', {
      zlib: { level: 9 },
    });

    let totalBytes = 0;
    let compressedBytes = 0;

    output.on('close', () => {
      resolve();
    });

    archive.on('error', (err) => {
      reject(err);
    });

    archive.on('progress', (progress) => {
      totalBytes = progress.fs.totalBytes;
      compressedBytes = progress.fs.processedBytes;
    });

    archive.pipe(output);

    archive.glob('**/*', {
      cwd: sourceDir,
      ignore: exclude,
      dot: true,
    });

    archive.finalize();
  });
}

/**
 * 获取目录大小（估算）
 */
export function getDirectorySize(dirPath: string, exclude: string[] = DEFAULT_EXCLUDE_PATTERNS): number {
  let totalSize = 0;

  function walkDir(currentPath: string): void {
    if (!fs.existsSync(currentPath)) {
      return;
    }

    const stats = fs.statSync(currentPath);
    
    if (stats.isFile()) {
      totalSize += stats.size;
      return;
    }

    if (stats.isDirectory()) {
      const dirName = path.basename(currentPath);
      if (exclude.includes(dirName)) {
        return;
      }

      const files = fs.readdirSync(currentPath);
      files.forEach((file) => {
        walkDir(path.join(currentPath, file));
      });
    }
  }

  walkDir(dirPath);
  return totalSize;
}

/**
 * 格式化字节大小
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
}
