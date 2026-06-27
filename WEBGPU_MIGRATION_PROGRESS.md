# WebGPU 迁移进度与规划

> 文档更新日期：2026-06-27
> 目标分支：`feng/webgpu`

---

## 一、当前状态总览

| 项目 | 状态 | 说明 |
|------|------|------|
| @feng3d/core 编译 | ✅ 通过 | 0 错误 |
| @feng3d/webgpu 编译 | ✅ 通过 | 0 错误 |
| 渲染架构 | ⚠️ 混合状态 | 同时引用 @feng3d/renderer 和 @feng3d/webgpu |
| Shader 迁移 | 🔲 刚开始 | 仅基础框架，GLSL 未翻译 |
| 阴影渲染 | 🔲 待重构 | 仍使用 WebGL 时代 FrameBufferObject |
| 响应式系统 | ✅ 基础就绪 | Transform 响应式已完善 |

---

## 二、已完成工作

### 2.1 编译错误修复（54 → 0）

**Transform 增强**：
- 添加 `x`/`y`/`z` 快捷属性（对应 position）
- 添加 `rx`/`ry`/`rz` 快捷属性（对应 rotation）
- 添加 `setPosition`/`setRotation`/`setScale` 批量修改方法
- 添加 `localToWorldMatrix` setter
- 内部使用 `reactive()` + `batchRun()` 确保响应式更新

**事件系统**：
- 在 `GameObjectEventMap` 中添加 `scenetransformChanged` 事件
- 在 `GameObjectEventMap` 中添加 `updateLocalToWorldMatrix` 事件

**Renderable 调整**：
- `geometry` 属性移除 `readonly` 修饰符，支持直接赋值

**渲染器修复**：
- `ShadowRenderer`：修复 shadowMap 类型断言、transform 赋值方式
- `WireframeRenderer`：重构线框渲染逻辑，移除不存在的函数引用
- `MouseRenderer`：修复 `RenderObject` 导入
- `LookAtController`：修复 position 类型不匹配
- `View.ts`：修复 Computed 取值方式与 transform 赋值

### 2.2 WebGPU 包结构

**已有的数据层（data/）**：
- `RenderObject` - 渲染对象核心接口
- `BindingResources` - 绑定资源
- `RenderPipeline` / `RenderPass` / `Submit` - 渲染管线
- `Texture` / `TextureView` / `Sampler` - 纹理资源
- `Buffer` / `BufferBinding` - 缓冲区
- `VertexAttributes` / `VertexState` - 顶点状态
- `BlendState` / `DepthStencilState` / `PrimitiveState` - 渲染状态
- `RenderTarget` - 渲染目标（新增）
- `ShadowMap` - 阴影贴图（新增）

**已有的内部层（internal/）**：
- `runSubmit` / `runCommandEncoder` / `runRenderPass` - 执行层
- `runRenderObject` - 渲染对象执行
- `runBindGroup` / `runPipeline` / `runDraw` 等 - 细粒度执行

**已有的 WGSL 着色器（shaders/）**：
- `common.wgsl.ts` - 通用工具函数
- `texture.vertex/fragment.wgsl.ts` - 纹理着色器
- `color.vertex/fragment.wgsl.ts` - 颜色着色器
- `standard.vertex/fragment.wgsl.ts` - 标准着色器框架

---

## 三、核心问题与技术债务

### 3.1 双渲染器并存

**现状**：core 包同时引用两个渲染器包

| 来源 | 文件数 | 主要引用内容 |
|------|--------|-------------|
| `@feng3d/renderer` | 25 个文件 | `Shader`、`GL`、`TextureFormat`、`RenderParams`、`FrameBuffer`、`Index`、`Attribute` 等 |
| `@feng3d/webgpu` | 21 个文件 | `RenderObject`、`Submit`、`RenderPass`、`BindingResources`、`BufferBinding`、`TextureView` 等 |

**问题**：
- 两套类型系统并存，概念重叠（Texture、Shader、RenderParams 等）
- 代码维护成本高
- 运行时可能出现类型混淆

### 3.2 RenderObject 扩展问题

**现状**：core 包通过 `MixinsRenderObject` 全局声明向 `RenderObject` 注入属性：
- `Geometry.ts` 注入 `index?: Index`
- `ShadowRenderer.ts` 注入 `shadowShader?: Shader`
- `WireframeRenderer.ts` 注入 `wireframeindexBuffer` / `wireframeShader`

**问题**：
- 污染 webgpu 包的纯净性
- 扩展属性类型来自 `@feng3d/renderer`，与 webgpu 原生类型不兼容
- 增加模块耦合度

