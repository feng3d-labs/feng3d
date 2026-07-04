# Feng3D 项目 - Claude Code 指南

本项目使用 npm workspaces monorepo 结构，包含以下子包：
- `@feng3d/watcher` - 文件监听库
- `@feng3d/reactivity` - 响应式系统
- `@feng3d/webgpu` - WebGPU 渲染库

## 项目特定规则

### 文件组织
- **截图文件**: 所有通过 Playwright MCP 生成的截图必须放在 `.playwright-mcp/` 目录中，不得放在项目根目录
- **源码发布**: 子包采用源码发布策略，不构建 dist 目录
- **着色器**: WebGPU 着色器以内联 TypeScript 字符串形式存在，不使用 .wgsl 文件

### 代码风格
- **TypeScript**: 使用严格的类型检查，`noEmit: true` 用于根目录
- **ESLint**: 所有 src 目录下的代码必须通过 lint 检查（无警告）
- **只读类型**: 数据类的基础属性默认使用 `readonly`，数据修改通过响应式系统进行（详见下方"响应式系统"章节）
- **类型导入**: 避免使用 `import('./path').Type` 动态导入语法
  - 应该在文件顶部使用常规 `import type { Type } from './path'` 导入
  - 动态导入会使代码难以阅读，且不利于静态分析

### WebGPU API 兼容性
- WebGPU API 要求数组必须是可变的，但库使用 readonly 数组
- 在与 WebGPU API 交互的边界处，使用 `TypeConvert.ts` 中的工具函数进行转换
- 不要简单地移除 readonly 修饰符

### 提交规范
- 使用语义化提交消息：`feat:`, `fix:`, `chore:`, `refactor:`, `docs:`
- 每个 commit 应该只做一件事
- 不要在提交中包含截图、日志文件等临时文件

### 响应式系统

#### 核心原则
- 库的设计原则是：默认不支持改变数据，仅支持读取数据
- 修改数据需要使用 `@feng3d/reactivity` 提供的响应式 API（`reactive()`、`computed()`、`effect()`）

#### 纯数据 + xLogic 架构模式

所有数据类遵循 **纯数据结构体 + 逻辑函数** 的分离模式：

1. **数据类（如 `Transform`、`Entity`、`Component`）**：
   - 仅包含 `readonly` 基础属性（可 JSON 序列化）
   - 不包含 computed、方法、effect、事件
   - 不继承有行为的基类

2. **逻辑函数（如 `transformLogic`、`entityLogic`）**：
   - 接收纯数据对象，返回 computed 属性和行为函数
   - 使用 `WeakMap` 缓存：同一对象始终返回同一组输出
   - 响应式依赖封装在闭包内

3. **消费方**：
   ```ts
   const logic = transformLogic(transform);
   logic.local2world.value;        // computed
   logic.lookAt(target);            // 方法
   ```

#### 响应式对象使用规则

**响应式对象始终仅存在于函数或闭包内**，不得作为属性存储、导出或传递。

响应式函数中一般分三个部分：

1. **监听** — 使用响应式对象的属性进行监听，构建响应式链条
   ```ts
   const r_entity = reactive(entity);
   const parent = r_entity.parent;  // 读取建立依赖
   ```

2. **修改** — 使用响应式属性进行修改数据
   ```ts
   reactive(entity).activeSelf = value;  // 写入触发更新
   ```

3. **传递** — 必须使用原生对象（非响应式对象）。从原始对象中获取，或用 `toRaw()` 转换
   ```ts
   // ✓ 从原始对象属性获取
   entityLogic(entity.parent);
   entityLogic(entity.children[i]);

   // ✓ 用 toRaw() 从响应式对象还原
   const r_entity = reactive(entity);
   entityLogic(toRaw(r_entity.parent));

   // ✗ 传入了响应式对象的深度解包类型
   entityLogic(reactive(entity).parent);
   ```

其他规则：

- **命名**：响应式变量使用 `r_` 前缀（如 `r_entity`、`r_child`）
- **`reactive()` 通过 WeakMap 缓存**：多次调用 `reactive(obj)` 返回同一个代理，无额外开销
- **`toRaw()`**：将响应式对象还原为原始对象，用于传递给其他函数

### 调试和测试
- 示例位于 `packages/webgpu/examples/`
- 使用 `npm run dev` 启动开发服务器
- 使用 `npm run types` 检查类型错误
- 使用 `npm run lint` 检查代码风格
