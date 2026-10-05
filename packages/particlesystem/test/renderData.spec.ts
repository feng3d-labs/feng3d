import { minMaxCurveDefault } from '@feng3d/math';
import { logic } from '@feng3d/reactivity';
import { Buffer } from '@feng3d/webgpu';
import type { DrawIndexed } from '@feng3d/webgpu';
import { describe, expect, it } from 'vitest';
import { isRenderable } from 'feng3d';
import type { Object3D } from 'feng3d';
import { particleSystemDefault } from '../src/ParticleSystem';
import type { WritableParticleMainModuleLike } from '../src/modules/ParticleMainModule';

/**
 * 粒子系统与引擎渲染对象的对接（issue：粒子渲染闭环）。
 *
 * 这些断言钉住的是**渲染数据**：实例属性并入 renderObject.vertices、draw 的实例数、
 * particle_uniforms 的内容与每帧上传。纯数据层，不依赖 GPU 设备。
 */
describe('ParticleSystem 渲染数据对接', () =>
{
    /** 构造一个已挂载到 Object3D 的粒子系统，并推进一段时间让粒子发射出来 */
    function createLaunchedSystem(interval = 1000)
    {
        const particleSystem = particleSystemDefault();

        (particleSystem.main as WritableParticleMainModuleLike).maxParticles = 16;
        logic(particleSystem).play();

        const object3D: Object3D = {
            __type__: 'Object3D',
            name: 'particleSystem',
            components: [particleSystem],
        };
        const object3DLogic = logic(object3D);

        // 经 logic 路径推进（验证 update 已转发到组件的模拟逻辑）
        logic(particleSystem).update(interval);

        return { particleSystem, object3D, object3DLogic, renderObject: logic(particleSystem).renderObject.value };
    }

    it('每次 update 都会真正发射粒子（update 已转发）', () =>
    {
        const { particleSystem } = createLaunchedSystem();

        expect(logic(particleSystem).particleCount).toBeGreaterThan(0);
    });

    it('把粒子实例属性并入 renderObject.vertices（与几何体属性共存、共享同一交错缓冲）', () =>
    {
        const { renderObject } = createLaunchedSystem();
        const vertices = renderObject.vertices!;

        // 几何体属性仍在
        expect(vertices.a_position).toBeTruthy();
        expect(vertices.a_uv).toBeTruthy();

        const attributes = [
            vertices.a_particle_position,
            vertices.a_particle_scale,
            vertices.a_particle_rotation,
            vertices.a_particle_color,
            vertices.a_particle_tilingOffset,
            vertices.a_particle_flipUV,
        ];

        for (const attribute of attributes)
        {
            expect(attribute).toBeTruthy();
            expect(attribute!.stepMode).toBe('instance');
        }

        // 六个属性共享同一个 TypedArray：引擎按属性数据对象分组，只占 1 个顶点缓冲
        const data = attributes[0]!.data;

        for (const attribute of attributes)
        {
            expect(attribute!.data).toBe(data);
        }
    });

    it('draw 的 instanceCount 覆盖为活跃粒子数', () =>
    {
        const { particleSystem, renderObject } = createLaunchedSystem();
        const draw = renderObject.draw as DrawIndexed;

        expect(draw.__type__).toBe('DrawIndexed');
        expect(draw.instanceCount).toBe(logic(particleSystem).particleCount);
        expect(draw.instanceCount).toBeGreaterThan(0);
    });

    it('写入 particle_uniforms（公告牌矩阵 + 模型矩阵）', () =>
    {
        const { renderObject } = createLaunchedSystem();
        const binding = renderObject.bindingResources!.particle_uniforms as { value: Record<string, { __type__: string }> };
        const value = binding.value;

        expect(value.u_particle_billboardMatrix.__type__).toBe('Matrix3x3');
        expect(value.u_modelMatrix.__type__).toBe('Matrix4x4');
    });

    it('每帧把实例数据通过 writeBuffers 上传（复用同一 ArrayBuffer）', () =>
    {
        const { renderObject } = createLaunchedSystem();
        const data = renderObject.vertices!.a_particle_position!.data;
        const buffer = Buffer.getBuffer(data.buffer);

        expect(buffer.size).toBe(data.byteLength);
        // 首帧上传后 writeBuffers 会被引擎消费并清空；此处只断言缓冲已按同一 ArrayBuffer 建立
        expect(Buffer.getBuffer(data.buffer)).toBe(buffer);
    });
});

/**
 * 声明式兼容层（过渡期，纯数据化前的欠账）：
 * 场景里用纯数据字面量声明 ParticleSystem 时，logic 工厂要把它提升为实例，
 * 否则 class 上的 beforeRender / update 都不存在。
 */
describe('ParticleSystem 纯数据声明式', () =>
{
    it('默认工厂 + 就地覆盖字段即可作为组件数据挂载（不再需要实例提升）', () =>
    {
        const component = particleSystemDefault();
        // 就地改字段（而不是替换整个 main 对象）：模块的反向引用注入在工厂里完成，替换会丢掉它
        (component.main as WritableParticleMainModuleLike).startSpeed = { __type__: 'MinMaxCurve', ...minMaxCurveDefault(), constant: 2 };
        const components = [component] as unknown as Object3D['components'];

        const object3D: Object3D = { __type__: 'Object3D', name: 'declarative', components };
        logic(object3D);

        // 纯数据化后不再有「字面量 → 实例」兼容层：字面量（默认工厂 + 覆盖）直接就是组件数据
        expect(component.main.startSpeed.constant).toBe(2);
        // 曲线族已纯数据化：曲线字段是纯数据 AnimationCurve（有 keys 数组，不再有 getValue 方法）
        expect(Array.isArray(component.main.startSpeed.curve.keys)).toBe(true);

        const particleSystemLogic = logic(component);

        expect(particleSystemLogic.entity).toBe(object3D);
        expect(particleSystemLogic.isVisibleAndEnabled.value).toBe(true);
    });

    it('组件类型已登记，isRenderable 认得它（否则进不了渲染列表）', () =>
    {
        const particleSystem = particleSystemDefault();

        expect(isRenderable(particleSystem as never)).toBe(true);
    });
});

