# 序列化 / 资源层迁移规划

> 本文是任务 5（规划并推进序列化/资源层迁移）的纲领。**规划部分已定稿**，实施按 §4 的分步推进，
> 每步都有独立验收标准；未完成的步骤在文末「进度」表中标注。

## 1. 背景：为什么编辑器现在读不了场景文件

`packages/feng3d` 已把场景数据类型（`Object3D` / `Scene` / `Camera` / `MeshRenderer` / 几何体 /
材质）迁移为**纯数据接口 + Logic**：运行时不存在构造器，实例一律由 `{ __type__: 'Xxx', ... }`
字面量产生，行为由 `logic(data)` 提供。

而序列化与资源层仍是**「类名 → 构造器」**的旧机制：

| 位置 | 现状代码 | 问题 |
|---|---|---|
| `packages/serialization/src/Serialization.ts:841` | `classUtils.getInstanceByName(spv[__class__])` | 依赖 `__class__` + 构造器 |
| `packages/serialization/src/Serialization.ts:872` | 同上（默认 DataContainer 分支） | 取不到实例时 `console.warn('未处理')` 并放弃该属性 |
| `packages/assets/src/rs/ReadRS.ts:390` | `classUtils.getInstanceByName(object[__class__])` | 资源反序列化入口同样依赖构造器 |
| `packages/assets/src/AssetData.ts:129,205,211` | `getQualifiedClassName` / `getInstanceByName` | 资源元数据往返同样依赖类名 |
| `packages/polyfill/src/ClassUtils.ts` | `getInstanceByName` → `new Cls()` | 纯数据接口此处为 `undefined`，直接抛「无法获取名称为 X 的实例!」 |

叠加**资源文件本身的格式代差**（`packages/editor/resource/template/default.scene.json`）：

```json
{ "hideFlags": 64, "name": "Untitled", "children": [ { "name": "Main Camera",
  "components": [ { "y": 1, "z": -10 }, { "__class__": "Camera" } ], "__class__": "GameObject" } ] }
```

- `GameObject` 已被 `Object3D` 取代，`Transform` 组件已删除（其 `x/y/z/rx/ry/rz` 字段被**内联**在
  对象上，且 `components[0]` 留下 `null` 占位）；
- 组件用 `__class__` 而非 `__type__`；
- 几何体走 `{ "assetId": "Plane", "width": 10 }` 旧资源引用，新范式要求几何体数据内联。

结论：**旧资源必然加载失败**，`EditorAsset.readScene` 返回 `null`
（`packages/editor/src/ui/assets/EditorAsset.ts:87-108`），
编辑器退到 `createDefaultScene()` 的纯数据硬编码场景
（`packages/editor/src/utils/createDefaultScene.ts:15-37` 已记录该兜底及其撤销条件）。

## 2. 目标形态

单一事实来源：**纯数据字面量**。

```
Scene JSON  { "__type__": "Object3D", "name": "...", "position": {...}, "rotation": {...},
              "components": [ { "__type__": "MeshRenderer", "geometry": {...}, "material": {...} } ],
              "children": [...] }
     ↕  （直接映射，双向可逆，无构造器参与）
运行时数据   同一份 plain object 树 + logic() 提供的行为
```

- **反序列化**：`__type__` → `{ __type__, ...已处理的字段 }`，递归处理数组 / 嵌套对象 / `components` / `children`；
- **序列化**：遍历数据对象自身的可枚举字段（跳过运行时/非数据字段），输出 `__type__`；
- **构造器仅保留给数值容器**（`Vector3` / `Matrix4x4` / `Color4` 等 `@feng3d/math` 类）与确实需要
  实例身份的对象；纯数据接口一律不再经过 `classUtils`。

## 3. 差距清单

