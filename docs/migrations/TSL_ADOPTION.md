# TSL 收编：API 差异清单与收回决策（P2-2）

> 状态：**过程记录（已完成）**。本文是 P2-2（issue #81）的验收物——TSL 与主仓的 API 差异清单、
> 分级（类型级 / 语义级 / 缺失级）与「收回 vs 只收核心 vs 重写」的决策依据。
> 逐批执行进度与实测结论见 [ARCHITECTURE_V2.md](../ARCHITECTURE_V2.md) §P2；
> 收编后的着色器规范见 [AGENTS.md](../../AGENTS.md) §9。
>
> 关联：issue #81（本文）、#708（总纲）、#709–#713（收编 / 引擎迁移 / 能力扩展 / 示例迁移 / GLSL 降级）、
> #715（外仓 examples 未迁，低优先级技术债）、#885（GLSL 参考样本归档）。

## 1. 结论

| 问题 | 结论 |
|---|---|
| 收编当时是否有「缺失级」差异 | **没有**。TSL 不依赖主仓任何 `@feng3d/*`，320 个用例可独立跑通即证明这一点 |
| 引擎 / 示例迁移是否逼出缺失能力 | **有，且不少**——见 §2.3。它们不是「收编可行性」问题，而是「迁移表达力」问题，已在 #710 / #712 等批次补齐 |
| 选哪种收回方式 | **整体收回**到 `packages/tsl`（不选「只收核心」，也不选「重写」），理由见 §3 |
| 实际代价 | 迁入适配 3 类（§2.1）；之后 47 个提交的能力扩展与维护（§3 工时一行） |

## 2. 差异分级

### 2.1 类型级（strictNullChecks / R2 下不可用）

| 差异 | 表现 | 处置 |
|---|---|---|
| `Struct` 成员访问没有类型映射 | `vec3(attribute(...))` 与 `transform.u_modelMatrix.multiply(...)` 过不了 `tsc` —— TSL 自己的 `test/` 从不参与 `tsc`，所以从未暴露 | 补 `Struct` 的成员映射类型、5 个类型构造函数（vec2/vec3/vec4/float/mat4）的 `VariableHost` 重载，并导出 `Struct`（#711 试点批） |
| `import { Array }` 遮蔽全局 `Array` | 模块内用不了全局 `Array` | 改用 `TSLArray` 别名（#711 第六批） |
| 模块级 `new Set()` 2 处 | 违反 R2「零模块级副作用」 | 改 lazy-init（#709） |
| 行尾 CRLF 109 / 111 个文件 | 与根 `.gitattributes` 的 `eol=lf` 冲突 | 统一 LF（#709） |

真实 `tsc` 错误只有 **2 处**（#709 实测），其余是工程级适配。

### 2.2 语义级（生成结果与手写 WGSL 不同，但可证明等价）

| 差异 | 影响 | 处置 |
|---|---|---|
| 生成风格不同 | `vec4<f32>` vs `vec4f`、结构体大括号换行、成员名小写、`let`/`var` 选择、常量折叠、广播折叠 | **不要求逐字节一致**；用 `test/tslWgslParity.spec.ts` + `scripts/tsl-parity-baseline.json` 的规范化基线守住「意外变化即失败」 |
| 采样器展开成两个绑定 | `<name>_texture`（纹理）+ `<name>`（采样器）——与手写常见的「sampler 在前」顺序相反 | 数据侧 `bindingResources` 按 TSL 键名写（#711 第三批） |
| varying 的 `@location` 按**使用顺序**自动分配 | 与手写不一致会整体插值错位 | 一律显式传 location（#711 第十三批） |
| 中间值只写 TS `const` 会被内联展开 | 改变矩阵乘法的浮点结合顺序 → 像素差；`var_()` 也不等价（实测截图 4845 → 4883 字节） | 中间值一律 `let_()`（#711 第二批的关键实践） |
| `vec4` 没有 `(Vec2, Float, Float)` 构造 | 顶点变换写法受限 | 先合成 `vec3` 再补 `w` |
| `select` 参数顺序与 WGSL 相反 | WGSL 是 `select(f, t, cond)`，TSL 是 `select(condition, trueValue, falseValue)` | 迁移时逐条核对（#711 第十四批写反过一次） |
| 顶点入口参数顺序由 body 的**引用顺序**决定 | 与手写签名顺序可能不同 | location 显式指定即可，绑定不受影响 |
| `fragment.toWGSL(vertexShader)` 只对齐 binding 与 location | 不做跨 stage 的声明去重 | 每个 stage 各给一份自包含的 code（#712 第九批，曾导致 `struct` 重复定义、画面全黑） |
| 语句容器优先级 | `if` 体与 `for` 体嵌套时语句挂错位置（TSL 缺陷） | 修为「for 体 > if 体 > 函数体」（#710） |

