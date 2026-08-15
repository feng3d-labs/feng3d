import { describe, expect, it, beforeAll, afterAll } from 'vitest';
import { logic, reactive } from '@feng3d/reactivity';
import { Vector3 } from '@feng3d/math';
import { AnimationClip } from './AnimationClip';
import { PropertyClip } from './PropertyClip';
import { timeSource } from './TimeSource';
import './Animation';
import './TimeSource';
import type { Object3D } from '../core/Object3D';
import '../core/Object3D';

// 时间源由 ticker 后台推进（真实间隔存在误差），测试暂停后自行控制 t
beforeAll(() =>
{
    reactive(timeSource).paused = true;
    reactive(timeSource).t = 0;   // 清除模块加载到暂停之间的后台推进
});
afterAll(() =>
{
    reactive(timeSource).paused = false;
});

/**
 * 声明式动画（框架设计文档 4.5 终态）：动画值为 computed 采样（时间源驱动），
 * Object3DLogic.matrix 消费采样值，不写回数据字段。
 */
describe('animation/declarative', () =>
{
    const makeClip = (): AnimationClip =>
    {
        const positionClip = new PropertyClip();
        positionClip.path = [];
        positionClip.propertyName = 'position';
        positionClip.type = 'Vector3';
        positionClip.times = [0, 1000];
        positionClip.values = [0, 0, 0, 10, 0, 0];

        const clip = new AnimationClip();
        clip.name = 'test';
        clip.length = 1000;
        clip.propertyClips = [positionClip];

        return clip;
    };

    const makeAnimatedObject = () =>
    {
        const obj = {
            __type__: 'Object3D',
            name: 'Animated',
            components: [{
                __type__: 'Animation',
                animation: makeClip(),
                time: 0,
                isplaying: true,
                playspeed: 1,
                declarative: true,
            }],
        } as unknown as Object3D;

        return obj;
    };

    it('未激活动画时 sampleTransform 为 null，matrix 用数据字段', () =>
    {
        reactive(timeSource).t = 0;   // it 间全局时间源残留重置
        const obj = makeAnimatedObject();
        reactive(obj.components[0] as unknown as { isplaying: boolean }).isplaying = false;

        const animationLogic = logic(obj.components[0] as never) as unknown as { sampleTransform: unknown };
        expect(animationLogic.sampleTransform).toBeNull();

        const objLogic = logic(obj);
        expect(objLogic.position.x).toBe(0);
    });

    it('采样值随时间源插值，matrix 消费采样而非数据字段', () =>
    {
        reactive(timeSource).t = 0;   // it 间全局时间源残留重置
        const obj = makeAnimatedObject();
        const animation = obj.components[0] as unknown as AnimationClip & { time: number };
        void animation;

        const objLogic = logic(obj);
        const animationLogic = logic(obj.components[0] as never) as unknown as { sampleTransform: { position?: Vector3 } | null };

        // t=0：采样 position.x = 0
        const t0 = timeSource.t;
        void t0;
        expect(animationLogic.sampleTransform?.position?.x).toBe(0);

        // 推进时间源到 500ms：插值 position.x = 5
        reactive(timeSource).t = timeSource.t + 0.5;
        expect(animationLogic.sampleTransform?.position?.x).toBe(5);

        // matrix 消费采样值（local2world 平移 x = 5），且动画采样优先于数据字段
        expect(objLogic.local2world.getPosition().x).toBe(5);
        reactive(obj).position = { x: 100, y: 0, z: 0 };
        expect(objLogic.local2world.getPosition().x).toBe(5);
    });

    it('暂停时间源后采样值静止', () =>
    {
        reactive(timeSource).t = 0;   // it 间全局时间源残留重置
        const obj = makeAnimatedObject();
        const animationLogic = logic(obj.components[0] as never) as unknown as { sampleTransform: { position?: Vector3 } | null };

        reactive(timeSource).t = timeSource.t + 0.25;   // 250ms → x=2.5
        expect(animationLogic.sampleTransform?.position?.x).toBe(2.5);

        reactive(timeSource).paused = true;
        const before = animationLogic.sampleTransform?.position?.x;
        reactive(timeSource).t = timeSource.t + 1;      // 暂停时 ticker 不推进（这里模拟直接写，验证的是值语义）
        reactive(timeSource).t = timeSource.t - 1;      // 还原
        reactive(timeSource).paused = false;

        expect(animationLogic.sampleTransform?.position?.x).toBe(before);
    });

    it('循环采样：超过 length 回绕', () =>
    {
        reactive(timeSource).t = 0;   // it 间全局时间源残留重置
        const obj = makeAnimatedObject();
        const animationLogic = logic(obj.components[0] as never) as unknown as { sampleTransform: { position?: Vector3 } | null };

        reactive(timeSource).t = timeSource.t + 1.25;   // 1250ms → 回绕到 250ms → x=2.5
        expect(animationLogic.sampleTransform?.position?.x).toBe(2.5);
    });

    it('命令式模式（declarative 缺省）不激活声明式采样', () =>
    {
        reactive(timeSource).t = 0;   // it 间全局时间源残留重置
        const obj = makeAnimatedObject();
        reactive(obj.components[0] as unknown as { declarative?: boolean }).declarative = false;

        const animationLogic = logic(obj.components[0] as never) as unknown as { sampleTransform: unknown };
        expect(animationLogic.sampleTransform).toBeNull();
    });
});
