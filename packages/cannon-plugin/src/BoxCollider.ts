import { Object3D, registerComponentType } from 'feng3d';
import { registerLogic, UnReadonly } from '@feng3d/reactivity';
import { Box, Vec3 } from 'cannon-es';
import { Collider, ColliderLogic, createColliderLogicBase } from './Collider';

declare module 'feng3d'
{
    export interface ComponentMap
    {
        BoxCollider: BoxCollider;
    }
}

declare module '@feng3d/reactivity'
{
    interface LogicMap
    {
        BoxCollider: BoxColliderLogic;
    }
}

/**
 * 长方体碰撞体（纯数据接口）。
 */
export interface BoxCollider extends Collider
{
    readonly __type__: 'BoxCollider';

    /** 宽度（缺失时默认 1） */
    readonly width?: number;
    /** 高度（缺失时默认 1） */
    readonly height?: number;
    /** 深度（缺失时默认 1） */
    readonly depth?: number;
}

/**
 * 长方体碰撞体 logic 接口。
 */
export interface BoxColliderLogic extends ColliderLogic
{
}

/**
 * 工厂函数：BoxColliderLogic 的唯一创建入口。
 *
 * 形状是半边长各为 宽/高/深 一半的 Box。
 *
 * @param data 长方体碰撞体数据（raw）
 */
export function boxColliderLogic(data: BoxCollider): BoxColliderLogic
{
    // 构造参数字段可选，默认值由工厂补（写在 raw 数据上）
    const writable = data as UnReadonly<BoxCollider>;
    if (writable.width === undefined) writable.width = 1;
    if (writable.height === undefined) writable.height = 1;
    if (writable.depth === undefined) writable.depth = 1;

    const { state, members } = createColliderLogicBase(data);
    state.shapeFactory = () => new Box(new Vec3((data.width ?? 1) / 2, (data.height ?? 1) / 2, (data.depth ?? 1) / 2));

    const logic: BoxColliderLogic = {
        get component() { return members.component; },
        get entity() { return state.entity as Object3D | null; },
        get shape() { return members.shape; },
        init(object3D) { members.init(object3D); },
        beforeRender(renderObject) { members.beforeRender(renderObject); },
        get isLoaded() { return members.isLoaded; },
        dispose() { members.dispose(); },
    };

    return logic;
}

// 注册到统一 logic 分发表
registerLogic('BoxCollider', boxColliderLogic);

// 登记组件类型：BoxCollider 是 Collider 的子类型
registerComponentType('BoxCollider', { baseTypes: ['Collider'] });
