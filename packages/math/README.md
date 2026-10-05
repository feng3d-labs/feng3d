# math
数学库。

源码：https://gitee.com/feng3d/math

文档：https://feng3d.com/math

## 安装

```
npm install @feng3d/math
```

## 快速开始

本包是**纯数据 + 纯函数**风格：数据类型是只有字段的 `interface`（用字面量声明，不能 `new`），
运算一律是 `src/{color,geom,gradient}/*.ts` 里的纯函数（结果写进 `out` 参数，不修改入参）。

```ts
import { vec3Cross, vec3From, vec3ToArray } from '@feng3d/math';
import type { Vector3 } from '@feng3d/math';

// 数据类型是纯数据 interface：用带 __type__ 的字面量声明，不要 `new`
const v: Vector3 = { __type__: 'Vector3', x: 1, y: 2, z: 3 };
const u = vec3From(4, 5, 6); // 新建普通字面量（等价于过去的 new Vector3(4, 5, 6)）

console.log(vec3ToArray(vec3Cross(v, u))); // [ -3, 6, -3 ]
```

同一族里 `vec3` 前缀的函数（`vec3Add` / `vec3Lerp` / `vec3Normalized` …）都遵循 `out` 约定：
末位可选参数既是结果容器也是就地运算目标，省略时新建字面量。完整清单见
[`src/geom/vector3.ts`](./src/geom/vector3.ts)，迁移口径见
[`docs/MATH_PURE_FUNCTIONS_MIGRATION.md`](../../docs/MATH_PURE_FUNCTIONS_MIGRATION.md)。
