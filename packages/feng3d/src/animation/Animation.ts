import { behaviourLogicProto, setupBehaviourLogicState, Behaviour, BehaviourLogic, type BehaviourLogicState } from '../component/Behaviour';
import type { Component } from '../component/Component';
import type { AnimationClipData } from './AnimationClip';
import { registerLogic, effect, reactive, createLogicProto } from "@feng3d/reactivity";
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
    // 可选：dispose 时会被清空（AGENTS §11.5 子接口字段可选，工厂补默认）
    readonly animation?: AnimationClipData;
    readonly animations?: AnimationClipData[];
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
 * Animation 逻辑接口。
 *
 * 时间驱动命令式动画（设计 4.5 唯一模型）：update 累加 time，采样值
 * **经响应式代理写入属性宿主**（Object3D 的 position/rotation、材质
 * uniform 等任意 PropertyClip path 指向的数据）——动画是变更源头（4.3
 * 命令式逃生舱），写入触发变更驱动渲染链自动更新。
 */
export interface AnimationLogic extends BehaviourLogic
{
}

/** AnimationLogic 实例的内部状态（不进公开接口，工厂装配时写入） */
interface AnimationLogicState extends BehaviourLogicState
{
    /** 数据引用（工厂装配后不变，computed/effect 闭包内经 reactive 读取建立依赖） */
    _animation: Animation;

    /** init 去重标志（同一 component 只初始化一次） */
    _subInited: boolean;

    /** 应用动画（工厂内定义后挂到实例，供 proto 的 init / update 调用） */
    _updateAni: () => void;
}

/** AnimationLogic 的共享原型：继承 Behaviour 基类实现，覆写 init / update / dispose */
const animationLogicProto = createLogicProto<AnimationLogic>(behaviourLogicProto, {
    /** 初始化：注入 entity（同一 component 只初始化一次） */
    init: {
        value: function (this: AnimationLogic & AnimationLogicState, object3D?: Object3D): void
        {
            if (this._subInited) return;
            this._subInited = true;
            behaviourLogicProto.init.call(this, object3D);

            // @边界 effect：设计 4.5 时间驱动动画——animation 变更源桥
            // animation 变化时重置 time=0
            effect(() =>
            {
                reactive(this._animation).animation;
                reactive(this._animation).time = 0;
            });

            // @边界 effect：设计 4.5 时间驱动动画——时间源 → 属性宿主写桥
            // time 变化时应用动画
            effect(() =>
            {
                const r_animation = reactive(this._animation);
                r_animation.time;
                this._updateAni();
            });
        },
    },
    update: {
        value: function (this: AnimationLogic & AnimationLogicState, interval: number): void
        {
            behaviourLogicProto.update.call(this, interval);
            const r_animation = reactive(this._animation);
            if (r_animation.isplaying)
            {
                r_animation.time = r_animation.time + interval * this._animation.playspeed;
            }
        },
    },
    dispose: {
        value: function (this: AnimationLogic & AnimationLogicState): void
        {
            const r_animation = reactive(this._animation);
            // 字段类型是非可选的（用 undefined 而不是 null 清空，strictNullChecks 下只有前者合法）
            r_animation.animation = undefined;
            r_animation.animations = undefined;
            behaviourLogicProto.dispose.call(this);
        },
    },
});

/**
 * 工厂函数：AnimationLogic 的唯一创建入口（registerLogic 注册它）。
 *
 * @param data 组件数据（raw）
 */
export function animationLogic(data: Animation): AnimationLogic
{
    const logic = setupBehaviourLogicState(Object.create(animationLogicProto) as AnimationLogic & AnimationLogicState, data);

    logic._animation = data;
    logic._subInited = false;

    function getPropertyHost(propertyClip: PropertyClip): Record<string, unknown> | null
    {
        let propertyHost: Object3D | Component | null = logic.entity;
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
                    propertyHost = (propertyHost as Object3D).components?.find((c: Component) => c instanceof componentClass) ?? null;
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

    function updateAni(): void
    {
        if (!logic._animation.animation) return;

        const cycle = logic._animation.animation.length;
        const cliptime = (logic._animation.time % cycle + cycle) % cycle;

        const propertyClips = logic._animation.animation.propertyClips;

        for (let i = 0; i < propertyClips.length; i++)
        {
            const propertyClip = propertyClips[i];

            if (propertyClip.times.length === 0) continue;
            const propertyHost = getPropertyHost(propertyClip);
            if (!propertyHost) continue;
            // 经响应式代理写入（规范 8）：裸写不触发失效，变更驱动渲染下画面不会更新
            reactive(propertyHost)[propertyClip.propertyName] = propertyClip.getValue(cliptime);
        }
    }

    logic._updateAni = updateAni;

    return logic;
}
// 注册到 logic 分发表
registerLogic('Animation', animationLogic);
