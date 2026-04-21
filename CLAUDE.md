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
- **只读类型**: 库的导出类型默认使用 readonly，表示数据不可变。数据修改应通过响应式系统进行

### WebGPU API 兼容性
- WebGPU API 要求数组必须是可变的，但库使用 readonly 数组
- 在与 WebGPU API 交互的边界处，使用 `TypeConvert.ts` 中的工具函数进行转换
- 不要简单地移除 readonly 修饰符

### 提交规范
- 使用语义化提交消息：`feat:`, `fix:`, `chore:`, `refactor:`, `docs:`
- 每个 commit 应该只做一件事
- 不要在提交中包含截图、日志文件等临时文件

### 响应式系统
- 库的设计原则是：默认不支持改变数据，仅支持读取数据
- 修改数据需要使用 `@feng3d/reactivity` 提供的响应式 API
- ReactiveObject 类用于创建响应式对象

#### 响应式对象使用规则
1. **监听与使用分离**: 监听时使用响应式对象（用于建立依赖），使用时使用原始对象
   - 例如：`const r_obj = reactive(obj);` 用于监听，`obj.prop` 用于使用
2. **命名规范**: 所有响应式对象（属性/变量）名称必须使用 `r_` 前缀
   - 例如：`const r_bufferBinding = reactive(bufferBinding);`
3. **函数参数**: 函数不应该接收响应式对象作为参数
   - 函数内部应自行创建响应式对象用于监听
   - 在需要传入对象给外部函数时，使用 `toRaw()` 获取原始对象
4. **TypedArray 访问**: 访问 TypedArray 的属性（如 `buffer`、`byteOffset`）时，确保使用原始对象
   - 如果 TypedArray 可能被响应式包装，使用 `toRaw()` 获取原始对象
   - 示例（见 `WGPUBindGroupEntry.ts`）：`WGPUBufferBinding.getInstance(device, toRaw(bufferBinding), type);`

### 调试和测试
- 示例位于 `packages/webgpu/examples/`
- 使用 `npm run dev` 启动开发服务器
- 使用 `npm run types` 检查类型错误
- 使用 `npm run lint` 检查代码风格