| # | 差距 | 归属 |
|---|---|---|
| G1 | `Serialization.deserialize` 无纯数据分支（`__type__` 不被识别） | `packages/serialization` |
| G2 | `Serialization.serialize` 输出的类型标识需与 `__type__` 对齐 | `packages/serialization` |
| G3 | `ReadRS.deserializeWithAssets` 用 `__class__` 取资源类型 | `packages/assets` |
| G4 | `AssetData` 的资源元数据往返依赖类名 | `packages/assets` |
| G5 | 旧资源文件格式（`GameObject` / `Transform` 内联 / `assetId` / `null` 占位） | `packages/editor/resource` |
| G6 | Prefab / Ref 的纯数据接入（`applyPrefab` / `resolveRefs` 已有实现，未与本链路串起来） | `packages/feng3d` + `packages/serialization` |
| G7 | 序列化层**零测试**（`packages/serialization` 下无 `*.spec.ts`） | `packages/serialization` |

## 4. 分步计划

每步都要求：`npx vitest run` 全绿 + 相关包 `vue-tsc` 无新增错误 + 该步自带实测证据。

### S1 内核：纯数据反序列化（解决 G1、G7）
1. 在 `Serialization.ts` 的 `propertyHandler` 链中新增一个**高优先级** handler：
   识别 `isDataContainer(spv) && typeof spv.__type__ === 'string'`，构造 plain object，
   对其余键递归走 `propertyHandler`，数组逐项递归；
2. 新增 `packages/serialization/src/Serialization.spec.ts`，覆盖：
   - 对象/数组/嵌套对象往返；
   - `components` / `children` 递归；
   - 缺失字段不写入（保持 raw 数据干净，与 `Object3DLogic` 的「默认值不落数据」约定一致）；
   - 数值容器（`Color4` / `Vector3`）仍走原有分支。

**验收**：`{ __type__: 'Object3D', components: [...] }` JSON → 对象树，字段逐一相等；旧格式仍不被误吞。

### S2 资源层接入（解决 G3、G4）
`ReadRS.deserializeWithAssets` 与 `AssetData` 优先按 `__type__` 走 S1 的纯数据分支，
仅在缺少 `__type__` 时回落到 `__class__`（保持旧资源可读，避免一次性断代）。

**验收**：`default.scene.json` 之外，先用一份**新格式**场景 JSON 走完整 `readScene` 链路成功。

### S3 资源文件转换（解决 G5）
提供一次性转换脚本 `scripts/migrate-scene-json.mjs`：
- `__class__: 'GameObject'` → `__type__: 'Object3D'`；
- 对象上的 `x/y/z/rx/ry/rz`（旧 Transform 内联）→ `position` / `rotation`（**角度 → 弧度**）；
- `components` 中的 `null` 占位清除；
- 组件 / 几何体 / 材质的 `__class__` → `__type__`；
- `{ assetId: 'Plane', width, height }` → `{ __type__: 'PlaneGeometry', width, height }`（按 assetId 映射表）。

**验收**：转换后 `default.scene.json` 能被 S2 的链路读出，且 `createDefaultScene()` 的硬编码内容与
转换结果**逐字段对齐**（两者本就应当描述同一场景）；对齐后删除硬编码兜底。

### S4 Prefab / Ref 接入（解决 G6）
把 `applyPrefab` / `resolveRefs` 接到 S1 的反序列化流程后置阶段，保证「引用解析 → prefab 展开」
顺序稳定；`overrides` 合并规则按 `Object3D.ts` 的字段注释实现。

**验收**：含 Ref 与 prefab 的样例 JSON 往返后引用目标正确、`overrides` 生效。

### S5 旧链路退场
确认无消费方后删除 `packages/polyfill/src/ClassUtils.ts` 的 `getInstanceByName` 依赖路径，
并同步 `docs/ARCHITECTURE_V2.md`（R3「纯数据声明式」的执行者清单）。

## 5. 验收标准（整体）

1. 编辑器能直接打开 `resource/template/default.scene.json`（转换后）并渲染出与当前硬编码兜底一致的场景；
2. 保存 → 重新打开 → 结构等价（往返测试覆盖 `Object3D` / 组件 / 几何体 / 材质 / 引用）；
3. 层内不再出现 `无法获取名称为 ... 的实例!` 与 `未处理` 警告；
4. `packages/serialization` 具备覆盖纯数据往返的测试。

