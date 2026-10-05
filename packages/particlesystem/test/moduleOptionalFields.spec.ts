import { describe, expect, it } from 'vitest';
import { minMaxCurveDefault } from '@feng3d/math';
import { logic } from 'feng3d';
import type { Object3D } from 'feng3d';
import { particleSystemLogic, type ParticleSystem } from '../src/ParticleSystem';

/**
 * 模块字段可选化（规范 §11.5）的行为保证。
 *
 * 读侧 `ParticleXxxModuleLike` 的字段全部可选、`ParticleXxxModule` 是 `Required<...>`，
 * 于是场景数据可以只写关心的字段；缺失部分由 `particleSystemLogic` 里的 `withDefaults`
 * （`serialization.setValue(默认, 用户数据)` 的**递归**补默认）补全。
 *
 * 两条路径都钉住：
 * 1. 直接调工厂（`particleSystemLogic`）——单元层；
 * 2. 真实组件挂载（字面量挂到 Object3D 的 components，由 `logic(object3D)` 分发）——生产路径。
 */
describe('模块字段可选化 + logic 补默认', () =>
{
    /** 只写 main.startSpeed 的最小粒子系统数据 */
    function minimalSystem(): ParticleSystem
    {
        return {
            __type__: 'ParticleSystem',
            main: { startSpeed: { __type__: 'MinMaxCurve', ...minMaxCurveDefault(), constant: 2, constantMin: 2, constantMax: 2 } },
        } as unknown as ParticleSystem;
    }

    it('直接调工厂：同模块其余字段与其它模块都被补默认', () =>
    {
        const system = minimalSystem();

        particleSystemLogic(system);

        expect(system.main!.startSpeed!.constant).toBe(2);
        expect(system.main!.startLifetime!.constant).toBe(5);
        expect(system.main!.maxParticles).toBe(1000);
        expect(system.emission!.rateOverTime!.constant).toBe(10);
        expect(system.noise!.frequency).toBe(0.5);
    });

    it('组件挂载路径：分发后宿主 components 里的同一对象也被补默认', () =>
    {
        const system = minimalSystem();
        const object3D: Object3D = {
            __type__: 'Object3D',
            name: 'particles',
            components: [system as never],
        };

        logic(object3D);

        // 组件分发不复制数据：宿主里的就是同一个对象
        const mounted = object3D.components![0] as unknown as ParticleSystem;

        expect(mounted).toBe(system);
        expect(mounted.main!.startLifetime!.constant).toBe(5);
        expect(mounted.shape!.shapeType).toBeDefined();
    });

    it('嵌套对象（曲线）按字段递归补默认，不是整体替换', () =>
    {
        const system = {
            __type__: 'ParticleSystem',
            main: { startSize3D: { __type__: 'MinMaxCurveVector3', xCurve: { __type__: 'MinMaxCurve', ...minMaxCurveDefault(), constant: 3, constantMin: 3, constantMax: 3 } } },
        } as unknown as ParticleSystem;

        particleSystemLogic(system);

        expect(system.main!.startSize3D!.xCurve!.constant).toBe(3);
        expect(system.main!.startSize3D!.yCurve).toBeDefined();
        // startSize3D 的默认形态是「三条轴 constant 1 + between0And1」
        expect(system.main!.startSize3D!.yCurve!.constant).toBe(1);
        expect(system.main!.startSize3D!.yCurve!.between0And1).toBe(true);
        expect(system.main!.startSize3D!.zCurve).toBeDefined();
    });
});
