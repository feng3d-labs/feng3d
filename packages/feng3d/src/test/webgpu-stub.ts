/**
 * Vitest setup：stub WebGPU 全局的**类**部分（GPUTexture / GPUBuffer 占位类）。
 *
 * ## 历史与现状（issue #624）
 *
 * 原先 `@feng3d/webgpu` / `@feng3d/shortcut` 有**三处**在模块求值期读宿主全局
 * （`GPUBufferUsage`、`GPUTexture`、`self`），Node 下 `import` 即 `ReferenceError`。
 * 本文件因此在所有测试模块 import 之前注入占位——**问题被知道、被单测 stub 绕过、
 * 却没有判据**（测试跑在"全局已被补齐"的世界里，真实 Node 宿主却缺这些全局）。
 *
 * issue #624 批次已把这三处惰性化：`WGPUBuffer.defaultGPUBufferUsage` 改 `static get`、
 * `GPUTexture.prototype.createView` 原型补丁改显式安装函数（`installGPUTextureCreateViewPatch`）、
 * `windowEventProxy` 的宿主目标改惰性解析。实测（esbuild bundle + `node` import，
 * 复现见 issue #624 正文）：`packages/{webgpu,shortcut,terrain,feng3d}/src/index.ts`
 * 四个入口在 Node v22.23.2 下**均已能 import**，本包的 monkey-patch 也不再依赖 import 期
 * 存在 `GPUTexture`（安装函数内部有 `typeof GPUTexture === 'undefined'` 守卫）。
 *
 * ## 那本文件为什么还留着
 *
 * 这些全局在**运行期**（函数体内）仍会被读：`defaultGPUBufferUsage` getter 的首次访问、
 * `WGPUTexture._getGPUTextureUsageFlags` 里的 `GPUTextureUsage`、`GPUBuffer` 的 `mapAsync`
 * 等。单测一旦走到 WebGPU 路径就仍需要它们，所以注入保留——**理由从「import 期会崩」
 * 变成「运行期要用」**。`GPUTexture` / `GPUBuffer` 两个占位类同理：目前包内已无
 * `GPUTextureView.texture` 的读取者（机械核对：只有写入点），占位类是为运行期路径保守保留；
 * 若要收紧成"最小 stub 集"，应单开一批做、并配一条 import 冒烟判据。
 *
 * **仍然欠的账**：`import` 冒烟（bundle → `node` import）**尚未进 CI**，同类回归不会被
 * 自动发现（只能照 issue #624 的复现命令手工跑）。这正是"被 stub 绕过"的根因仍在的地方，
 * 收紧路径见该 issue 的建议 3。
 *
 * 两处补全分工（避免重复注入、也避免遗漏）：
 * - 根 [vitest.setup.ts](../../../../vitest.setup.ts) 负责完整常量表并 `import` 本文件，
 *   覆盖全仓测试；
 * - 本文件由需要 WebGPU 类 stub 的 spec 直接 `import`，保证单包内独立跑测试时也成立。
 * 两者都用 `typeof === 'undefined'` 判断，先到先得，不会互相覆盖。
 */
const g = globalThis as Record<string, unknown>;

if (typeof g.GPUBufferUsage === 'undefined')
{
    g.GPUBufferUsage = {
        MAP_READ: 1, MAP_WRITE: 2, COPY_SRC: 4, COPY_DST: 8,
        INDEX: 16, VERTEX: 32, UNIFORM: 64, STORAGE: 128,
        INDIRECT: 256, QUERY_RESOLVE: 512,
    };
}
if (typeof g.GPUTextureUsage === 'undefined')
{
    g.GPUTextureUsage = {
        COPY_SRC: 1, COPY_DST: 2, TEXTURE_BINDING: 4,
        STORAGE_BINDING: 8, RENDER_ATTACHMENT: 16,
    };
}

// @feng3d/webgpu 在加载时 monkey-patch GPUTexture.prototype.createView 等方法。
// Node 下无 GPUTexture 类，注入占位类以满足 `(GPUTexture.prototype as any).createView` 访问。
if (typeof g.GPUTexture === 'undefined')
{
    class GPUTextureStub
    {
        createView(_descriptor?: unknown): unknown { return {}; }
        destroy(): void { /* noop */ }
    }
    g.GPUTexture = GPUTextureStub;
}
if (typeof g.GPUBuffer === 'undefined')
{
    class GPUBufferStub
    {
        mapAsync(): Promise<void> { return Promise.resolve(); }
        getMappedRange(): ArrayBuffer { return new ArrayBuffer(0); }
        unmap(): void { /* noop */ }
        destroy(): void { /* noop */ }
    }
    g.GPUBuffer = GPUBufferStub;
}
