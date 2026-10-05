import { Object3D, registerComponentType } from 'feng3d';
import { registerLogic } from '@feng3d/reactivity';
import type { Vector3Like } from '@feng3d/math';
// 别名导入：cannon-es 的 PointToPointConstraint 与本组件同名。
import { PointToPointConstraint as CannonPointToPointConstraint, Vec3 } from 'cannon-es';
import { Constraint, ConstraintLogic, createConstraintLogicBase } from './Constraint';

declare module 'feng3d'
{
    export interface ComponentMap
    {
        PointToPointConstraint: PointToPointConstraint;
    }
}

declare module '@feng3d/reactivity'
{
    interface LogicMap
    {
        PointToPointConstraint: PointToPointConstraintLogic;
    }
}

/**
 * 点对点约束（纯数据接口）：把两个刚体上的两个点钉在一起（球铰）。
 *
 * 这是铰链 / 锁定约束的基座：它们都在此之上再各加两条转动方程。
 * 单独用它就是「两个物体可以绕公共点自由转动」——肩关节、髋关节那种。
 */
export interface PointToPointConstraint extends Constraint
{
    readonly __type__: 'PointToPointConstraint';

    /** A 端锚点（相对刚体 A 质心的局部坐标，缺失时 (0,0,0)） */
    readonly pivotA?: Vector3Like;

    /** B 端锚点（相对刚体 B 质心的局部坐标，缺失时 (0,0,0)） */
    readonly pivotB?: Vector3Like;

    /** 最大约束力（缺失时用 cannon-es 的默认） */
    readonly maxForce?: number;
}

/**
 * 点对点约束 logic 接口。
 */
export interface PointToPointConstraintLogic extends ConstraintLogic
{
}

/**
 * 把可选的三维字面量转成 cannon-es 的 Vec3（缺失时返回 undefined，交给 cannon-es 用默认值）。
 *
 * @param v 三维字面量
 * @returns Vec3 或 undefined
 */
function toVec3(v: Vector3Like | undefined): Vec3 | undefined
{
    return v === undefined ? undefined : new Vec3(v.x, v.y, v.z);
}

/**
 * 工厂函数：PointToPointConstraintLogic 的唯一创建入口。
 *
 * @param data 点对点约束数据（raw）
 */
export function pointToPointConstraintLogic(data: PointToPointConstraint): PointToPointConstraintLogic
{
    const { state, members } = createConstraintLogicBase(data);
    state.createConstraint = (bodyA, bodyB) =>
        new CannonPointToPointConstraint(bodyA, toVec3(data.pivotA), bodyB, toVec3(data.pivotB), data.maxForce);

    const logic: PointToPointConstraintLogic = {
        get component() { return members.component; },
        get entity() { return state.entity as Object3D | null; },
        get targetName() { return members.targetName; },
        get createConstraint() { return members.createConstraint; },
        init(object3D) { members.init(object3D); },
        beforeRender(renderObject) { members.beforeRender(renderObject); },
        get isLoaded() { return members.isLoaded; },
        dispose() { members.dispose(); },
    };

    return logic;
}

registerLogic('PointToPointConstraint', pointToPointConstraintLogic);
registerComponentType('PointToPointConstraint', { baseTypes: ['Constraint'] });
