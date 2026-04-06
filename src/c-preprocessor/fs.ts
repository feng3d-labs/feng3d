declare let require: any;

export interface IFS
{
    readFile: (path: string, encoding: 'utf8', callback: (err: Error, code: string) => void) => void
}
let fs: IFS;
// 判断是否为支持本地文件系统的环境
if (typeof __dirname === 'string' && typeof require !== 'undefined' && require('fs'))
{
    fs = require('fs');
}

export const defaultFS: IFS = fs;
