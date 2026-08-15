import { describe, expect, it } from 'vitest';
import { computed } from '@feng3d/reactivity';
import { serialization } from '@feng3d/serialization';
import { defaultTexture } from './createTexture';
import { isTextureFieldLoaded, isTextureResource, resolveTexture, setTextureForTest, TextureResource } from './TextureResource';

/**
 * TextureResource 声明式纹理解析（框架设计文档 3.2）。
 *
 * Node 环境无 Image，真实加载路径必然失败（error 条目 + 占位符），
 * 用 setTextureForTest 注入验证 loaded 状态与响应式失效。
 */
describe('textures/TextureResource', () =>
{
    it('undefined 返回占位符，运行时 Texture 原样返回', () =>
    {
        expect(resolveTexture(undefined)).toBe(defaultTexture);

        const texture = { descriptor: { size: [1, 1], format: 'rgba8unorm' } } as any;
        expect(resolveTexture(texture)).toBe(texture);
    });

    it('声明式引用：未加载返回占位符且 isLoaded 为 false', () =>
    {
        const decl: TextureResource = { __type__: 'Texture', url: '/not-loaded.png' };

        expect(isTextureResource(decl)).toBe(true);
        expect(resolveTexture(decl, defaultTexture)).toBe(defaultTexture);
        expect(isTextureFieldLoaded(decl)).toBe(false);
    });

    it('加载完成后 computed 失效换装（响应式缓存 + 异步写入）', () =>
    {
        const decl: TextureResource = { __type__: 'Texture', url: '/swap-test.png' };
        const placeholder = { descriptor: { size: [1, 1], format: 'rgba8unorm' } } as any;
        const loaded = { descriptor: { size: [2, 2], format: 'rgba8unorm' } } as any;

        const c = computed(() => resolveTexture(decl, placeholder));
        expect(c.value).toBe(placeholder);

        // 模拟异步加载完成：写入响应式缓存 → computed 失效
        setTextureForTest('/swap-test.png', loaded);
        expect(c.value).toBe(loaded);
        expect(isTextureFieldLoaded(decl)).toBe(true);
    });

    it('同一 url 多处解析共享缓存（同一纹理对象）', () =>
    {
        const declA: TextureResource = { __type__: 'Texture', url: '/shared.png' };
        const declB: TextureResource = { __type__: 'Texture', url: '/shared.png' };
        const loaded = { descriptor: { size: [3, 3], format: 'rgba8unorm' } } as any;

        setTextureForTest('/shared.png', loaded);
        expect(resolveTexture(declA)).toBe(loaded);
        expect(resolveTexture(declB)).toBe(loaded);
    });

    it('声明式引用可序列化往返（保存 → 加载 → 等价）', () =>
    {
        const decl: TextureResource = { __type__: 'Texture', url: '/round-trip.png' };
        const restored = serialization.clone(decl) as TextureResource;

        expect(restored.__type__).toBe('Texture');
        expect(restored.url).toBe('/round-trip.png');
    });
});
