# 开发规范（严格执行）

本文件是本项目的开发规范，所有代码（含人工编写和 AI 辅助生成）都应严格执行。ZCode 会自动加载本文件作为项目指令。

## 1. 每次修改代码后必须检查运行日志
- 路径：`examples/logs/frontend_*.log`（按时间排序，取最新的）
- 压缩上下文后也不能忘记
- 如果有报错，必须修复后才能结束

## 2. 纯数据声明式风格
- 场景用单个 Object3D 字面量定义（参照 `examples/src/base/Container3DTest.ts`）
- 不使用 `new`、`createXxx()` 命令式 API
- 纯数据接口 + `__type__` 字面量

## 3. Logic 类化
- 所有 XxxLogic 是 class（不是 interface+工厂）
- protected constructor（只有 logic() 能创建）
- ComponentLogic.entity / .component 是 getter（只读）
- init() 接收可选 object3D 参数，子类 override 需调 super.init(object3D)

## 4. 文件组织
- 纯数据接口与 Logic 合并到同一文件（如 Behaviour.ts 包含 interface Behaviour + class BehaviourLogic）
- import 用 `logic` 函数（不用 `componentLogic`），局部变量冲突时用 `getLogic` 别名

## 5. 子模块
- packages/ 下是独立 git 仓库（submodule），改动需单独 commit
- 涉及：reactivity, webgpu, particlesystem, terrain 等
- 主仓库需额外提交一次 submodule 指针更新（`git add packages/xxx && git commit`）

## 6. 响应式对象使用规范
- **不要返回响应式对象**：函数/方法的返回值、对象的字段，都应返回/保存原始对象（raw），仅在需要建立响应式依赖的闭包内才用 `reactive()` 转换为响应式代理来使用
- **响应式对象统一用 `r_` 前缀**：所有持有响应式代理的变量/字段必须以 `r_` 开头（如 `r_stats`、`r_buffer`、`r_texture`），原始对象不加前缀。这样一眼能区分谁是响应式代理、谁是原始对象
- 写入响应式统计/全局对象时，避免「读响应式再写回」（如 `counter.x++`），改为从原始对象读取当前值、向响应式代理赋值新值
- **所有响应式属性都应该是 `readonly`**：纯数据接口中会被响应式系统追踪的字段，类型上一律声明为 `readonly`，防止外部直接赋值破坏内部统计/不变量；写入只通过专门的函数/方法（如 `trackCreate`/`addMemory`）经响应式代理进行

## 7. WGSL 着色器
- WGSL 着色器从原始 GLSL（保留在 `src/shaders/*.glsl` 和 `src/shaders/modules/*.glsl`）翻译而来
- 修改着色器时对照对应 GLSL 文件，保持语义一致
- 注意 WGSL 与 GLSL 的差异：不支持 swizzle 赋值、`textureSample` 需均匀控制流（非均匀流用 `textureSampleLevel`）、`@group/@binding` 在 vertex/fragment 间同名槽位必须一致
