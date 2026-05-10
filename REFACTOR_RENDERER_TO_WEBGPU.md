# core 包 renderer 到 webgpu 迁移计划

## 背景

core 项目目前使用 `@feng3d/renderer` 包进行渲染，该包基于 WebGL API。
项目已迁移到 WebGPU（`@feng3d/webgpu`），需要将 core 包中的渲染代码完全迁移到 WebGPU API。

## 新架构设计

core 项目升级后的渲染架构：

### 1. 组件数据提供者
每个 GameObject 的组件提供渲染所需的数据（如 uniform、管线描述等）

### 2. Renderable 数据收集
- `Renderable` 类中包含一个 `RenderObject`
- 从组件中收集渲染所需的所有数据到 `bindingResources`

### 3. 前向渲染器（ForwardRenderer）
- 直接把 Renderable 中的 `RenderObject` 塞进 `renderpass`
- 添加相机、场景相关的全局数据

### 4. 特殊渲染器
- 线框渲染（WireframeRenderer）、阴影渲染（ShadowRenderer）时：
  - 创建新的 `renderpass`
  - 从 `RenderObject` 复制一份
  - 附加上相关支持数据进行渲染

### 5. 提交层（View.ts）
- 收集完整的 `Submit` 对象
- 提交给 webgpu 进行处理

## 迁移任务

### 阶段 1：更新架构基础

**组件数据收集**：
- [ ] 在组件中定义渲染数据接口（uniforms、管线等）
- [ ] 更新 `Renderable` 类以收集组件数据到 `bindingResources`

**ForwardRenderer 更新**：
- [ ] 修改 `ForwardRenderer` 以使用 webgpu 的 `RenderPass`
- [ ] 添加相机、场景全局数据

**特殊渲染器适配**：
- [ ] 更新 `WireframeRenderer` 以创建新的 renderpass
- [ ] 更新 `ShadowRenderer` 以创建新的 renderpass
- [ ] 其他渲染器适配或标记为 WebGL 专用

### 阶段 2：修复编译错误

修复因导入替换产生的编译错误：
- [ ] 修复 `uniforms` → `bindingResources`
- [ ] 修复事件名称错误
- [ ] 修复 Transform 只读属性错误
- [ ] 修复其他 API 兼容问题

### 阶段 3：替换导入和清理

- [ ] 将所有 `@feng3d/renderer` 导入替换为 `@feng3d/webgpu`
- [ ] 移除不再使用的文件或标记为已废弃
- [ ] 清理导入语句

## 优先级

**高优先级**：
1. 定义组件数据接口规范
2. 更新 `Renderable` 数据收集机制
3. 修改 `ForwardRenderer` 以支持新架构
4. 修复核心编译错误

**中优先级**：
5. 更新特殊渲染器（Wireframe、ShadowRenderer）
6. 清理废弃代码

## 预估工作量

- 阶段 1：3-5 天
- 阶段 2：2-3 天
- 阶段 3：2-3 天

**总计**：约 7-11 天
