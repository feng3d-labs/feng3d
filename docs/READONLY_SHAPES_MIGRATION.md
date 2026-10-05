# 只读形状（属性与数组都只读）：口径、机器门禁与存量分批

> 本文是 issue **#605** 的落地记录：口径已定（**属性与数组都只读**）、机器执行者已落地
> （`scripts/check-readonly-array-fields.mjs`），存量按「**先约束新代码、存量分批**」推进。
>
> 关联：[../AGENTS.md](../AGENTS.md) §8.5（响应式属性只读）/ §10（WebGPU readonly 边界）/
> §11.1（纯数据接口只声明 readonly 字段）/ §11.3（修改走纯数据接口）/ §11.6（本文的规范条文）/
> §15（元规则：每条规范必须有机器执行者）；
> [check-readonly-array-fields.mjs](../scripts/check-readonly-array-fields.mjs)、
> [readonly-array-fields-baseline.json](../scripts/readonly-array-fields-baseline.json)。

## 1. 口径

> 现状：✅ 已定并写进规范（证据：[../AGENTS.md](../AGENTS.md) §11.6；issue #605）

**读侧纯数据接口的数组字段一律 `readonly T[]`——属性 `readonly`、数组本身也 `readonly`。**

```ts
// ✓ 属性与数组都只读
export interface FrustumLike { readonly planes: readonly PlaneLike[]; }

// ✗ 属性只读、数组可变：读侧形状上能 push / splice / sort，等于把写入口开在读侧
export interface GradientLike { readonly alphaKeys: GradientAlphaKey[]; }

// ✗ 属性也可变：违反 AGENTS.md §11.1「纯数据接口只声明 readonly 字段」
export interface FooLike { items: Item[]; }
```

要就地改数组，**改的是「可写形状」**（`WritableXxxLike`，§11.3），不改读侧类型；
装配点也可以 `reactive(data) as WritableXxxLike` 后改。注意 `sort()` 在只读数组类型上
**不存在**，必须「取出 → 排序 → 经可写形状整体赋回」或整体替换。

**定这个口径的理由**（issue #605 讨论的结论）：

1. 与 §8.5「所有响应式属性都应该是 `readonly`」、§10「不要简单地移除 readonly 修饰符」同方向——
   只读是默认，可写要有理由；
2. 写侧形状 `Writable*Like` 已经存在，是可变数组的天然归属；把可变数组收进它，读 / 写边界才清楚；
3. 反方向（把 `FrustumLike.planes` 改成可变）没有收益——它没有就地改的消费者；
4. 此前**从未定过口径**，不是「少数派需要收口」：全仓读侧接口里只读与可变接近各半（见 §3）。

## 2. 机器执行者

> 现状：✅ 已落地并进 CI（证据：[check-readonly-array-fields.mjs](../scripts/check-readonly-array-fields.mjs)、根 `package.json` 的 `prelint:ci`）

- 脚本：[scripts/check-readonly-array-fields.mjs](../scripts/check-readonly-array-fields.mjs)
- 基线：[scripts/readonly-array-fields-baseline.json](../scripts/readonly-array-fields-baseline.json)
- 进 CI 的方式：挂在根 `package.json` 的 **`prelint:ci`** 钩子上（`npm run lint:ci` 会先跑它，
  CI 的「代码检查（eslint，零警告）」步骤因此覆盖到它）——本仓惯例：**推送 workflow 需要额外
  scope**，所以门禁优先走 `prelint:ci` 而不是改 `.github/workflows/`。

### 2.1 判据（只约束机械可判定的「读侧纯数据接口」）

被约束的接口是**二者之一**：

1. 名字以 `Like` 结尾、且不以 `Writable` 开头；
2. 声明了 `__type__` 属性（纯数据类，与 §11.4 和 R3 门禁的定义同源）。

这两类接口的数组字段，只要**属性缺 `readonly`** 或**数组外层可变**（`T[]` / `Array<T>` /
元组 `[A, B]`，含 `T[] | undefined` 这类联合包装），即违规。**新增即失败**；存量冻结在基线里。

### 2.2 为什么不全仓一刀切（误报面）

