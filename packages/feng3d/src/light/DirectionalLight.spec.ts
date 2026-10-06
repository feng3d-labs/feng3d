import { describe, expect, it } from 'vitest';

import '../test/webgpu-stub';

import { logic } from '@feng3d/reactivity';
import type { PerspectiveCamera } from '../cameras/PerspectiveCamera';
import '../cameras/PerspectiveCamera';
import type { MeshRenderer } from '../core/MeshRenderer';
import '../core/MeshRenderer';
import type { Object3D } from '../core/Object3D';
import '../core/Object3D';
import '../materials/ColorMaterial';
import '../primitives/CubeGeometry';
import type { Scene } from '../scene/Scene';
import '../scene/Scene';
import type { DirectionalLight } from './DirectionalLight';
import './DirectionalLight';
import { LightType } from './LightType';
import { ShadowType } from './shadow/ShadowType';

/** 立方体半边长（世界包围盒 ±CUBE_HALF） */
const CUBE_HALF = 50;

/**
 * DirectionalLight 的阴影配置（对齐 three.js 的 `light.shadow.camera.*` 与 `shadow.mapSize`）。
 *
 * 覆盖三件事：
 * 1. `shadowMapSize` 可配（阴影深度纹理尺寸随之重建），缺省仍是 1024×1024；
 * 2. 显式 `shadowCamera*` 进入「视点取光源世界坐标 + 视锥按显式值」模式，
 *    与 three 的 `shadow.camera.position.copy(light.position)` 一致；
 * 3. 全部缺省时保持原有「按场景包围盒自动算」的行为（视点与光源位置无关）。
 */
