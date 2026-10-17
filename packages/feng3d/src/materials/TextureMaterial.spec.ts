import { describe, expect, it } from 'vitest';

import '../test/webgpu-stub';

import { logicOrThrow, reactive } from '@feng3d/reactivity';
import type { RenderObject } from '@feng3d/webgpu';
import './TextureMaterial';
import type { TextureMaterial } from './TextureMaterial';
import type { MaterialLogic } from './Material';

/**
 * TextureMaterialLogic 的纹理换装（issue #947）。
 *
 * 浏览器里实测：`reactive(material).s_texture = next` 后数据变了、GPU 纹理也重建了，
 * 但画面始终是第一张纹理。这里把「beforeRender 是否写入新的 textureView」钉住——
 * 不需要 GPU：beforeRender 只往 renderObject 这个纯数据对象上写。
 */
describe('TextureMaterialLogic 纹理换装（issue #947）', () =>
{
    /** 最小纹理数据（buildTextureView 只读 descriptor.dimension） */
    function makeTexture(name: string): { descriptor: { size: [number, number]; format: 'rgba8unorm' }; name: string }
    {
        return { descriptor: { size: [1, 1], format: 'rgba8unorm' }, name };
    }

    const textureA = makeTexture('A');
    const textureB = makeTexture('B');

    /** 直接对一个 material 数据对象取 logic */
    function mount(material: Record<string, unknown>): MaterialLogic
    {
        const mat = { __type__: 'TextureMaterial', ...material } as unknown as TextureMaterial;

        return logicOrThrow(mat) as MaterialLogic;
    }

    /** 取出 beforeRender 写进 renderObject 的纹理视图 */
    function textureViewOf(l: MaterialLogic): { texture?: unknown }
    {
        const renderObject = {} as RenderObject;

        l.beforeRender(renderObject);

        const bindingResources = renderObject.bindingResources as unknown as Record<string, { texture?: unknown }>;

        return bindingResources.s_texture_texture;
    }

    it('初始 s_texture 写入对应的 textureView', () =>
    {
        const view = textureViewOf(mount({ s_texture: textureA }));

        expect(view.texture).toBe(textureA);
    });

    it('修改纯数据 s_texture 后 beforeRender 写入新的 textureView', () =>
    {
        const material = { __type__: 'TextureMaterial', s_texture: textureA } as unknown as TextureMaterial;
        const l = logicOrThrow(material) as MaterialLogic;

        const before = textureViewOf(l);

        expect(before.texture).toBe(textureA);

        reactive(material as unknown as { s_texture?: unknown }).s_texture = textureB;

        const after = textureViewOf(l);

        expect(after).not.toBe(before);
        expect(after.texture).toBe(textureB);
    });
    it('换纹理后 renderObject.revision 递增（RenderBundle 缓存据此失效，issue #947）', () =>
    {
        const material = { __type__: 'TextureMaterial', s_texture: textureA } as unknown as TextureMaterial;
        const l = logicOrThrow(material) as MaterialLogic;
        const ro = {} as RenderObject;

        l.beforeRender(ro);
        const before = (ro as { revision?: number }).revision ?? 0;

        reactive(material as unknown as { s_texture?: unknown }).s_texture = textureB;
        l.beforeRender(ro);
        const after = (ro as { revision?: number }).revision ?? 0;

        expect(after).toBeGreaterThan(before);
    });

    it('相同纹理重复 beforeRender 不递增 revision（bundle 才能缓存）', () =>
    {
        const material = { __type__: 'TextureMaterial', s_texture: textureA } as unknown as TextureMaterial;
        const l = logicOrThrow(material) as MaterialLogic;
        const ro = {} as RenderObject;

        l.beforeRender(ro);
        const before = (ro as { revision?: number }).revision ?? 0;

        l.beforeRender(ro);
        expect((ro as { revision?: number }).revision ?? 0).toBe(before);
    });
});
