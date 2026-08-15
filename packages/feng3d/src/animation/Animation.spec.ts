import { describe, expect, it } from 'vitest';
import { logic, reactive } from '@feng3d/reactivity';
import { AnimationClip } from './AnimationClip';
import { PropertyClip } from './PropertyClip';
import './Animation';
import type { Object3D } from '../core/Object3D';
import '../core/Object3D';

/**
 * 时间驱动命令式动画（设计 4.5 唯一模型）：update 累加 time，
 * 采样值经响应式代理写入属性宿主（变更源头），变更驱动渲染链自动更新。
 */
describe('animation/imperative', () =>
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
            }],
        } as unknown as Object3D;

        logic(obj);   // entity logic：组件自动 init（effect 建立）

        return obj;
    };

    it('update 推进 time 并经响应式写入数据字段', () =>
    {
        const obj = makeAnimatedObject();
        const animationComponent = obj.components[0] as unknown as { __type__: 'Animation' };
        const animationLogic = logic(animationComponent) as unknown as { update: (interval: number) => void };

        animationLogic.update(500);   // 500ms → position.x = 5

        const objLogic = logic(obj);
        expect(objLogic.position.x).toBe(5);
        // 变更驱动：矩阵链自动失效（写入经响应式代理）
        expect(objLogic.local2world.getPosition().x).toBe(5);
    });

    it('暂停（isplaying=false）停止推进与写入', () =>
    {
        const obj = makeAnimatedObject();
        const animationComponent = obj.components[0] as unknown as { __type__: 'Animation' };
        const animationLogic = logic(animationComponent) as unknown as { update: (interval: number) => void };

        animationLogic.update(250);
        expect(logic(obj).position.x).toBe(2.5);

        reactive(animationComponent as unknown as { isplaying: boolean }).isplaying = false;
        animationLogic.update(500);
        expect(logic(obj).position.x).toBe(2.5);   // 未变
    });

    it('循环回绕：time 超过 length 取模', () =>
    {
        const obj = makeAnimatedObject();
        const animationComponent = obj.components[0] as unknown as { __type__: 'Animation' };
        const animationLogic = logic(animationComponent) as unknown as { update: (interval: number) => void };

        animationLogic.update(1250);   // 1250ms → 回绕 250ms → x=2.5

        expect(logic(obj).position.x).toBe(2.5);
    });
});
