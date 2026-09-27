import { describe, expect, it } from 'vitest';

import '../../test/webgpu-stub';

import { computed, logic, reactive } from '@feng3d/reactivity';
import type { PerspectiveCamera } from '../../cameras/PerspectiveCamera';
import '../../cameras/PerspectiveCamera';
import type { MeshRenderer } from '../../core/MeshRenderer';
import '../../core/MeshRenderer';
import type { Object3D } from '../../core/Object3D';
import '../../core/Object3D';
import type { Scene } from '../../scene/Scene';
import '../../scene/Scene';
import '../../materials/ColorMaterial';
import '../../materials/SegmentMaterial';
import '../../primitives/CubeGeometry';
import '../../geometry/SegmentGeometry';
import { ForwardRenderer } from './ForwardRenderer';

/**
 * `ForwardRenderer.draw` 的 renderObject 组装（issue #100 的守卫）。
 *
 * `draw(scene, camera, viewport)` 返回按 (scene, camera) 缓存的 computed：
 * - 不透明对象先画、半透明后画（半透明已在 ScenePickCache 里按深度排序）；
 * - **稳态零分配**：computed 未失效时不重算，重复取 `.value` 拿到同一数组；
 * - 重算时不再用 `unblenditems.concat(blenditems)` 拼临时数组（issue #100 消除的分配点）。
 */
describe('ForwardRenderer.renderObjects 组装', () =>
{
    /** 造一棵「Scene 组件在根上 + 2 个不透明 + 1 个半透明（线段）」的树与一台相机 */
    function buildScene()
    {
        const opaqueA: Object3D = {
            __type__: 'Object3D',
            name: 'opaqueA',
            components: [{
                __type__: 'MeshRenderer',
                geometry: { __type__: 'CubeGeometry' },
                material: { __type__: 'ColorMaterial' },
            } as unknown as MeshRenderer],
        };
        const opaqueB: Object3D = {
            __type__: 'Object3D',
            name: 'opaqueB',
            components: [{
                __type__: 'MeshRenderer',
                geometry: { __type__: 'CubeGeometry' },
                material: { __type__: 'ColorMaterial' },
            } as unknown as MeshRenderer],
        };
        const transparent: Object3D = {
            __type__: 'Object3D',
            name: 'transparentLine',
            components: [{
                __type__: 'MeshRenderer',
                geometry: { __type__: 'SegmentGeometry' },
                material: { __type__: 'SegmentMaterial' },
            } as unknown as MeshRenderer],
        };
        const scene: Scene = { __type__: 'Scene' } as Scene;
        const root: Object3D = {
            __type__: 'Object3D',
            name: 'root',
            components: [scene],
            children: [opaqueA, opaqueB, transparent],
        };

        logic(root);

        const camera = { __type__: 'PerspectiveCamera', aspect: 1 } as unknown as PerspectiveCamera;

        logic({ __type__: 'Object3D', name: 'cam', position: { x: 0, y: 0, z: 10 }, components: [camera] } as Object3D);

        return { scene, camera, opaqueA, opaqueB, transparent, root };
    }

    /** 取某个可渲染对象的 renderObject 引用（用于判断顺序） */
    function renderObjectOf(object: Object3D)
    {
        return logic(object.components![0] as MeshRenderer).renderObject.value;
    }

    it('不透明对象在前、半透明对象在后（顺序即绘制顺序）', () =>
    {
        const { scene, camera, opaqueA, opaqueB, transparent } = buildScene();
        const renderObjects = new ForwardRenderer().draw(scene, camera, computed(() => [800, 600] as const));
        const list = renderObjects.value;

        expect(list).toHaveLength(3);

        const opaqueSet = new Set([renderObjectOf(opaqueA), renderObjectOf(opaqueB)]);

        // 前两个必须是两个不透明对象，最后一个必须是半透明对象
        expect(opaqueSet.has(list[0])).toBe(true);
        expect(opaqueSet.has(list[1])).toBe(true);
        expect(list[2]).toBe(renderObjectOf(transparent));
    });

    it('稳态下重复取值返回同一个数组（computed 缓存，不重算）', () =>
    {
        const { scene, camera } = buildScene();
        const renderObjects = new ForwardRenderer().draw(scene, camera, computed(() => [800, 600] as const));

        const first = renderObjects.value;
        const second = renderObjects.value;

        expect(second).toBe(first);
    });

    it('同一 (scene, camera) 重复 draw 返回同一个 computed（下游依赖稳定）', () =>
    {
        const { scene, camera } = buildScene();
        const renderer = new ForwardRenderer();
        const viewport = computed(() => [800, 600] as const);

        expect(renderer.draw(scene, camera, viewport)).toBe(renderer.draw(scene, camera, viewport));
    });

    it('对象隐藏后重算，隐藏对象不再参与组装', () =>
    {
        const { scene, camera, opaqueA } = buildScene();
        const renderObjects = new ForwardRenderer().draw(scene, camera, computed(() => [800, 600] as const));

        expect(renderObjects.value).toHaveLength(3);

        reactive(opaqueA as { activeSelf: boolean }).activeSelf = false;

        expect(renderObjects.value).toHaveLength(2);
    });
});
