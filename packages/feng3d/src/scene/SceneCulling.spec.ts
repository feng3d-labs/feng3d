import { describe, expect, it } from 'vitest';

import '../test/webgpu-stub';

import { logic } from '@feng3d/reactivity';
import type { PerspectiveCamera } from '../cameras/PerspectiveCamera';
import '../cameras/PerspectiveCamera';
import type { MeshRenderer } from '../core/MeshRenderer';
import '../core/MeshRenderer';
import type { Object3D } from '../core/Object3D';
import '../core/Object3D';
import type { DirectionalLight } from '../light/DirectionalLight';
import '../light/DirectionalLight';
import { LightType } from '../light/LightType';
import { ShadowType } from '../light/shadow/ShadowType';
import '../materials/ColorMaterial';
import '../primitives/CubeGeometry';
import { ShadowRenderer } from '../render/renderer/ShadowRenderer';
import type { Scene } from './Scene';
import './Scene';

/**
 * 剔除 / 筛选的**开关是否真的生效**（issue #229，接 #105 的遗留项）。
 *
 * 这两条路径原先没有单测，而它们的失效是**静默**的：
 * 关掉视锥剔除（`frustumCulling: false`）本来是为了"调试 / UI 相机 / 特殊后处理"，若开关不生效，
 * 视野外的东西照旧被剔除，表现为"明明设了 false 还是看不见"；光源的 `shadowType` 同理——
 * 设成 `No_Shadows` 却仍产出阴影 Pass，只会在真机上表现为性能下降或画面异常。
 *
 * 断言全部落在纯数据结构上（`activeModels` / `renderPasses` 数组），不需要 GPU。
 */
describe('剔除与筛选开关（issue #229）', () =>
{
    /** 造「Scene 组件挂在根上 + 一个立方体 + 可选光源」的场景 */
    function buildScene(options: { behindCameraObject?: boolean, light?: Partial<DirectionalLight> } = {})
    {
        const mkCube = (name: string, z: number): Object3D => ({
            __type__: 'Object3D',
            name,
            position: { x: 0, y: 0, z },
            components: [{
                __type__: 'MeshRenderer',
                geometry: { __type__: 'CubeGeometry' },
                material: { __type__: 'ColorMaterial' },
            } as unknown as MeshRenderer],
        });

        const scene: Scene = { __type__: 'Scene' } as Scene;
        const children: Object3D[] = [mkCube('visible', -5)];

        // 相机在原点朝 -Z：z = +100 的物体在**相机背后**，必然落在视锥外
        if (options.behindCameraObject) children.push(mkCube('behind', 100));

        const lightObject: Object3D = {
            __type__: 'Object3D',
            name: 'sun',
            position: { x: 0, y: 10, z: 0 },
            components: [{
                __type__: 'DirectionalLight',
                lightType: LightType.Directional,
                shadowRadius: 0,
                debugShadowMap: false,
                ...options.light,
            } as unknown as DirectionalLight],
        };

        const root: Object3D = { __type__: 'Object3D', name: 'root', components: [scene], children: [...children, lightObject] };

        logic(root);

        const camera = { __type__: 'PerspectiveCamera', fov: 60, aspect: 1, near: 0.1, far: 1000 } as unknown as PerspectiveCamera;

        logic({ __type__: 'Object3D', name: 'cam', position: { x: 0, y: 0, z: 0 }, components: [camera] } as Object3D);

        return { scene, camera };
    }

    it('默认开启视锥剔除：相机背后的对象不进 activeModels', () =>
    {
        const { scene, camera } = buildScene({ behindCameraObject: true });
        const names = logic(scene).getPickCache(camera).activeModels.map((m) => logic(m).entity!.name);

        expect(names).toContain('visible');
        expect(names).not.toContain('behind');
    });

    it('frustumCulling: false 时相机背后的对象**仍**参与（开关真的生效）', () =>
    {
        const { scene, camera } = buildScene({ behindCameraObject: true });

        // 通过响应式写入关掉剔除（数据字段是 readonly，走代理）
        (camera as { frustumCulling?: boolean }).frustumCulling = false;

        const names = logic(scene).getPickCache(camera).activeModels.map((m) => logic(m).entity!.name);

        expect(names).toContain('visible');
        expect(names).toContain('behind');
    });

    it('光源 shadowType 缺省（No_Shadows）时不产出阴影 Pass', () =>
    {
        const { scene, camera } = buildScene();
        const passes = new ShadowRenderer().draw(scene, camera).value;

        expect(passes).toHaveLength(0);
    });

    it('光源开启阴影后产出阴影 Pass（同一个场景只改 shadowType）', () =>
    {
        const { scene, camera } = buildScene({ light: { shadowType: ShadowType.Hard_Shadows } });
        const passes = new ShadowRenderer().draw(scene, camera).value;

        expect(passes.length).toBeGreaterThan(0);
    });

    it('同一 (scene, camera) 重复 draw 返回同一 computed（下游依赖稳定）', () =>
    {
        const { scene, camera } = buildScene({ light: { shadowType: ShadowType.Hard_Shadows } });
        const renderer = new ShadowRenderer();

        expect(renderer.draw(scene, camera)).toBe(renderer.draw(scene, camera));
    });
});