把判据放宽到「所有 `export interface`」会立刻产生大量**技术上的误报**：`packages/webgpu`
的 WebGPU 描述符、`packages/addons` 的 GLTF / OBJ 解析中间类型、`packages/editor` 的 UI 类型
都不是 §11 意义的纯数据接口，硬套只读会**天天报错**，门禁会被绕过。因此它们**只统计、不失败**
（`--stats` 打印数量），作为存量分期的参考。

已知的判定边界（都不是「漏网」而是**有意不查**，见脚本注释）：

| 情形 | 处置 |
|---|---|
| `Writable*` 形状 | 不参与判据（它们就是写侧） |
| 名字形如 `XxxWritableLike`（`Writable` 不在开头） | 会被当成读侧——本仓惯例是**前缀** `Writable`，不改判据 |
| 类型别名里的数组（`type FooList = Foo[]` 后用 `readonly n: FooList`） | 不查 |
| `class` 字段、`type X = { readonly a: T[] }` 字面量 | 不查 |
| 嵌套数组的**内层**（`readonly a: T[][]` 只判最外层） | 不查（纵深 1 层，深查噪声大于收益） |
| 索引签名 `[key: string]: T[]` | 不查 |

## 3. 实测分布

> 现状：✅ 可复现（证据：`node scripts/check-readonly-array-fields.mjs --stats`）

判据范围（`packages/*/src`，全部 `interface` 含非导出）内共 **36 个数组字段**：

| 形态 | 处数 |
|---|---|
| ① 属性只读 + 只读数组（**合口径**） | 20 |
| ② 属性只读 + 数组可变 | 13 |
| ③ 属性与数组都可变 | 3 |
| ④ 属性可写 + 只读数组 | 0 |

**违规存量 = 16 处**（② 13 + ③ 3）：`*Like` 2 处（`GradientLike.alphaKeys` / `colorKeys`）、
纯数据接口 14 处；按包 `packages/addons` 4、`packages/feng3d` 6、`packages/math` 3、
`packages/webgpu` 3。

`*Like`（非 `Writable`）的数组字段共 **4 个**，正好各半——与 issue #605 的实测一致：

| 口径 | 位置 |
|---|---|
| 只读数组 | `FrustumLike.planes`、`TriangleGeometryLike.triangles` |
| 数组可变 | `GradientLike.alphaKeys`、`GradientLike.colorKeys` |

未纳入判据、仅统计的**其他接口**共 **128 个数组字段**（① 42 / ② 21 / ③ 65），
按包分布见 §4.3。

## 4. 存量分批

> 现状：🔶 分批中（证据：基线 16 处；issue #605）

策略：**先约束新代码**（门禁已生效、新增即失败），存量按包分批清理，**不一次性重写**——
避免大爆炸式改动，也让每批都能独立验收。

### 4.1 第 0 步（前置）：先把 `GradientEditor.vue` 的 16 处就地去数组改成写侧形状

`packages/editor/src/vue-app/components/GradientEditor.vue` 里有 **16 处**对
`alphaKeys` / `colorKeys` 的就地结构操作（实测：`push` 4、`splice` 2、`sort` 10），
绝大多数直接改 `props.gradient` 或经局部裸引用，**不走 `WritableGradientLike`**。
在它们改完之前，`GradientLike` 的类型改不动（改了会立刻编译不过）。
这一步**不改类型声明**，可独立验收、不改变行为。

### 4.2 判据内的 16 处（**必须清**，改了记得 `--update` 收紧基线）

| 批次 | 包 | 位置 | 备注 |
|---|---|---|---|
| 1 | `packages/math` | `GradientLike.alphaKeys`、`GradientLike.colorKeys` | 依赖 §4.1 |
| 1 | `packages/math` | `Matrix4x4.elements` | **WebGPU 边界**（§10）：按 §10 用 `TypeConvert.ts` 转换，不要靠删 `readonly` 修 |
| 2 | `packages/feng3d` | `Animation.animations`、`Skeleton.boneInverses`、`Skeleton.boneNames`、`Entity.components`、`PointGeometry.points`、`SegmentGeometry.segments` | 先确认消费方没有就地改数组 |
| 3 | `packages/addons` | `ConvexGeometry.points`、`ExtrudeGeometry.shapes`、`PolyhedronGeometry.indices`、`PolyhedronGeometry.vertices` | 同上 |
| 4 | `packages/webgpu` | `ComputePass.computeObjects`、`OcclusionQuery.renderObjects`、`TransformFeedbackPass.transformFeedbackObjects` | 这 3 处是 ③（属性也可变），除数组外还要补属性的 `readonly` |