### 2.3 缺失级（迁移所需、初始 TSL 没有）

| 能力 | API | 首个消费者 |
|---|---|---|
| for 循环 / 运行期上界 | `forRange_()` / `forU32_()` | 蒙皮（`skeleton`） |
| 向量动态索引 | `v.index(i)` | 蒙皮 |
| f32 → i32 | `int()` | 蒙皮（数组索引） |
| 单独取函数定义 | `func(...).toWGSL()` | 光照 pars |
| `mat3` | `mat3` | 粒子公告牌 |
| 立方体贴图采样器 / 数组初始化 / 矩阵列构造与访问 | `samplerCube()` / `arrayWithValues()` / `mat4(c0..c3)` / `Mat4.index()` | SkyBox |
| 片元丢弃 / 比较采样器 / 硬件深度比较 | `discard()` / `samplerComparison()` / `textureSampleCompare()` | StandardMaterial |
| 结构体数组 | `array(Struct, N)` | 点光数组 `array<PointLightData, 8>` |
| compute / storage buffer / workgroup barrier / 原子操作 | 见 #710 | bitonicSort 等 compute 示例 |
| 多输出 fragment | `fragColor(0, 'color0')` | `red.frag` 两个示例 |
| 其余（`while_` / `switch_` / `return_` / `override` / `storageTexture2D/3D` / `textureDimensions` / 深度 `texelFetch` / `uvec2` 位运算 / 标量广播 / 无返回值函数） | 见 #712 / #785 / #834 | examples 迁移 |

> 这张表是**事后回填**的：P2-2 的判据只需要「TSL 能在主仓环境独立跑起来」，
> 缺失能力是后续迁移逼出来的。逐批记录与踩坑细节见 [ARCHITECTURE_V2.md](../ARCHITECTURE_V2.md) §P2。

## 3. 收回方式对比与决策

| 方案 | 成本 | 风险 | 结论 |
|---|---|---|---|
| **整体收回** | 1 个 PR（#716）完成迁入；此后 46 个提交做能力扩展与缺陷修复（收编提交本身不计） | 长期维护 TSL（已是第 22 个 workspace 包，享受与其它包同等的门禁） | ✅ 采纳 |
| 只收核心（类型系统 + 代码生成） | 省掉一部分辅助 API，但引擎着色器要的 struct / 数组 / compute 都在核心之外 | 两套 API 并存，等于再造一份维护面 | ✗ |
| 重写 | 现库 112 个 `src/.ts` / 13989 行 + 26 个 spec / 389 个用例；还要重踩 §2.2 的全部语义差异 | 丢掉与 three.js TSL 的路线一致性 | ✗ |

**工时口径**（实际投入，按提交与批次计，不折算人天）：#709 收编 1 个 PR；#711 引擎着色器 14 批 /
20 个提交；#710 能力扩展 13 个提交；#712 示例迁移 71 个提交；#785 / #834 等后续修补若干。

## 4. 收编后的现状（可复核）

| 项 | 读数 | 复核方式 |
|---|---|---|
| 包身份 | workspace 第 22 个包；R1 Layer 0；R6 strict 第 22 个包 | `scripts/check-layer-direction.mjs` / `scripts/strict-packages.json` |
| 测试 | **26 个 spec / 389 个用例**（2026-10-17 实测全绿） | `npx vitest run packages/tsl` |
| 引擎着色器 | `packages/feng3d/src/**/*.wgsl.ts` = **0** | `Get-ChildItem packages/feng3d/src -Recurse -Filter *.wgsl.ts` |
| 引擎材质 | 7 个材质 + `shadow` / `common` / `skeleton` / `skybox` / 粒子全部由 TSL 生成 | `packages/feng3d/src/shaders/tsl/`（33 个文件） |
| 示例范围 | 47 个迁为 `*.tsl.ts`；24 个按 #712 的负责人决定保留（有意双轨） | `AGENTS.md` §9 |

## 依据

- [ARCHITECTURE_V2.md](../ARCHITECTURE_V2.md) §P2（进度与逐批实测）、§2.2 第 4 项（着色器双份维护）
- [AGENTS.md](../../AGENTS.md) §9（着色器 TSL 单源）、§13（覆盖率门禁）、§16（发布）
- issue #81 / #708–#713
