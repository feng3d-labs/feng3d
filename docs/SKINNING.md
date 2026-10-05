# 蒙皮（Skinning）现状与边界

> issue #337。本文件记录 WGSL 蒙皮的**已落地链路**、**关键约束**与**明确的边界 / 欠账**，
> 避免读者按"看起来该支持"去推断完成度。

## 数据链（已落地）

1. **顶点属性**：`CustomGeometry` 的 `positions` / `a_skinIndices` / `a_skinWeights` /
   `a_skinIndices1` / `a_skinWeights1` 经 computed 桥接到顶点属性表
   （`packages/feng3d/src/geometry/CustomGeometry.ts`）。
2. **glTF 加载**：`JOINTS_0`/`WEIGHTS_0` 与 `JOINTS_1`/`WEIGHTS_1` 解析到上述字段
   （`packages/addons/src/loaders/GLTFLoader.ts`），每顶点最多 8 根骨骼。
3. **骨骼矩阵**：`Skeleton` 提供 `boneNames`/`boneInverses`，
   `SkeletonLogic.globalMatrices` 算出每根骨骼的蒙皮矩阵。
4. **渲染**：`SkinnedMeshRenderer` 的 `beforeRender` 把骨骼矩阵补齐到 `SKIN_MATRIX_COUNT`（150）
   写入 `@group(3) @binding(0)`，并把标准材质顶点着色器换装成蒙皮变体
   （`packages/feng3d/src/shaders/modules/skeleton.wgsl.ts`、
   `packages/feng3d/src/materials/standardVertexShader.ts`）。

## 顶点缓冲布局（关键约束）

WebGPU 默认 `maxVertexBuffers = 8`，而顶点缓冲按"属性数据对象"（同一个 TypedArray 引用）分组
（`packages/webgpu/src/caches/WGPUVertexBufferLayout.ts`）。

标准材质 5 个属性（position / normal / tangent / uv / color）+ 两组蒙皮 4 个属性 = 9 个缓冲，
会让 `CreateRenderPipeline` 直接报 "Vertex buffer count (9) exceeds ... (8)"。
因此 4 个蒙皮属性在 `CustomGeometry` 侧**交错进同一个顶点缓冲**
（`interleaveSkinAttributes`）：每顶点 16 个 float、`arrayStride` 64 字节，
`offset` 0 / 16 / 32 / 48 对应着色器 location 5 / 6 / 7 / 8。归并后蒙皮管线共 **6 个**缓冲。

## 已明确的边界与欠账

- **法线不参与蒙皮**：与 GLSL 旧源 `skeleton_pars_vert.glsl` 一致，只蒙皮位置。
  严格来说蒙皮旋转（尤其非均匀缩放）下法线应使用骨骼矩阵的逆转置 3×3 变换；
  当前实现不做，因此蒙皮大形变时光照沿用绑定姿态法线。
  改成蒙皮法线会改变既有场景的逐像素结果，需单独一批并重跑可视基线。
- **只有标准材质有蒙皮变体**：`SkinnedMeshRenderer` 只识别 `standardVertexWGSL`，
  ColorMaterial / TextureMaterial / PointMaterial 等材质的管线不换装——用它们渲染
  `SkinnedMeshRenderer` 时网格随节点刚性移动、不蒙皮。为其他材质补变体需要各材质提供
  蒙皮顶点着色器与顶点输入声明，属后续工作。
- **骨骼数上限**：`SKIN_MATRIX_COUNT = 150`，骨骼矩阵数组长度是 WGSL 编译期常量，
  超出上限的骨骼被截断（glTF 实际模型通常远小于它）。
- **两组关系**：第一组与第二组的权重和分别累加；两组权重和为 0 时 `skinPosition` 原样返回位置
  （顶点属性缺失时引擎零填充为 0 的兜底）。这与 GLSL 旧源略有差异——旧源在权重全 0 时返回
  `(0, 0, 0, position.w)`，即把位置归零；WGSL 侧改为原样返回是有意的健壮性改进。

## 验收

- 单测：`packages/feng3d/src/animators/skeleton/SkinnedMeshRenderer.spec.ts`（WGSL 结构、
  location 5–8、管线换装缓存）、`skinningVertexLayout.spec.ts`（交错后 6 个缓冲 ≤ 8、location 0–8）、
  `packages/feng3d/src/geometry/Geometry.spec.ts`（交错布局与缺失组补零）、
  `packages/addons/test/gltfLoaderSkinAttributes.spec.ts`（JOINTS_0/1 解析）。
- 可视：`examples/src/animator/SkinningTest.ts` 与 e2e 基线
  `.verify/examples.spec.ts/SkinningTest.png`。