**建议**：在 core 包内部定义 `CoreRenderObject` 扩展类型，而不是修改 webgpu 的定义。

### 3.3 阴影渲染架构

**现状**：`ShadowRenderer` 仍使用 WebGL 时代的 `FrameBufferObject`、`RenderTargetTexture2D` 等概念，通过 `as any` 绕过类型检查。

**需要重构**：
- 使用 WebGPU 的 `RenderTarget` 数据结构
- 阴影相机参数与 WebGPU 渲染管线集成
- 级联阴影（CSM）的 WebGPU 实现

### 3.4 着色器迁移

**现状**：
- core 包 `src/shaders/` 下有大量 GLSL 着色器（~50 个文件）
- webgpu 包仅有基础框架
- 运行时仍使用 WebGL 着色器系统（`@feng3d/renderer` 的 Shader + ShaderLib）

**GLSL 着色器清单**：

**主着色器（16 个）**：
- `color.vertex/fragment.glsl.ts`
- `texture.vertex/fragment.glsl.ts`
- `standard.vertex/fragment.glsl.ts`
- `skybox.vertex/fragment.glsl.ts`
- `shadow.vertex/fragment.glsl.ts`
- `wireframe.vertex/fragment.glsl.ts`
- `outline.vertex/fragment.glsl.ts`
- `mouse.vertex/fragment.glsl.ts`
- `point.vertex/fragment.glsl.ts`
- `segment.vertex/fragment.glsl.ts`
- `terrain.vertex/fragment.glsl.ts`
- `water.vertex/fragment.glsl.ts`
- `Particles_Additive.vertex/fragment.glsl.ts`
- `Particles_AlphaBlendedPremultiply.vertex/fragment.glsl.ts`

**模块着色器（~40 个，modules/）**：
- 顶点模块：`project_vert`、`position_vert`、`normal_vert`、`uv_vert`、`color_vert`、`lights_vert`、`shadowmap_pars_frag` 等
- 片段模块：`ambient_frag`、`diffuse_frag`、`specular_frag`、`fog_frag`、`alphatest_frag`、`envmap_frag`、`normal_frag` 等

**后处理（postEffect/）**：
- `fxaa.fragment.glsl.ts`

---

## 四、后续工作规划

### 阶段一：架构统一（高优先级）

**目标**：消除双渲染器并存，core 包只依赖 @feng3d/webgpu

#### 任务 1.1：RenderObject 本地化

- [ ] 在 core 包内部定义 `CoreRenderObject` 扩展接口
- [ ] 移除所有 `declare global { interface MixinsRenderObject }` 声明
- [ ] 各组件/渲染器使用自己的扩展类型，不污染 webgpu 包
- [ ] 确保 webgpu 包的 RenderObject 保持纯净

#### 任务 1.2：渲染参数统一

- [ ] 将 `@feng3d/renderer` 的 `RenderParams` 迁移为 webgpu 原生结构
- [ ] `PrimitiveState` / `DepthStencilState` / `BlendState` 的映射关系
- [ ] Material 系统使用 webgpu 原生渲染状态

#### 任务 1.3：纹理系统统一

- [ ] `TextureInfo` 与 webgpu `Texture` 的关系澄清
- [ ] 移除对 `@feng3d/renderer` 中 `Texture`、`TextureFormat` 等的引用
- [ ] 统一到 webgpu 的纹理类型系统

#### 任务 1.4：移除 @feng3d/renderer 依赖

- [ ] core 包 package.json 移除 `@feng3d/renderer` 依赖
- [ ] 所有导入替换为 `@feng3d/webgpu`
- [ ] 验证编译通过

### 阶段二：着色器迁移（高优先级）

**目标**：所有 GLSL 着色器翻译为 WGSL

#### 任务 2.1：建立 WGSL 模块系统

- [ ] 设计 WGSL 模块组合机制（类似 Three.js 的 ShaderChunk）
- [ ] 字符串拼接 or 函数调用？确定组合方式
- [ ] shaderMacro 在 WGSL 中的实现方式（const if / 代码生成）

#### 任务 2.2：翻译主着色器

按使用频率和重要性排序：

- [ ] `color` 着色器（顶点 + 片段）
- [ ] `texture` 着色器（顶点 + 片段）
- [ ] `standard` 着色器（PBR，顶点 + 片段）
- [ ] `skybox` 着色器
- [ ] `shadow` 着色器
- [ ] `wireframe` 着色器
- [ ] `outline` 着色器
- [ ] `mouse` 着色器
- [ ] `point` 着色器
- [ ] `segment` 着色器
- [ ] `terrain` 着色器
- [ ] `water` 着色器
- [ ] `Particles` 着色器

