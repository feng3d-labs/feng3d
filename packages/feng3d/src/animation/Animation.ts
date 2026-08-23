import { Behaviour, BehaviourLogic } from '../component/Behaviour';
import type { Component } from '../component/Component';
import type { AnimationClip } from './AnimationClip';
import { registerLogic, effect, reactive } from "@feng3d/reactivity";
import { classUtils } from '@feng3d/polyfill';
import { findObject3DChild } from '../core/Object3D';
import type { Object3D } from '../core/Object3D';
import { PropertyClip, PropertyClipPathItemType } from './PropertyClip';


declare module '../component/Component'
{
    export interface ComponentMap
    {
        Animation: Animation;
    }
}

/**
 * Animation（纯数据接口）。
 */
export interface Animation extends Behaviour
{
    readonly __type__: 'Animation';
    readonly animation: AnimationClip;
    readonly animations: AnimationClip[];
    readonly time: number;
    readonly isplaying: boolean;
    readonly playspeed: number;
}

declare module '@feng3d/reactivity'
{
    interface LogicMap
    {
        Animation: AnimationLogic;
    }
}

/**
 * Animation 逻辑类。
 *
 * 时间驱动命令式动画（设计 4.5 唯一模型）：update 累加 time，采样值
 * **经响应式代理写入属性宿主**（Object3D 的 position/rotation、材质
 * uniform 等任意 PropertyClip path 指向的数据）——动画是变更源头（4.3
 * 命令式逃生舱），写入触发变更驱动渲染链自动更新。
 */
export class AnimationLogic extends BehaviourLogic
{
    /** 数据引用（构造后不变，computed/effect 闭包内经 reactive 读取建立依赖） */
    readonly #animation: Animation;

    /** init 去重标志（同一 component 只初始化一次） */
    #subInited = false;

    protected constructor(data: Animation)
    {
        super(data);
        this.#animation = data;
    }

    /** 内部创建入口（protected constructor 的唯一出口） */
    static create(data: Animation): AnimationLogic
    {
        return new AnimationLogic(data);
    }

    #getPropertyHost(propertyClip: PropertyClip): Record<string, unknown> | null
    {
        let propertyHost: Object3D | Component | null = this.entity;
        const path = propertyClip.path;

        for (let i = 0; i < path.length; i++)
        {
            const element = path[i];
            switch (element[0])
            {
                case PropertyClipPathItemType.Object3D:
                    propertyHost = propertyHost && 'children' in propertyHost ? findObject3DChild(propertyHost as Object3D, element[1]) ?? null : null;
                    break;
                case PropertyClipPathItemType.Component:
                {
                    if (!propertyHost || !('components' in propertyHost)) { propertyHost = null; break; }
                    const componentClass = classUtils.getDefinitionByName(element[1]) as new (...args: unknown[]) => unknown;
                    propertyHost = (propertyHost as Object3D).components.find((c: Component) => c instanceof componentClass) ?? null;
                    break;
                }
                default:
                    console.error(`无法获取 PropertyHost ${element}`);
            }
            if (!propertyHost)
            {
                return null;
            }
        }

        return propertyHost as unknown as Record<string, unknown> | null;
    }

    #updateAni(): void
    {
        if (!this.#animation.animation) return;

        const cycle = this.#animation.animation.length;
        const cliptime = (this.#animation.time % cycle + cycle) % cycle;

        const propertyClips = this.#animation.animation.propertyClips;

        for (let i = 0; i < propertyClips.length; i++)
        {
            const propertyClip = propertyClips[i];

            if (propertyClip.times.length === 0) continue;
            const propertyHost = this.#getPropertyHost(propertyClip);
            if (!propertyHost) continue;
            // 经响应式代理写入（规范 8）：裸写不触发失效，变更驱动渲染下画面不会更新
            reactive(propertyHost)[propertyClip.propertyName] = propertyClip.getValue(cliptime);
        }
    }

    override init(object3D?: Object3D): void
    {
        if (this.#subInited) return;
        this.#subInited = true;
        super.init(object3D);

        // @边界 effect：设计 4.5 时间驱动动画——animation 变更源桥
        // animation 变化时重置 time=0
        effect(() =>
        {
            reactive(this.#animation).animation;
            reactive(this.#animation).time = 0;
        });

        // @边界 effect：设计 4.5 时间驱动动画——时间源 → 属性宿主写桥
        // time 变化时应用动画
        effect(() =>
        {
            const r_animation = reactive(this.#animation);
            r_animation.time;
            this.#updateAni();
        });
    }

    override update(interval: number): void
    {
        super.update(interval);
        const r_animation = reactive(this.#animation);
        if (r_animation.isplaying)
        {
            r_animation.time = r_animation.time + interval * this.#animation.playspeed;
        }
    }

    override dispose(): void
    {
        const r_animation = reactive(this.#animation);
        r_animation.animation = null;
        r_animation.animations = null;
        super.dispose();
    }
}
// 注册到 logic 分发表
registerLogic('Animation', AnimationLogic as unknown as new (data: Animation) => AnimationLogic);
