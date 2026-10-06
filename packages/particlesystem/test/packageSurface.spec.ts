import { describe, expect, it } from 'vitest';
import * as particlesystem from '../src/index';
import { Particle } from '../src/Particle';
import { particleEmissionBurstDefault } from '../src/others/ParticleEmissionBurst';

/**
 * 粒子包的**入口与常量面**。
 *
 * 这一包里有相当一部分代码是「声明即全部」的：枚举（编译成 IIFE 赋值）、`Particle` 的字段常量、
 * `ParticleEmissionBurst` 这类小的纯数据助手，以及 `src/index.ts` 的 40 多条 re-export。
 * 它们只有在模块被真正求值时才会被算作已覆盖，所以这里用一个导入型用例把它们拉进来，
 * 顺带把「导出面」钉住（漏删导出、改名都会在这里红）。
 */
describe('粒子包入口与常量面', () =>
{
    it('index 把枚举、模块、纯数据助手都导出出来', () =>
    {
        // 枚举（每个枚举模块在求值时执行 IIFE 赋值）
        expect(particlesystem.ParticleSystemShapeType.SphereShell).toBe(1);
        expect(particlesystem.ParticleSystemSimulationSpace.World).toBeDefined();
        expect(particlesystem.ParticleSystemRenderMode.Billboard).toBeDefined();
        expect(particlesystem.ParticleSystemRenderSpace.Local).toBeDefined();
        expect(particlesystem.ParticleSystemSortMode.None).toBeDefined();
        expect(particlesystem.ParticleSystemSubEmitterType.Birth).toBeDefined();
        expect(particlesystem.ParticleSystemSubEmitterProperties.InheritNothing).toBeDefined();
        expect(particlesystem.ParticleSystemAnimationType.WholeSheet).toBeDefined();
        expect(particlesystem.ParticleSystemInheritVelocityMode.Initial).toBeDefined();
        expect(particlesystem.ParticleSystemMeshShapeType.Vertex).toBeDefined();
        expect(particlesystem.ParticleSystemNoiseQuality.High).toBeDefined();
        expect(particlesystem.ParticleSystemScalingMode.Local).toBeDefined();
        expect(particlesystem.ParticleSystemShapeConeEmitFrom.Base).toBeDefined();
        expect(particlesystem.ParticleSystemShapeMultiModeValue.Random).toBeDefined();
        expect(particlesystem.SpriteMaskInteraction.None).toBeDefined();
        expect(particlesystem.UVChannelFlags.UV0).toBeDefined();

        // 模块的默认工厂与行为函数
        expect(typeof particlesystem.particleMainModuleDefault).toBe('function');
        expect(typeof particlesystem.particleNoiseModuleDefault).toBe('function');
        expect(typeof particlesystem.particleShapeModuleDefault).toBe('function');
        expect(typeof particlesystem.particleSubEmittersModuleDefault).toBe('function');
        expect(typeof particlesystem.particleTextureSheetAnimationModuleDefault).toBe('function');
        expect(typeof particlesystem.particleSystemDefault).toBe('function');

        // 形状策略纯函数（六个形状）
        expect(typeof particlesystem.particleSystemShapeSphereCalcParticlePosDir).toBe('function');
        expect(typeof particlesystem.particleSystemShapeHemisphereCalcParticlePosDir).toBe('function');
        expect(typeof particlesystem.particleSystemShapeConeCalcParticlePosDir).toBe('function');
        expect(typeof particlesystem.particleSystemShapeBoxCalcParticlePosDir).toBe('function');
        expect(typeof particlesystem.particleSystemShapeCircleCalcParticlePosDir).toBe('function');
        expect(typeof particlesystem.particleSystemShapeEdgeCalcParticlePosDir).toBe('function');

        // 组件与辅助
        expect(typeof particlesystem.particleSystemLogic).toBe('function');
        expect(typeof particlesystem.Particle).toBe('function');
    });

    it('Particle 的字段常量与粒子实例可用', () =>
    {
        const particle = new Particle();

        // 实例字段的默认值（与原 class 逐字一致）
        expect(particle.birthTime).toBe(0);
        expect(particle.lifetime).toBe(5);
        expect(particle.position).toEqual({ x: 0, y: 0, z: 0 });
        expect(particle.velocity).toEqual({ x: 0, y: 0, z: 0 });
        expect(particle.acceleration).toEqual({ x: 0, y: 0, z: 0 });
    });

    it('ParticleEmissionBurst 的默认工厂补齐字段', () =>
    {
        const burst = particleEmissionBurstDefault();

        expect(burst.time).toBe(0);
        expect(burst.count).toBeDefined();
    });
});
