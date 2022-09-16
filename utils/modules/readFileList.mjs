/**
 *  读取所有md文件数据
 */
// 文件模块
import fs from "fs";
import path from "path";
import {fileURLToPath} from "url"; // 路径模块
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const docsRoot = path.join(__dirname, '..', '..', 'docs'); // docs文件路径

function readFileList(dir = docsRoot, filesList = []) {
    const files = fs.readdirSync(dir);
    files.forEach((item, index) => {
        let filePath = path.join(dir, item);
        const stat = fs.statSync(filePath);
        if (stat.isDirectory() && item !== '.vuepress') {
            readFileList(path.join(dir, item), filesList);  //递归读取文件
        } else {
            if (path.basename(dir) !== 'docs') { // 过滤docs目录级下的文件

                const filename = path.basename(filePath);
                const fileNameArr = filename.split('.');
                const firstDotIndex = filename.indexOf('.');
                const lastDotIndex = filename.lastIndexOf('.');

                let name = null, type = null;
                if (fileNameArr.length === 2) { // 没有序号的文件
                    name = fileNameArr[0]
                    type = fileNameArr[1]
                } else if (fileNameArr.length >= 3) { // 有序号的文件(或文件名中间有'.')
                    name = filename.substring(firstDotIndex + 1, lastDotIndex)
                    type = filename.substring(lastDotIndex + 1)
                }

                if (type === 'md') { // 过滤非md文件
                    filesList.push({
                        name,
                        filePath
                    });
                }

            }
        }
    });
    return filesList;
}

export default readFileList;
