import { effect, reactive, toRaw } from '@feng3d/reactivity';
import { Component } from '../component/Component';
import { ComponentLogic } from '../component/componentLogic';
import { Entity } from './Entity';
import type { Object3D } from './Object3D';

/**
 * Entity 逻辑处理输出。
 *
 * Entity 是纯组件容器，组件的增删直接操作 reactive(entity).components。
 * createEntityLogic 通过 effect 监听 components 变化，对新组件自动执行
 * ComponentLogic.initComponent（注入 object3D 并调用 init()）。
 */
export interface EntityLogic
{
}

/**
 * 创建 Entity 的 logic。
 *
 * 子模块（如 createObject3DLogic）调用本函数注册组件自动初始化的 effect。
 */
export function createEntityLogic(entity: Entity): EntityLogic
{
    effect(() =>
    {
        const r_components = reactive(entity).components as Component[];
        for (const r_component of r_components)
        {
            const rawComponent = toRaw(r_component);
            ComponentLogic.initComponent(rawComponent, entity as Object3D);
        }
    });

    return {};
}
