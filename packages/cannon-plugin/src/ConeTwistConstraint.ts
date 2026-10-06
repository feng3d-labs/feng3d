import { Object3D, registerComponentType } from 'feng3d';
import { registerLogic } from '@feng3d/reactivity';
import type { Vector3Like } from '@feng3d/math';
// 别名导入：cannon-es 的 ConeTwistConstraint 与本组件同名。
import { ConeTwistConstraint as CannonConeTwistConstraint, Vec3 } from 'cannon-es';
import { Constraint, ConstraintLogic, createConstraintLogicBase } from './Constraint';

declare module 'feng3d'
{
    export interface ComponentMap
    {
        ConeTwistConstraint: ConeTwistConstraint;
    }
}

declare module '@feng3d/reactivity'
{
    interface LogicMap
    {
        ConeTwistConstraint: ConeTwistConstraintLogic;
    }
}

/**
 * 锥形扭转约束（纯数据接口）：把两个刚体连在一个"锥形"活动范围里。
 *
 * 与铰链的区别：铰链只允许绕一根轴转，锥形扭转允许在**一个圆锥角内**自由摆动，
 * 再叠加一个扭转角限制——这正是人体关节（脖子、肩、髋）的近似。
 * 原版 `ragdoll.html` 就是用它把七段人体拼起来的。
 */
export interface ConeTwistConstraint extends Constraint
{
    readonly __type__: 'ConeTwistConstraint';

    /** A 端枢轴（局部坐标，缺失时 (0,0,0)） */
    readonly pivotA?: Vector3Like;
    /** B 端枢轴（局部坐标，缺失时 (0,0,0)） */
    readonly pivotB?: Vector3Like;
    /** A 端参考轴（局部坐标，缺失时 (0,0,0)） */
    readonly axisA?: Vector3Like;
    /** B 端参考轴（局部坐标，缺失时 (0,0,0)） */
    readonly axisB?: Vector3Like;
    /** 锥形最大摆角（弧度，缺失时用 cannon-es 默认） */
    readonly angle?: number;
    /** 最大扭转角（弧度，缺失时用 cannon-es 默认） */
    readonly twistAngle?: number;
    /** 最大约束力（缺失时用 cannon-es 默认） */
    readonly maxForce?: number;
    /** 两端是否互相碰撞（缺失时 false） */
    readonly collideConnected?: boolean;
}

/**
 * 锥形扭转约束 logic 接口。
 */
export interface ConeTwistConstraintLogic extends ConstraintLogic
{
}

/**
 * 把可选的三维字面量转成 Vec3。
 *
 * @param v 三维字面量
 * @returns Vec3 或 undefined
 */
function toVec3(v: Vector3Like | undefined): Vec3 | undefined
{
    return v === undefined ? undefined : new Vec3(v.x, v.y, v.z);
}

/**
 * 工厂函数：ConeTwistConstraintLogic 的唯一创建入口。
 *
 * @param data 锥形扭转约束数据（raw）
 */
export function coneTwistConstraintLogic(data: ConeTwistConstraint): ConeTwistConstraintLogic
{
    const { state, members } = createConstraintLogicBase(data);
    state.createConstraint = (bodyA, bodyB) => new CannonConeTwistConstraint(bodyA, bodyB, {
        pivotA: toVec3(data.pivotA),
        pivotB: toVec3(data.pivotB),
        axisA: toVec3(data.axisA),
        axisB: toVec3(data.axisB),
        angle: data.angle,
        twistAngle: data.twistAngle,
        maxForce: data.maxForce,
        collideConnected: data.collideConnected,
    });

    const logic: ConeTwistConstraintLogic = {
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

registerLogic('ConeTwistConstraint', coneTwistConstraintLogic);
registerComponentType('ConeTwistConstraint', { baseTypes: ['Constraint'] });
