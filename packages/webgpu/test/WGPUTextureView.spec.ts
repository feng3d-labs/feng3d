import { installGPUTextureCreateViewPatch } from '../src/caches/WGPUTextureView';

import { assert, describe, it } from 'vitest';

interface GPUTextureCtorLike
{
    new (): { createView(descriptor?: unknown): { texture?: unknown } };
    prototype: { createView(descriptor?: unknown): unknown };
}

/** `GPUTexture` 在测试环境由 `vitest.setup.ts` 注入占位类，不是 @webgpu/types 的接口，故经 globalThis 取用 */
const GPUTextureCtor = (globalThis as unknown as { GPUTexture: GPUTextureCtorLike }).GPUTexture;

/**
 * issue #624 回归：`GPUTexture.prototype.createView` 的原型补丁必须由显式安装函数装上，
 * 而不是在模块顶层执行（顶层执行会在 Node / SSR 下 `ReferenceError: GPUTexture is not defined`）。
 */
describe('installGPUTextureCreateViewPatch（issue #624）', () =>
{
    it('安装后 createView 出来的视图带 texture 反向引用', () =>
    {
        installGPUTextureCreateViewPatch();

        const texture = new GPUTextureCtor() as unknown as { createView(descriptor?: unknown): { texture?: unknown } };
        const view = texture.createView({});

        assert.strictEqual(view.texture, texture);
    });

    it('幂等：重复调用不会重复包装', () =>
    {
        installGPUTextureCreateViewPatch();
        const once = GPUTextureCtor.prototype.createView;

        installGPUTextureCreateViewPatch();

        assert.strictEqual(GPUTextureCtor.prototype.createView, once);
    });
});
