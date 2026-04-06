/**
 * 调整 index.d.ts 文件
 */
const fs = require('fs');
const path = require('path');

const indexpath = path.resolve('dist/index.d.ts');

let source = fs.readFileSync(indexpath, 'utf8');

// 移除所有 declare module
source = source.replace(/declare module ['\.\/\w\s]+{([\s\w]+{[\s\w:;]+})\s+}/g, '$1');

// 验证全部被替换
console.assert(source.indexOf('declare module') === -1);

// 回写文件
fs.writeFileSync(indexpath, source, 'utf8');