describe('DirectionalLight 的阴影配置', () =>
{
    /** 造场景：Scene + 原点附近一个立方体 + 一盏方向光（朝下），返回阴影收集所需的 models */
    function build(light: DirectionalLight, lightPosition = { x: 0, y: 1500, z: 1000 })
    {
        const cube: Object3D = {
            __type__: 'Object3D',
            name: 'cube',
            components: [{
                __type__: 'MeshRenderer',
                geometry: { __type__: 'CubeGeometry', width: CUBE_HALF * 2, height: CUBE_HALF * 2, depth: CUBE_HALF * 2 },
                material: { __type__: 'ColorMaterial' },
            } as unknown as MeshRenderer],
        };
        const lightObject: Object3D = {
            __type__: 'Object3D',
            name: 'light',
            position: lightPosition,
            // 光源方向 = 物体本地 -Z 的世界方向：绕 X 轴 -90° 让本地 +Z 指向世界 +Y，光朝下
            rotation: { x: -Math.PI / 2, y: 0, z: 0 },
            components: [light],
        };
        const scene: Scene = { __type__: 'Scene' } as Scene;
        const root: Object3D = {
            __type__: 'Object3D',
            name: 'root',
            components: [scene],
            children: [cube, lightObject],
        };
        logic(root);

        const camera = { __type__: 'PerspectiveCamera', aspect: 1 } as PerspectiveCamera;
        logic({ __type__: 'Object3D', name: 'cam', position: { x: 0, y: 0, z: 10 }, components: [camera] } as Object3D);

        const models = logic(scene).getPickByDirectionalLight(light);
        expect(models.length).toBeGreaterThan(0);

        return { scene, camera, models };
    }

    /** 调用一次 updateShadowByCamera 并取回阴影参数 */
    function updateShadow(light: DirectionalLight, ctx: ReturnType<typeof build>)
    {
        const lightLogic = logic(light);
        lightLogic.updateShadowByCamera(ctx.scene, ctx.camera, ctx.models);

        return {
            elements: Array.from(lightLogic.shadowViewProjection.elements),
            near: lightLogic.shadowNear,
            far: lightLogic.shadowFar,
        };
    }

    /** 正交 VP 变换（列主序，w=1） */
    function project(elements: number[], x: number, y: number, z: number)
    {
        const px = elements[0] * x + elements[4] * y + elements[8] * z + elements[12];
        const py = elements[1] * x + elements[5] * y + elements[9] * z + elements[13];
        const pw = elements[3] * x + elements[7] * y + elements[11] * z + elements[15];

        return { x: px / pw, y: py / pw };
    }

    /** 立方体 8 角点投影后的 NDC 最大绝对范围 */
    function ndcExtent(elements: number[])
    {
        let maxX = 0;
        let maxY = 0;
        for (let i = 0; i < 8; i++)
        {
            const x = (i & 1) ? CUBE_HALF : -CUBE_HALF;
            const y = (i & 2) ? CUBE_HALF : -CUBE_HALF;
            const z = (i & 4) ? CUBE_HALF : -CUBE_HALF;
            const p = project(elements, x, y, z);
            maxX = Math.max(maxX, Math.abs(p.x));
            maxY = Math.max(maxY, Math.abs(p.y));
        }

        return { maxX, maxY };
    }

    /** 一个最小可用的方向光数据 */
    function makeLight(extra: Partial<DirectionalLight> = {}): DirectionalLight
    {
        return {
            __type__: 'DirectionalLight',
            lightType: LightType.Directional,
            shadowType: ShadowType.PCF_Shadows,
            shadowRadius: 1,
            debugShadowMap: false,
            ...extra,
        } as DirectionalLight;
    }

    it('shadowMapSize 缺省为 1024×1024，深度纹理尺寸一致', () =>
    {
        const light = makeLight();
        build(light);
        const lightLogic = logic(light);

        expect(lightLogic.shadowMapSize).toMatchObject({ x: 1024, y: 1024 });
        expect((lightLogic.shadowDepthTexture as unknown as { descriptor: { size: number[] } }).descriptor.size)
            .toEqual([1024, 1024, 1]);
    });

    it('shadowMapSize 可配 2048×1024（对齐 three 的 shadow.mapSize），深度纹理随之重建', () =>
    {
        const light = makeLight({ shadowMapSize: { x: 2048, y: 1024 } });
        build(light);
        const lightLogic = logic(light);

        expect(lightLogic.shadowMapSize).toMatchObject({ x: 2048, y: 1024 });
        expect((lightLogic.shadowDepthTexture as unknown as { descriptor: { size: number[] } }).descriptor.size)
            .toEqual([2048, 1024, 1]);
    });

    it('显式 shadowCameraNear / Far 透传到 shadowNear / shadowFar', () =>
    {
        const light = makeLight({ shadowCameraNear: 1200, shadowCameraFar: 2500 });
        const result = updateShadow(light, build(light));

        expect(result.near).toBe(1200);
        expect(result.far).toBe(2500);
    });

    it('显式 ±2000 视锥覆盖立方体，±1 视锥覆盖不住（left/right/top/bottom 生效）', () =>
    {
        const wide = makeLight({
            shadowCameraLeft: -2000, shadowCameraRight: 2000,
            shadowCameraTop: 2000, shadowCameraBottom: -2000,
            shadowCameraNear: 1200, shadowCameraFar: 2500,
        });
        const wideExtent = ndcExtent(updateShadow(wide, build(wide)).elements);
        expect(wideExtent.maxX).toBeLessThanOrEqual(1);
        expect(wideExtent.maxY).toBeLessThanOrEqual(1);

        const tight = makeLight({
            shadowCameraLeft: -1, shadowCameraRight: 1,
            shadowCameraTop: 1, shadowCameraBottom: -1,
            shadowCameraNear: 1200, shadowCameraFar: 2500,
        });
        const tightExtent = ndcExtent(updateShadow(tight, build(tight)).elements);
        expect(Math.max(tightExtent.maxX, tightExtent.maxY)).toBeGreaterThan(1);
    });

    it('显式视锥下视点取光源世界坐标；缺省模式仍按包围盒自动算（与光源位置无关）', () =>
    {
        const explicit = { shadowCameraLeft: -2000, shadowCameraRight: 2000, shadowCameraTop: 2000, shadowCameraBottom: -2000, shadowCameraNear: 1200, shadowCameraFar: 2500 };
        const explicitA = makeLight(explicit);
        const explicitB = makeLight(explicit);
        const a = updateShadow(explicitA, build(explicitA, { x: 0, y: 1500, z: 1000 }));
        const b = updateShadow(explicitB, build(explicitB, { x: 0, y: 3000, z: 2000 }));
        expect(a.elements).not.toEqual(b.elements);

        const autoA = makeLight();
        const autoB = makeLight();
        const c = updateShadow(autoA, build(autoA, { x: 0, y: 1500, z: 1000 }));
        const d = updateShadow(autoB, build(autoB, { x: 0, y: 3000, z: 2000 }));
        expect(c.elements).toEqual(d.elements);
    });
});
