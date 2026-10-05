import { Object3D, registerComponentType } from 'feng3d';
import { registerLogic, UnReadonly } from '@feng3d/reactivity';
import { Cylinder } from 'cannon-es';
import { Collider, ColliderLogic, createColliderLogicBase } from './Collider';

declare module 'feng3d'
{
    export interface ComponentMap
    {
        CylinderCollider: CylinderCollider;
    }
}

declare module '@feng3d/reactivity'
{
    interface LogicMap
    {
        CylinderCollider: CylinderColliderLogic;
    }
}

/**
 * 圆柱体碰撞体（纯数据接口）。
 */
export interface CylinderCollider extends Collider
{
    readonly __type__: 'CylinderCollider';

    /** 顶部半径（缺失时默认 0.5） */
    readonly topRadius?: number;
    /** 底部半径（缺失时默认 0.5） */
    readonly bottomRadius?: number;
    /** 高度（缺失时默认 2） */
    readonly height?: number;
    /** 横向分割数（缺失时默认 16） */
    readonly segmentsW?: number;
}

/**
 * 圆柱体碰撞体 logic 接口。
 */
export interface CylinderColliderLogic extends ColliderLogic
{
}

/**
 * 工厂函数：CylinderColliderLogic 的唯一创建入口。
 *
 * @param data 圆柱体碰撞体数据（raw）
 */
export function cylinderColliderLogic(data: CylinderCollider): CylinderColliderLogic
{
    const writable = data as UnReadonly<CylinderCollider>;
    if (writable.topRadius === undefined) writable.topRadius = 0.5;
    if (writable.bottomRadius === undefined) writable.bottomRadius = 0.5;
    if (writable.height === undefined) writable.height = 2;
    if (writable.segmentsW === undefined) writable.segmentsW = 16;

    const { state, members } = createColliderLogicBase(data);
    state.shapeFactory = () => new Cylinder(data.topRadius ?? 0.5, data.bottomRadius ?? 0.5, data.height ?? 2, data.segmentsW ?? 16);

    const logic: CylinderColliderLogic = {
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

registerLogic('CylinderCollider', cylinderColliderLogic);
registerComponentType('CylinderCollider', { baseTypes: ['Collider'] });
