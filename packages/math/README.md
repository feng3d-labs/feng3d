# math
数学库。

源码：https://gitee.com/feng3d/math

文档：https://feng3d.com/math

## 安装

```
npm install @feng3d/math
```

## 快速开始
```
import { Vector3 } from '@feng3d/math';

let v = new Vector3(1, 2, 3);
const u = new Vector3(4, 5, 6);
v = v.crossTo(u);
console.log(v.x, v.y, v.z); // -3, 6, -3
```
