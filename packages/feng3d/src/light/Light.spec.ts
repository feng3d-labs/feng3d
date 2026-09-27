import { describe, expect, it } from 'vitest';

import '../test/webgpu-stub';

import { computed, logic } from '@feng3d/reactivity';
import type { PerspectiveCamera } from '../cameras/PerspectiveCamera';
import '../cameras/PerspectiveCamera';
import type { MeshRenderer } from '../core/MeshRenderer';
import '../core/MeshRenderer';
import type { Object3D } from '../core/Object3D';
import '../core/Object3D';
import '../materials/ColorMaterial';
import '../primitives/CubeGeometry';
import { ForwardRenderer } from '../render/renderer/ForwardRenderer';
import type { Scene } from '../scene/Scene';
import '../scene/Scene';
import { LightType } from './LightType';
import { ShadowType } from './shadow/ShadowType';
import type { DirectionalLight } from './DirectionalLight';
import './DirectionalLight';
import type { PointLight } from './PointLight';
import './PointLight';

/**
 * Light 的可选字段与渲染侧默认值（issue #135 第 3 项：类型声明与实现不一致）。
 *
 * `intensity` / `color` / `shadowType` / `shadowBias` 在 `ForwardRenderer.buildLightsUniform`
 * 里一律 `?? 默认值`，但接口上原先声明为**必填**——声明与实现相互矛盾。
 * 这里同时钉住两侧：
 * 1. 类型：省略这四个字段的字面量必须能通过 `tsc`（下面几处 `const x: XxxLight = {…}` 不用 `as`）；
 * 2. 行为：省略后 uniform 里拿到实现侧声明的默认值。
 */
describe('Light 可选字段与默认值', () =>
{
    /** 造一个「根上挂 Scene + 一个可渲染立方体 + 给定光源」的场景与一台相机 */
    function buildSceneWithLight(light: DirectionalLight | PointLight)
    {
        const scene: Scene = { __type__: 'Scene' } as Scene;
        const cube: Object3D = {
            __type__: 'Object3D',
            name: 'cube',
            components: [{
                __type__: 'MeshRenderer',
                geometry: { __type__: 'CubeGeometry' },
                material: { __type__: 'ColorMaterial' },
            } as unknown as MeshRenderer],
        };
        const lightObject: Object3D = {
            __type__: 'Object3D',
            name: 'light',
            position: { x: 0, y: 5, z: 0 },
            components: [light],
        };
        const root: Object3D = {
            __type__: 'Object3D',
            name: 'root',
            components: [scene],
            children: [cube, lightObject],
        };

        logic(root);

        const camera = { __type__: 'PerspectiveCamera', aspect: 1 } as PerspectiveCamera;

        logic({ __type__: 'Object3D', name: 'cam', position: { x: 0, y: 0, z: 10 }, components: [camera] } as Object3D);

        return { scene, camera };
    }

    /** 取渲染组装后写入的 lights uniform */
    function lightsUniformOf(scene: Scene, camera: PerspectiveCamera)
    {
        const objects = new ForwardRenderer().draw(scene, camera, computed(() => [800, 600] as const)).value;
        const binding = (objects[0].bindingResources as unknown as { lights: { value: { value: unknown } } }).lights;

        // bindingResources.lights.value 里存的是「光源 uniform 的 computed」
        // （ForwardRenderer 的 _lightsUniformCache 缓存 Computed 实例），所以再取一层 .value
        return binding.value.value as {
            u_directionalLight: { intensity: number, color: number[] },
            u_spotLight: { intensity: number, color: number[] },
            u_pointLights: { intensity: number, color: number[] }[],
            u_pointLightCount: number,
        };
    }

    it('方向光：省略 intensity / color 后按实现侧默认值组装', () =>
    {
        // 这几处字面量**不使用 `as`**：把可选字段改回必填，`tsc` 会直接在这里报错
        const light: DirectionalLight = {
            __type__: 'DirectionalLight',
            lightType: LightType.Directional,
            shadowRadius: 0,
            debugShadowMap: false,
        };

        const { scene, camera } = buildSceneWithLight(light);
        const uniforms = lightsUniformOf(scene, camera);

        expect(uniforms.u_directionalLight.intensity).toBe(1);          // intensity ?? 1
        expect(uniforms.u_directionalLight.color).toEqual([0, 0, 0]);   // 方向光 color 缺省 → 0（不照亮）
    });

    it('点光源：省略 color / intensity 后兜底为白色与 1', () =>
    {
        const light: PointLight = {
            __type__: 'PointLight',
            lightType: LightType.Point,
            range: 10,
            shadowRadius: 0,
            debugShadowMap: false,
        };

        const { scene, camera } = buildSceneWithLight(light);
        const uniforms = lightsUniformOf(scene, camera);

        expect(uniforms.u_pointLightCount).toBe(1);
        expect(uniforms.u_pointLights[0].intensity).toBe(1);            // intensity ?? 1
        expect(uniforms.u_pointLights[0].color).toEqual([1, 1, 1]);     // color 缺省 → 白
    });

    it('显式值优先于默认值', () =>
    {
        const light: DirectionalLight = {
            __type__: 'DirectionalLight',
            lightType: LightType.Directional,
            shadowRadius: 0,
            debugShadowMap: false,
            intensity: 0.25,
            color: { __type__: 'Color3', r: 0.1, g: 0.2, b: 0.3 },
            shadowType: ShadowType.Hard_Shadows,
            shadowBias: 0.01,
        };

        const { scene, camera } = buildSceneWithLight(light);
        const uniforms = lightsUniformOf(scene, camera);

        expect(uniforms.u_directionalLight.intensity).toBeCloseTo(0.25, 6);
        expect(uniforms.u_directionalLight.color[0]).toBeCloseTo(0.1, 6);
        expect(uniforms.u_directionalLight.color[1]).toBeCloseTo(0.2, 6);
        expect(uniforms.u_directionalLight.color[2]).toBeCloseTo(0.3, 6);
    });
});
