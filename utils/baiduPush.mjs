/**
 * 生成百度链接推送文件
 */
import fs from "fs";
import readFileList from "./modules/readFileList.mjs";
import matter from "gray-matter"; // FrontMatter解析器 https://github.com/jonschlinkert/gray-matter
import chalk from "chalk";
import path from "path";
import {fileURLToPath} from "url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const urlsRoot = path.join(__dirname, '..', 'urls.txt'); // 百度链接推送文件
const DOMAIN = process.argv.splice(2)[0]; // 获取命令行传入的参数

if (DOMAIN) {
  main();
} else {
  console.log(chalk.red('请在运行此文件时指定一个你要进行百度推送的域名参数，例：node utils/baiduPush.mjs https://xugaoyi.com'))
}

/**
 * 主体函数
 */
function main() {
  fs.writeFileSync(urlsRoot, DOMAIN)
  const files = readFileList(); // 读取所有md文件数据

  files.forEach(file => {
    const { data } = matter(fs.readFileSync(file.filePath, 'utf8'));

    if (data.permalink) {
      const link = `\r\n${DOMAIN}${data.permalink}`;
      console.log(link)
      fs.appendFileSync(urlsRoot, link);
    }
  })
}