#### 任务 2.3：翻译公共模块

- [ ] `project` / `view` / `model` 矩阵相关
- [ ] `normal` / `tangent` 变换
- [ ] `uv` 处理
- [ ] `color` 处理
- [ ] `fog` 雾效
- [ ] `lights` 光照（ambient / diffuse / specular）
- [ ] `shadowmap` 阴影采样
- [ ] `envmap` 环境贴图
- [ ] `alphatest` 透明度测试
- [ ] `skeleton` 骨骼动画

#### 任务 2.4：后处理着色器

- [ ] `fxaa` 后处理

### 阶段三：阴影渲染重构（中优先级）

**目标**：完全使用 WebGPU 离屏渲染实现阴影

#### 任务 3.1：ShadowMap 数据结构

- [ ] 2D 阴影贴图（方向光 / 聚光灯）
- [ ] Cube 阴影贴图（点光源）
- [ ] 级联阴影贴图（CSM）支持
- [ ] 深度纹理 + 比较采样器

#### 任务 3.2：阴影渲染管线

- [ ] 阴影 Pass 的 RenderPassDescriptor 创建
- [ ] 阴影着色器（只写深度）
- [ ] 视口裁剪与多面渲染
- [ ] 背面剔除优化

#### 任务 3.3：阴影采样

- [ ] PCF 软阴影
- [ ] Poisson 采样
- [ ] 级联混合

### 阶段四：性能与优化（低优先级）

- [ ] GPU 资源生命周期管理（创建 / 销毁 / 复用）
- [ ] 渲染对象排序与合批
- [ ] Uniform buffer 布局优化
- [ ] Instanced 渲染优化

---

## 五、关键文件索引

### WebGPU 包（packages/webgpu/src/）

| 路径 | 说明 |
|------|------|
| `data/RenderObject.ts` | 渲染对象核心接口（保持纯净，不扩展） |
| `data/RenderTarget.ts` | 渲染目标（离屏渲染） |
| `data/ShadowMap.ts` | 阴影贴图数据结构 |
| `data/BindingResources.ts` | 绑定资源 |
| `shaders/` | WGSL 着色器目录 |
| `internal/runSubmit.ts` | 提交执行入口 |

### Core 包（packages/core/src/）

| 路径 | 说明 |
|------|------|
| `core/Transform.ts` | 变换组件（响应式） |
| `core/Renderable.ts` | 可渲染组件 |
| `core/View.ts` | 视图（渲染提交入口） |
| `render/renderer/ForwardRenderer.ts` | 前向渲染器 |
| `render/renderer/ShadowRenderer.ts` | 阴影渲染器（需重构） |
| `render/renderer/WireframeRenderer.ts` | 线框渲染器 |
| `render/renderer/OutlineRenderer.ts` | 轮廓渲染器 |
| `render/FrameBufferObject.ts` | WebGL 帧缓冲（待替换） |
| `materials/Material.ts` | 材质基类 |
| `textures/TextureInfo.ts` | 纹理信息基类 |
| `shaders/` | GLSL 着色器（待迁移） |
| `render/shader/ShaderLib.ts` | 着色器库（WebGL 时代） |

---

## 六、开发注意事项

1. **webgpu 包保持纯净**：不要向 `@feng3d/webgpu` 的核心接口（如 `RenderObject`）注入 core 包特有的属性。需要扩展时在 core 包内部定义本地类型。

2. **响应式系统**：修改 Transform 的 position/rotation/scale 时，必须通过 `reactive()` 包装后修改，或使用 `setPosition()` 等方法，确保依赖更新正确触发。

3. **着色器迁移方式**：
   - shaderMacro 使用字符串拼接 + `const if` 方式实现
   - 模块复用采用函数调用形式，而非 #include
   - 注意 WGSL 中矩阵、向量的操作方式与 GLSL 的差异

4. **增量迁移**：优先迁移最常用的着色器（color、texture、standard），逐步替换。迁移期间可以两套系统并存。

5. **提交规范**：每个功能点单独提交，保持提交历史清晰。

---

## 七、快速开始

```bash
# 安装依赖
npm install

# 类型检查
npm run types

# 核心包类型检查
cd packages/core && npx tsc --noEmit

# webgpu 包类型检查
cd packages/webgpu && npx tsc --noEmit

# 查看当前状态
git status
git log --oneline -10
```