## 6. 风险与回退

| 风险 | 缓解 |
|---|---|
| 旧资源（用户已有工程文件）断代 | S2 保留 `__class__` 回落分支；S3 脚本可批量转换 |
| 混入运行时字段（`Proxy` 缓存、Logic 实例）导致 JSON 膨胀 | 序列化只取 raw 数据的可枚举字段；`toRaw` 后遍历 |
| `__type__` 识别过宽，把 `Color4` 等数值容器也当 plain object | 数值容器分支优先级更高；`isDataContainer` + 已有 handler 顺序保证 |
| 一次改动面过大难以定位回归 | 严格按 S1→S5 分步，每步独立提交与验证 |

## 7. 进度

| 步骤 | 状态 |
|---|---|
| 规划（本文） | ✅ 完成 |
| S1 内核纯数据分支 + 测试 | ✅ 完成：`Serialization.ts` 的「普通对象」分支在 `target[property]` 为空时创建纯数据容器（原实现要求目标已存在，纯数据 JSON 会崩）；新增 `packages/serialization/test/Serialization.spec.ts` 4 个用例（对象 / 递归 components+children / 引用独立 / 缺失字段不落数据） |
| S2 资源层接入 | ✅ 完成：`EditorAsset.readScene` 按 `__type__` 判定纯数据格式并直接 `serialization.deserialize`，旧格式（`__class__`）仍走 `deserializeWithAssets`；加载成功打印来源日志 |
| S3 资源文件转换脚本 | ✅ 完成：新增 `scripts/migrate-scene-json.mjs`，旧文件备份为 `default.scene.legacy.json`，`default.scene.json` 转为纯数据格式；**examples 的 `Untitled.scene.json` 也已迁移**（见下节「旧格式资源清零」） |
| S4 Prefab / Ref 接入 | ✅ 已完成（既有实现即已接入）：`Object3D.ts:261-263` 在对象被 `logic()` 触达时依次调用 `applyPrefab` / `resolveRefs`，因此纯数据反序列化出来的对象树会自动完成「prefab 展开 + `$ref` 解析」。测试见 `packages/feng3d/src/core/Prefab.spec.ts`（实例化 / overrides 递归合并 / 深拷贝独立 / 未注册不崩溃）与 `Ref.spec.ts`（`$ref` 解析为同一对象 / 多处共享 / `liftSharedRefs` 还原） |
| S5 旧链路退场 | ⏸ 暂缓（**仓库内旧资源已清零**，见下节）：`ReadRS` / `AssetData` 的 `__class__` 回落分支是**旧工程文件的兼容路径**（S2 有意保留）。删掉它会让用户已有的旧工程文件从"能加载"变成"必须先迁移"；当前决定是**保留兼容路径 + 保留可读报错**，等有明确的"旧工程已全部迁移"信号再执行，届时同步 `docs/ARCHITECTURE_V2.md` 的 R3 执行者清单 |

### 旧格式资源清零（issue #221）

| 资源 | 处理 |
|---|---|
| `examples/resources/scene/Untitled.scene.json` | 用 `migrate-scene-json.mjs` 迁移（85 处 `__class__` → 0）：`GameObject`→`Object3D`、旧 Transform 内联字段→`position`/`rotation`（角度→弧度）、`Camera + 外挂 lens`→内联 `PerspectiveCamera` |
| `packages/editor/resource/gameobjects/Trident.gameobject.json` | **删除**：已无加载者（`Trident.ts` 的注释说明改为程序化构造） |
| `packages/editor/resource/gameobjects/SceneRotateTool.gameobject.json` | **删除**，并同步移除 `default.res.json` 里的资源条目（同样已无加载者） |
| `examples/src/animator/SceneLoadTest.ts` | 原文件用的是已删除的 API（`GameObject` / `new View()` / `getComponent(Scene)` / `view3D.scene = …`），按 `Container3DTest.ts` 的纯数据写法重写 |

