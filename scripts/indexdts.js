/**
 * 调整 index.d.ts 文件
 */
const fs = require('fs');
const path = require('path');

const indexpath = path.resolve('dist/index.d.ts');

let source = fs.readFileSync(indexpath, 'utf8');

// 移除所有 declare module
let newSource = '';
let index = 0;
while (index < source.length)
{
    let declareIndex = source.indexOf('declare module', index);
    if (declareIndex === -1)
    {
        newSource += source.substring(index, source.length);
        break;
    }
    newSource += source.substring(index, declareIndex);
    let start = source.indexOf('{', declareIndex) + 1;
    let count = 1;
    index = start;
    while (index < source.length)
    {
        if (source[index] === '{')
        {
            count++;
        } else if (source[index] === '}')
        {
            count--;
        }
        index++;
        if (count === 0)
        {
            break;
        }
    }
    newSource += source.substring(start, index - 1);
}

// 回写文件
fs.writeFileSync(indexpath, newSource, 'utf8');
