import { Object3D, registerComponentType } from 'feng3d';
import { registerLogic } from '@feng3d/reactivity';
import type { Vector3Like } from '@feng3d/math';
// 别名导入：cannon-es 的 HingeConstraint 与本组件同名。
import { HingeConstraint as CannonHingeConstraint, Vec3 } from 'cannon-es';
import { Constraint, ConstraintLogic, createConstraintLogicBase } from './Constraint';

declare module 'feng3d'
{
    export interface ComponentMap
    {
        HingeConstraint: HingeConstraint;
    }
}

declare module '@feng3d/reactivity'
{
    interface LogicMap
    {
        HingeConstraint: HingeConstraintLogic;
    }
}

/**
 * 铰链约束（纯数据接口）：让两个刚体只能绕一根公共轴相对转动。
 *
 * 典型用法是一扇门/一个钟摆：一端是静态刚体（门框），另一端是门的刚体，
 * 铰链轴用 axisA / axisB 指定（缺失时为 (0,1,0)，即竖直轴）。
 */
export interface HingeConstraint extends Constraint
{
    readonly __type__: 'HingeConstraint';

    /** A 端铰链轴（缺失时 (0,1,0)） */
    readonly axisA?: Vector3Like;
    /** B 端铰链轴（缺失时 (0,1,0)） */
    readonly axisB?: Vector3Like;
    /** A 端枢轴相对刚体质心的偏移（缺失时 (0,0,0)） */
    readonly pivotA?: Vector3Like;
    /** B 端枢轴相对刚体质心的偏移（缺失时 (0,0,0)） */
    readonly pivotB?: Vector3Like;
    /** 最大约束力（缺失时用 cannon-es 的默认） */
    readonly maxForce?: number;
}

/**
 * 铰链约束 logic 接口。
 */
export interface HingeConstraintLogic extends ConstraintLogic
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
 * 工厂函数：HingeConstraintLogic 的唯一创建入口。
 *
 * @param data 铰链约束数据（raw）
 */
export function hingeConstraintLogic(data: HingeConstraint): HingeConstraintLogic
{
    const { state, members } = createConstraintLogicBase(data);
    state.createConstraint = (bodyA, bodyB) => new CannonHingeConstraint(bodyA, bodyB, {
        axisA: toVec3(data.axisA),
        axisB: toVec3(data.axisB),
        pivotA: toVec3(data.pivotA),
        pivotB: toVec3(data.pivotB),
        maxForce: data.maxForce,
    });

    const logic: HingeConstraintLogic = {
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

registerLogic('HingeConstraint', hingeConstraintLogic);
registerComponentType('HingeConstraint', { baseTypes: ['Constraint'] });