迁移脚本这轮修掉两个真实缺陷（都是被第二个场景文件暴露的，第一个场景文件没有这些形态）：

1. `children` / `components` 里的 **`null` 占位**会让 `convertObject` 解构崩溃
   （`Cannot destructure property '__class__' of 'object' as it is null`；实测该文件有 21 处）；
2. 旧 `Camera` 组件上的 `lens: { __class__: 'PerspectiveLens' }` 会原样带进新格式——
   它挂在**组件**上而不是对象上，只在对象层清理已删字段是不够的。

> 注：脚本的设计是"首次运行把源文件重命名为 `*.legacy.json`，之后从备份读"，所以它**不是幂等的**——
> 对已经是纯数据格式的文件再跑一次会把 `position`/`rotation` 当普通字段丢弃。要重跑请先从 git 历史取回旧文件。

守卫：`test/resourceFormatGuard.spec.ts`（3 个用例）

- 扫描 `examples/resources` 与各包 `resource/` 下的 json，断言除 `*.legacy.json`（迁移输入备份）外**不含 `__class__`**；
- 断言 examples 的场景确实能被 `serialization.deserialize` 加载出结构（`Object3D` 根 + `Scene` 组件 + `Main Camera` 上的 `PerspectiveCamera`），而不是"文件看着干净就算数"；
- 断言 `*.legacy.json` 备份仍是旧格式（若它变成纯数据，说明有人把备份当成了产物）。

可失败性：往 `default.scene.json` 注入一处 `__class__` → 守卫失败并**指名文件**；恢复后 3 个用例全过。

### S2 / S3 实测证据- `readScene` 日志：`场景已从文件加载: default.scene.json（纯数据格式）`；
- 层级面板出现**旧文件独有的 `Sphere`**（硬编码兜底场景没有该对象），确证场景来自文件而非兜底；
- 保存链路同样为纯数据：`serialization.serialize(root)` 输出 `["__type__","name","position","rotation","components","children"]`，无 `__class__`；
- 0 控制台错误，121 FPS；全仓测试 71 文件 / 636 用例通过。

### S3 脚本处理过的细节（踩坑记录）

1. 旧格式里 Transform 既可能是**组件**（`components[0]` 为无 `__class__` 的普通对象，字段平铺）也可能内联在对象上，两种形态都要提取，否则对象位置整片丢失；
2. `components` 中的 `null` 占位需清除；
3. 角度字段 `rx/ry/rz` 必须换算为弧度（实测 `50° / -30°` → `0.8727 / -0.5236`）；
4. 旧资源不描述材质，但**不能省略 `material`**：`RenderableLogic` 的默认材质兜底路径会抛
   `Cannot set properties of undefined (setting 'version')`（`View.ts` 提交渲染失败），
   也**不能多个 MeshRenderer 共用一个材质对象**；正确做法是每个 MeshRenderer 生成独立默认材质。

### 遗留观察（已定位并修复）

迁移后默认场景中「`Sphere` 渲染为黑色球体」实际是**两个问题叠加**：

1. 编辑器自身的 trident（原点处的坐标轴指示器）渲染为黑色块，被误认为 Sphere；
2. `SphereGeometry` 的三角形绕序与顶点法线**相反**（正面朝内），被管线 `cullFace: 'back'`
   整片剔除，球体**完全不可见**——用「换成 `CubeGeometry` 即正常显示」的实验确证。

定位手段：先按「几何体数据 / 材质」二分——补顶点色与法线校验用例（顺带发现并修复了接缝重复点
法线未归一化的问题），再用场景文件把材质换成不受光照影响的 `ColorMaterial`（仍不可见，排除光照），
最后用「三角形几何法线 × 顶点法线」的点积判据定量确认绕序反向（实测 −13.26）。

修复后球体正常显示，回归用例见 `packages/feng3d/src/primitives/SphereGeometry.spec.ts`
的「三角形绕序与顶点法线一致（正面朝外）」。

**当前临时兜底**：`createDefaultScene()`（纯数据字面量默认场景）继续生效，直到 S3 完成并逐字段对齐。
