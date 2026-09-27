import { describe, expect, it } from 'vitest';

import '../test/webgpu-stub';

import { logic, reactive } from '@feng3d/reactivity';
import type { PerspectiveCamera } from '../cameras/PerspectiveCamera';
import '../cameras/PerspectiveCamera';
import type { MeshRenderer } from '../core/MeshRenderer';
import '../core/MeshRenderer';
import type { Object3D } from '../core/Object3D';
import '../core/Object3D';
import type { DirectionalLight } from '../light/DirectionalLight';
import '../light/DirectionalLight';
import { LightType } from '../light/LightType';
import type { PointLight } from '../light/PointLight';
import '../light/PointLight';
import type { SpotLight } from '../light/SpotLight';
import '../light/SpotLight';
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
    function buildScene(options: {
        behindCameraObject?: boolean,
        light?: Partial<DirectionalLight>,
        withShadowCaster?: boolean,
        withNonCaster?: boolean,
        pointLight?: boolean,
        spotLight?: boolean,
    } = {})
    {
        const mkCube = (name: string, z: number, castShadows?: boolean): Object3D => ({
            __type__: 'Object3D',
            name,
            position: { x: 0, y: 0, z },
            components: [{
                __type__: 'MeshRenderer',
                geometry: { __type__: 'CubeGeometry' },
                material: { __type__: 'ColorMaterial' },
                ...(castShadows === undefined ? {} : { castShadows }),
            } as unknown as MeshRenderer],
        });

        /** 光源都放在 (0, 10, 0)：物体在 (0, 0, -5)，正好在正下方 */
        const mkLightObject = (name: string, component: unknown, rotation?: { x: number, y: number, z: number }): Object3D => ({
            __type__: 'Object3D',
            name,
            position: { x: 0, y: 10, z: 0 },
            ...(rotation ? { rotation } : {}),
            components: [component as never],
        });

        const scene: Scene = { __type__: 'Scene' } as Scene;
        const visible = mkCube('visible', -5);
        const children: Object3D[] = [visible];

        // 相机在原点朝 -Z：z = +100 的物体在**相机背后**，必然落在视锥外
        if (options.behindCameraObject) children.push(mkCube('behind', 100));

        // 阴影投射的两个对照对象：一个缺省（按 true）、一个显式 false
        if (options.withShadowCaster) children.push(mkCube('caster', -6));
        if (options.withNonCaster) children.push(mkCube('nonCaster', -7, false));

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

        // 点光源 / 聚光灯的阴影走 `getCastShadowsModelsByFrustum` 分支（透视 VP），
        // 与方向光的正交 VP 路径并列；这两条路径的 VP 组合顺序曾写反（issue #232）
        if (options.pointLight)
        {
            children.push(mkLightObject('point', {
                __type__: 'PointLight',
                lightType: LightType.Point,
                shadowType: ShadowType.Hard_Shadows,
                range: 50,
            } as unknown as PointLight));
        }
        if (options.spotLight)
        {
            // rotation.x = -90° → 本地 -Z（聚光灯朝向）指向 -Y，光源朝下
            children.push(mkLightObject('spot', {
                __type__: 'SpotLight',
                lightType: LightType.Spot,
                shadowType: ShadowType.Hard_Shadows,
                range: 50,
                angle: 60,
                penumbra: 0,
            } as unknown as SpotLight, { x: -Math.PI / 2, y: 0, z: 0 }));
        }

        const root: Object3D = { __type__: 'Object3D', name: 'root', components: [scene], children: [...children, lightObject] };

        logic(root);

        const camera = { __type__: 'PerspectiveCamera', fov: 60, aspect: 1, near: 0.1, far: 1000 } as unknown as PerspectiveCamera;

        logic({ __type__: 'Object3D', name: 'cam', position: { x: 0, y: 0, z: 0 }, components: [camera] } as Object3D);

        return { scene, camera, visible, sun: lightObject };
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
        const namesOf = () => logic(scene).getPickCache(camera).activeModels.map((m) => logic(m).entity!.name);

        // 先读一次，让 activeModels 的 computed 带着"culling 开启"的结果进缓存
        expect(namesOf()).toContain('visible');
        expect(namesOf()).not.toContain('behind');

        // 数据字段是 readonly，写入走响应式代理 → 已算出的 activeModels 必须失效重算
        reactive(camera as { frustumCulling?: boolean }).frustumCulling = false;

        expect(namesOf()).toContain('behind');
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

    it('castShadows: false 的对象不进阴影 Pass，缺省按 true', () =>
    {
        const { scene, camera } = buildScene({
            light: { shadowType: ShadowType.Hard_Shadows },
            withShadowCaster: true,
            withNonCaster: true,
        });
        const passes = new ShadowRenderer().draw(scene, camera).value;

        expect(passes).toHaveLength(1);

        // 三个可渲染对象：visible（缺省 → 投射）、caster（缺省 → 投射）、nonCaster（false → 不投射）
        expect(passes[0].renderPassObjects).toHaveLength(2);
    });

    it('把可见对象的 castShadows 关掉后，阴影 Pass 立刻不再包含它', () =>
    {
        const { scene, camera, visible } = buildScene({ light: { shadowType: ShadowType.Hard_Shadows } });
        const renderer = new ShadowRenderer();

        expect(renderer.draw(scene, camera).value[0].renderPassObjects).toHaveLength(1);

        // castShadows 声明在 MeshRenderer（Renderable）上，**不在** Object3D 上；
        // 数据字段是 readonly，写入必须经响应式代理，否则 computed 不失效（读到的还是旧值）
        reactive(visible.components[0] as { castShadows?: boolean }).castShadows = false;

        expect(renderer.draw(scene, camera).value[0].renderPassObjects).toHaveLength(0);
    });

    it('点光源：光照范围内的缺省对象进入对应 cubemap 面的阴影 Pass', () =>
    {
        const { scene, camera } = buildScene({ pointLight: true });
        const passes = new ShadowRenderer().draw(scene, camera).value;

        // 点光源产出 6 个 per-face depth-only Pass（cubemap）
        expect(passes).toHaveLength(6);

        // 光源在 (0, 10, 0)，物体在 (0, 0, -5) → 只有 -Y 面（方向表第 6 项）看得见它。
        // VP 顺序写反时（V × P）这里恒为 0——实测 6 面 intersectsBox 全 false。
        expect(passes[5].renderPassObjects).toHaveLength(1);
    });

    it('点光源：显式 castShadows: false 的对象不进阴影 Pass（与方向光同一语义）', () =>
    {
        const { scene, camera } = buildScene({ pointLight: true, withNonCaster: true });
        const passes = new ShadowRenderer().draw(scene, camera).value;

        // visible（缺省 → 投射）进；nonCaster（显式 false）不进
        expect(passes[5].renderPassObjects).toHaveLength(1);
    });

    it('点光源：关掉 castShadows 后阴影 Pass 立刻不再包含它', () =>
    {
        const { scene, camera, visible } = buildScene({ pointLight: true });
        const renderer = new ShadowRenderer();

        expect(renderer.draw(scene, camera).value[5].renderPassObjects).toHaveLength(1);

        reactive(visible.components[0] as { castShadows?: boolean }).castShadows = false;

        expect(renderer.draw(scene, camera).value[5].renderPassObjects).toHaveLength(0);
    });

    it('聚光灯：光照视锥内的缺省对象进入阴影 Pass', () =>
    {
        const { scene, camera } = buildScene({ spotLight: true });
        const passes = new ShadowRenderer().draw(scene, camera).value;

        // 单个 spot 光源 → 1 个 depth-only Pass
        expect(passes).toHaveLength(1);
        expect(passes[0].renderPassObjects).toHaveLength(1);
    });
});
