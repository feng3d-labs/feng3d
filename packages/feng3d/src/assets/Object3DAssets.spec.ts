import { describe, expect, it } from 'vitest';

// destroyGpuResourcesOf 经 @feng3d/webgpu barrel 引入，需先 stub GPU 全局
import '../test/webgpu-stub';

import { reactive } from '@feng3d/reactivity';
import type { Object3D } from '../core/Object3D';
import '../core/Object3D'; // 触发 registerLogic('Object3D', ...)
import type { MeshRenderer } from '../core/MeshRenderer';
import '../core/MeshRenderer';
import '../primitives/CubeGeometry'; // 触发 registerLogic('CubeGeometry', ...)
import '../materials/StandardMaterial';
import '../materials/TextureMaterial';
import { setTextureForTest } from '../textures/TextureResource';
import { AssetLoadStatus, AssetReader, collectAssets, whenAssetsLoaded } from './Object3DAssets';

/**
 * 对象树资源清单与"全部加载完成"等待（issue #60）。
 *
 * 资源侧走声明式纹理（`{ __type__: 'Texture', url }`）与纹理缓存；
 * 等待逻辑的可注入读取器让测试无需真实网络与 Image 即可确定性地驱动状态推进。
 */
describe('assets/Object3DAssets', () =>
{
    /** 造一个带声明式纹理的 MeshRenderer 对象（url 省略时为无资源对象） */
    function meshObject(url?: string): Object3D
    {
        return {
            __type__: 'Object3D',
            components: [{
                __type__: 'MeshRenderer',
                geometry: { __type__: 'CubeGeometry' },
                material: url
                    ? { __type__: 'TextureMaterial', s_texture: { __type__: 'Texture', url } }
                    : { __type__: 'MeshRenderer' },
            } as MeshRenderer],
        };
    }

    /**
     * 受控的假资源读取器：状态源是响应式 Map，测试可随时推进状态。
     *
     * 契约与默认读取器一致——`statusOf` 在 effect 内读取即建立依赖，
     * 状态推进触发等待方重新评估。
     */
    function createFakeAssetReader(): { reader: AssetReader; setStatus: (url: string, status: AssetLoadStatus) => void }
    {
        const r_states = reactive(new Map<string, AssetLoadStatus>());

        return {
            reader: {
                load: (url: string) =>
                {
                    // 幂等：已发起过（含已加载 / 已失败）的不重置
                    if (!r_states.has(url)) r_states.set(url, 'loading');
                },
                statusOf: (url: string) => r_states.get(url) ?? 'none',
            },
            setStatus: (url: string, status: AssetLoadStatus) =>
            {
                r_states.set(url, status);
            },
        };
    }

    it('收集：嵌套子树与组件里的资源都被收集，同一 url 去重', () =>
    {
        const root: Object3D = {
            __type__: 'Object3D',
            children: [
                meshObject('a.png'),
                {
                    __type__: 'Object3D',
                    children: [{
                        __type__: 'Object3D',
                        children: [meshObject('b.png')],
                    }],
                },
                // 与第一棵子树引用同一 url：只算一项
                meshObject('a.png'),
            ],
        };

        const assets = collectAssets(root);

        expect(assets.map(a => a.url)).toEqual(['a.png', 'b.png']);
        expect(assets.map(a => a.assetType)).toEqual(['texture', 'texture']);
        // 保留原始声明对象，调用方可据此回查
        expect(assets[0].asset.__type__).toBe('Texture');
    });

    it('收集：不引用任何资源时为空数组（运行时 Texture 不算资源）', () =>
    {
        expect(collectAssets({ __type__: 'Object3D' })).toEqual([]);
        expect(collectAssets(meshObject())).toEqual([]);

        // 已经是运行时 Texture 对象（没有 __type__ / url）→ 无需读取
        const runtimeTexture: Object3D = {
            __type__: 'Object3D',
            components: [{
                __type__: 'MeshRenderer',
                geometry: { __type__: 'CubeGeometry' },
                material: {
                    __type__: 'TextureMaterial',
                    s_texture: { descriptor: { size: [1, 1], format: 'rgba8unorm' } },
                },
            } as unknown as MeshRenderer],
        };

        expect(collectAssets(runtimeTexture)).toEqual([]);
    });

    it('等待：不引用任何资源时 Promise 立即 resolve（默认读取器）', async () =>
    {
        await expect(whenAssetsLoaded({ __type__: 'Object3D' })).resolves.toBeUndefined();
    });

    it('等待：资源全部已加载时 Promise 立即 resolve（假读取器）', async () =>
    {
        const fake = createFakeAssetReader();
        fake.setStatus('ready.png', 'loaded');

        await expect(whenAssetsLoaded(meshObject('ready.png'), fake.reader)).resolves.toBeUndefined();
    });

    it('等待：有资源未加载时不 resolve，补齐后 resolve（假读取器）', async () =>
    {
        const fake = createFakeAssetReader();
        let resolved = false;

        const promise = whenAssetsLoaded(meshObject('pending.png'), fake.reader).then(() =>
        {
            resolved = true;
        });

        // 首次评估已把 url 置为 loading：等一轮宏任务确认 Promise 没有提前兑现
        await new Promise((r) => setTimeout(r, 0));
        expect(resolved).toBe(false);

        fake.setStatus('pending.png', 'loaded');
        await promise;
        expect(resolved).toBe(true);
    });

    it('等待：子树里还有未加载资源时整棵树都不算完成（假读取器）', async () =>
    {
        const fake = createFakeAssetReader();
        fake.setStatus('root.png', 'loaded');

        let resolved = false;
        const root: Object3D = {
            __type__: 'Object3D',
            children: [meshObject('root.png'), meshObject('child.png')],
        };

        const promise = whenAssetsLoaded(root, fake.reader).then(() =>
        {
            resolved = true;
        });

        await new Promise((r) => setTimeout(r, 0));
        expect(resolved).toBe(false);

        fake.setStatus('child.png', 'loaded');
        await promise;
        expect(resolved).toBe(true);
    });

    it('等待：资源读取失败时 reject，不静默等待（假读取器）', async () =>
    {
        const fake = createFakeAssetReader();
        const promise = whenAssetsLoaded(meshObject('broken.png'), fake.reader);

        fake.setStatus('broken.png', 'error');

        await expect(promise).rejects.toThrow('broken.png');
    });

    it('等待：默认读取器接纹理缓存，已就绪资源不重复发起加载', async () =>
    {
        setTextureForTest('cached.png', { descriptor: { size: [1, 1], format: 'rgba8unorm' } } as never);

        await expect(whenAssetsLoaded(meshObject('cached.png'))).resolves.toBeUndefined();
    });

    it('等待：默认读取器在资源真实读取失败时 reject', async () =>
    {
        // Node 环境无 Image，声明式纹理的真实加载必然失败 → 如实 reject
        await expect(whenAssetsLoaded(meshObject('missing-on-node.png'))).rejects.toThrow('missing-on-node.png');
    });
});
