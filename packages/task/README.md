# @feng3d/task

用于处理同步或者异步任务。

废弃，使用Promise进行替代。

源码：https://gitee.com/feng3d/task

文档：https://feng3d.com/task

## 安装

```
npm i @feng3d/task
```

## 快速开始

```
import { task } from '@feng3d/task';

const result = [];
const arr = [1, 2, 3, 4, 5];
const funcs = arr.map((v) => (callback) =>
{
    result.push(v);

    setTimeout(() =>
    {
        callback();
    }, 1000);
});

task.series(funcs)(() =>
{
   console.log(JSON.stringify(arr) === JSON.stringify(result)); // true
});
```