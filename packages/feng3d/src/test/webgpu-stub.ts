/**
 * Vitest setup：stub WebGPU 全局的**类**部分（GPUTexture / GPUBuffer 占位类）。
 *
 * @feng3d/webgpu 的部分模块在静态初始化（class static field）时引用
 * `GPUBufferUsage` / `GPUTextureUsage` 等浏览器全局。Node 环境下这些全局不存在，
 * 会导致 import 阶段即 ReferenceError，使依赖 @feng3d/webgpu 的单元测试无法运行。
 *
 * 本 setup 在所有测试模块 import 之前注入占位常量，使 geometry/material 等纯数据构建
 * 可在 node 下被测试。
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
