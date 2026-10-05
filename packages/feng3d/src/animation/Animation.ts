import { Behaviour, BehaviourLogic, createBehaviourLogicBase } from '../component/Behaviour';
import type { Component } from '../component/Component';
import type { AnimationClipData } from './AnimationClip';
import { registerLogic, effect, reactive } from '@feng3d/reactivity';
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

/**
 * 工厂函数：AnimationLogic 的唯一创建入口（registerLogic 注册它）。
 *
 * @param data 组件数据（raw）
 */
export function animationLogic(data: Animation): AnimationLogic
{
    const { members } = createBehaviourLogicBase(data);

    const animation = data;
    let subInited = false;

    function getPropertyHost(propertyClip: PropertyClip): Record<string, unknown> | null
    {
        let propertyHost: Object3D | Component | null = members.entity;
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
        if (!animation.animation) return;

        const cycle = animation.animation.length;
        const cliptime = (animation.time % cycle + cycle) % cycle;

        const propertyClips = animation.animation.propertyClips;

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

    const logic: AnimationLogic = {
        get component() { return members.component; },
        get entity() { return members.entity; },
        get isVisibleAndEnabled() { return members.isVisibleAndEnabled; },
        /** 初始化：注入 entity（同一 component 只初始化一次） */
        init(object3D)
        {
            if (subInited) return;
            subInited = true;
            members.init(object3D);

            // @边界 effect：设计 4.5 时间驱动动画——animation 变更源桥
            // animation 变化时重置 time=0
            effect(() =>
            {
                reactive(animation).animation;
                reactive(animation).time = 0;
            });

            // @边界 effect：设计 4.5 时间驱动动画——时间源 → 属性宿主写桥
            // time 变化时应用动画
            effect(() =>
            {
                const r_animation = reactive(animation);
                r_animation.time;
                updateAni();
            });
        },
        beforeRender(renderObject) { members.beforeRender(renderObject); },
        update(interval)
        {
            members.update(interval);
            const r_animation = reactive(animation);
            if (r_animation.isplaying)
            {
                r_animation.time = r_animation.time + interval * animation.playspeed;
            }
        },
        get isLoaded() { return members.isLoaded; },
        dispose()
        {
            const r_animation = reactive(animation);
            // 字段类型是非可选的（用 undefined 而不是 null 清空，strictNullChecks 下只有前者合法）
            r_animation.animation = undefined;
            r_animation.animations = undefined;
            members.dispose();
        },
    };

    return logic;
}
// 注册到 logic 分发表
registerLogic('Animation', animationLogic);
