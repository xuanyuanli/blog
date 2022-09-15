import ftp from "ftp";
import chalk from "chalk";
import path from "path";
import fs from "fs";
import {fileURLToPath} from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let args = process.argv.splice(2);
const host = args[0].replaceAll("'", '');
const user = args[1].replaceAll("'", '');
const pwd = args[2].replaceAll("'", '');

if (host) {
    main();
} else {
    console.log(chalk.red('请指定域名、用户名、密码'))
}

function main() {
    //本地文件夹路径；
    const localDirPath = __dirname + '/../docs/.vuepress/dist/';
    //远程地址，打开ftp以后的地址，不需要加入host；
    const remotePath = '/htdocs/';
    const uploadFiles = [];
    const mkDirPromiseArr = [];
    const client = new ftp();

    const connectionProperties = {
        host: host,                       //ftp地址；
        user: user,                       //用户名；
        password: pwd,                   //密码；
        port: 21                        //端口；
    };
    client.connect(connectionProperties);
    client.on('ready', () => {
        console.log('ftp client is ready');
        start();
    });

    async function start() {
        const {err: ea, dir} = await cwd(remotePath);   //此处应对err做处理
        if (ea) {
            client.mkdir(remotePath, true, (err) => {
                if (err) {
                    console.log('创建' + remotePath + '文件夹失败');
                    upload();
                } else {
                    console.log('创建' + remotePath + '成功');
                    upload();
                }
            });
        } else {
            upload();
        }

        function upload() {
            const filesPath = {files: []};
            getDirAllFilePath(localDirPath, filesPath);
            remoteMkDir(filesPath, '');
            console.log('准备上传...');
            setTimeout(() => {
                Promise.all(mkDirPromiseArr).then(() => {
                    console.log('开始上传...');
                    const tasks = uploadFile();
                    runPromiseArray(tasks).then(() => {
                        client.end();
                        console.warn('上传完成～');
                    });
                });
            }, 3000);
        }
    }

    // 获取本地的文件地址和路径;
    function getDirAllFilePath(paths, parent) {
        const files = fs.readdirSync(paths);
        files.forEach(item => {
            if (item != '.DS_Store') {
                const path = `${paths}/${item}`;
                if (isDir(path)) {
                    getDirAllFilePath(path, parent[item] = {files: []});
                } else if (isFile(path)) {
                    parent.files.push(item);
                }
            }
        })
    }

    //创建远程确实的文件夹
    async function remoteMkDir(obj, _path) {
        for (const key in obj) {
            if (key === 'files') {
                for (let i = 0, len = obj[key].length; i < len; i++) {
                    const promise = new Promise(async resolve => {
                        let p = '';
                        if (_path) {
                            p = _path + '/';
                        }
                        const filePathName = p + obj[key][i];
                        uploadFiles.push({path: filePathName, fileName: obj[key][i]});
                        const ph = remotePath + filePathName.substring(0, filePathName.lastIndexOf('/') + 1);
                        let {err: ea, dir} = await cwd(ph);//此处应对err做处理
                        if (ea) {
                            client.mkdir(ph, true, (err) => {
                                if (err) {
                                    console.log('mkdir' + ph + 'err', err);
                                    resolve(null);
                                    return;
                                }
                                console.log('mkdir ' + ph + '  success');
                                resolve(null);
                            });
                        } else {
                            resolve(null);
                        }
                    });

                    mkDirPromiseArr.push(promise);
                }
            } else {
                let p = '';
                if (_path) {
                    p = _path + '/';
                }
                await remoteMkDir(obj[key], p + key);
            }
        }
    }

    function putFile(putPath, fileName, resolve, err, targetPath) {
        const rs = fs.createReadStream(putPath);
        client.put(rs, fileName, (putErr, data) => {
            if (putErr) {
                resolve(err);
            } else {
                console.log(targetPath + '文件上传成功');
                resolve(true);
            }
        })
    }

//上传文件
    function uploadFile() {
        const tasks = [];
        const resourcesPath = localDirPath;
        //目标路径文件夹;
        const checkPath = remotePath;
        for (let i = 0, len = uploadFiles.length; i < len; i++) {
            const task = () => {
                return new Promise(async (resolve, reject) => {
                    const _path = uploadFiles[i].path;
                    const targetPath = checkPath + _path;
                    const putPath = resourcesPath + '/' + _path;
                    const dirpath = path.dirname(targetPath);
                    const fileName = path.basename(targetPath);

                    client.cwd(dirpath, (cwdErr, dir) => {
                        client.pwd((pwdErr, cwd) => {
                            if (pwdErr) {
                                resolve(pwdErr)
                            } else {
                                client.get(fileName, (err, res) => {
                                    if (res) {
                                        client.delete(fileName,()=>{
                                            putFile(putPath, fileName, resolve, err, targetPath);
                                        })
                                    } else {
                                        putFile(putPath, fileName, resolve, err, targetPath);
                                    }
                                });
                            }
                        });
                    })
                });
            }
            tasks.push(task);
        }
        return tasks;
    }

    //执行Promise的队列动作
    function runPromiseArray(parray) { //这个方法可以放到G里
        let p = Promise.resolve();
        for (let promise of parray) {
            p = p.then(promise);
        }
        return p;
    }

    //切换目录
    async function cwd(dirpath) {
        return new Promise((resolve, reject) => {
            client.cwd(dirpath, (err, dir) => {
                resolve({err: err, dir: dir});
            })
        });
    }

    function isFile(filepath) {  //判断是否是文件 Boolean
        let stat = fs.statSync(filepath)
        return stat.isFile()
    }

    function isDir(filepath) {  //判断是否是文件夹 Boolean
        let stat = fs.statSync(filepath);
        return stat.isDirectory();
    }
}