每批的做法：先把就地改数组的位置改为经 `Writable*` 形状 → 再把接口的数组字段改成
`readonly T[]` → 跑 `npm run types:packages`、`npx vitest run`、门禁脚本 → `--update` 收紧基线。

### 4.3 判据外的 128 处（**不强制**，随包迁移分批）

| 包 | ① 只读数组（已合口径） | ② 属性只读 + 数组可变 | ③ 属性与数组都可变 |
|---|---|---|---|
| `packages/addons` | 2 | 18 | 17 |
| `packages/editor` | 29 | 0 | 8 |
| `packages/objectview` | 3 | 0 | 5 |
| `packages/reactivity` | 2 | 0 | 0 |
| `packages/webgpu` | 6 | 1 | 9 |
| `packages/feng3d` | 0 | 2 | 15 |
| `packages/math` | 0 | 0 | 5 |
| `packages/event` | 0 | 0 | 3 |
| `packages/serialization` | 0 | 0 | 3 |
| **合计** | **42** | **21** | **65** |

这些不是 §11 意义的纯数据接口，**不要求**改成只读数组；但如果某个接口实际是「被响应式
追踪的读侧数据」，应按与判据内相同的做法迁移。建议顺序：`packages/feng3d` / `packages/math`
（真·数据形状）→ `packages/addons`（解析中间类型，多数可以不动）→ `packages/webgpu`
（描述符要按 §10 判断）→ `packages/editor`（UI 类型，多数可以不动）。

完整清单用下面的命令生成，**本文不复制一份**（避免文档与代码两处漂移）：

```bash
node scripts/check-readonly-array-fields.mjs --stats   # 统计 + ②③ 明细
node scripts/check-readonly-array-fields.mjs --list    # 只看判据内的存量
```

## 5. 与 issue #605 正文数字的差异（实测澄清）

> 现状：✅ 已核对（证据：`--stats` 输出）

issue #605 正文的统计是「全仓读侧纯数据接口 ① 53 / ② 32 / ③ 27（76 个接口含数组字段）」。
本文件落地时的实测（`packages/*/src`、全部 `interface` 含非导出）是
**① 62 / ② 34 / ③ 68**：

| 口径 | #605 正文 | 本次实测 | 判断 |
|---|---|---|---|
| ① 只读数组 | 53 | 62 | 接近（本次范围含非导出 `interface`） |
| ② 属性只读、数组可变 | 32 | 34 | 接近 |
| ③ 属性与数组都可变 | 27 | 68 | **差得多**：本次的 ③ 里有大量 `packages/webgpu` 描述符与 `packages/addons` 解析中间类型 |
| `*Like`（非 Writable）数组字段 | 2 : 2 | **2 : 2** | 完全一致 |

结论：**口径不依赖这些数字**。真正需要按本口径清理的存量是判据内的 **16 处**；
#605 正文的 ③ 偏少，最可能是当时的统计对「非纯数据接口」做了额外过滤（或漏扫了
`packages/webgpu` / `packages/addons` 的部分目录）。差异已在此登记，供后续核对。

## 6. 复现与收尾

```bash
node scripts/check-readonly-array-fields.mjs            # 校验（CI 用；新增即失败）
node scripts/check-readonly-array-fields.mjs --stats    # 统计与明细
node scripts/check-readonly-array-fields.mjs --list     # 判据内存量
node scripts/check-readonly-array-fields.mjs --update   # 清理后收紧基线
```

收尾判据：基线 `entries` 清空（16 → 0），脚本输出「判据范围内无可变数组字段」。
