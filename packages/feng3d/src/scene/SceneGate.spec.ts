import { describe, expect, it } from 'vitest';

import '../test/webgpu-stub';

import { logic } from '@feng3d/reactivity';
import type { Camera } from '../cameras/Camera';
import '../cameras/PerspectiveCamera';
import type { Object3D } from '../core/Object3D';
import '../core/Object3D';
import type { MeshRenderer } from '../core/MeshRenderer';
import '../core/MeshRenderer';
import type { Scene } from './Scene';
import './Scene'; // 触发 registerLogic('Scene', ...) 副作用
import { setTextureForTest } from '../textures/TextureResource';
import '../primitives/CubeGeometry'; // 触发 registerLogic('CubeGeometry', ...)
import '../materials/TextureMaterial';
import { ScenePickCache } from './ScenePickCache';

/**
 * 门控渲染接线（设计 3.2.2）：renderWhenLoaded=true 的对象在子树资源
 * （声明式纹理等）就绪前不进入渲染列表，就绪后经响应式失效自动出现；
 * 默认（不开启）走占位符渐进换装，loading 期间照常渲染。
 */
describe('scene 门控渲染（renderWhenLoaded）', () =>
{
    function buildScene(renderWhenLoaded: boolean): { scene: Scene; camera: Camera; model: MeshRenderer }
    {
        let camera: Camera;
        let model: MeshRenderer;
        const root: Object3D = {
            __type__: 'Object3D',
            components: [{ __type__: 'Scene' } as Scene],
            children: [{
                __type__: 'Object3D',
                components: [camera = { __type__: 'PerspectiveCamera' } as Camera],
            }, {
                __type__: 'Object3D',
                components: [model = {
                    __type__: 'MeshRenderer',
                    renderWhenLoaded,
                    geometry: { __type__: 'CubeGeometry' },
                    material: {
                        __type__: 'TextureMaterial',
                        s_texture: { __type__: 'Texture', url: 'gate-test.png' },
                    },
                } as MeshRenderer],
            }],
        };

        logic(root); // 触发组件自动初始化（Scene/Camera init 注入 entity）

        return { scene: root.components[0] as Scene, camera, model };
    }

    it('开启门控：纹理 loading 期间对象不在渲染列表，就绪后自动出现', () =>
    {
        const { scene, camera, model } = buildScene(true);
        const cache = new ScenePickCache(scene, camera);

        // 声明式纹理未加载（node 无 Image）→ isLoaded=false → 门控排除
        expect(cache.activeModels).toEqual([]);

        // 纹理就绪 → 门控 computed 失效 → 对象出现
        setTextureForTest('gate-test.png', { descriptor: { size: [1, 1] } } as never);
        expect(cache.activeModels).toEqual([model]);
    });

    it('默认关闭：loading 期间照常进入渲染列表（占位符渐进换装）', () =>
    {
        const { scene, camera, model } = buildScene(false);
        const cache = new ScenePickCache(scene, camera);

        expect(cache.activeModels).toEqual([model]);
    });
});
