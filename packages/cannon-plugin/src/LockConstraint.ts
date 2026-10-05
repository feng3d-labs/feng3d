import { Object3D, registerComponentType } from 'feng3d';
import { registerLogic } from '@feng3d/reactivity';
// 别名导入：cannon-es 的 LockConstraint 与本组件同名。
import { LockConstraint as CannonLockConstraint } from 'cannon-es';
import { Constraint, ConstraintLogic, createConstraintLogicBase } from './Constraint';

declare module 'feng3d'
{
    export interface ComponentMap
    {
        LockConstraint: LockConstraint;
    }
}

declare module '@feng3d/reactivity'
{
    interface LogicMap
    {
        LockConstraint: LockConstraintLogic;
    }
}

/**
 * 锁定约束（纯数据接口）：把两个刚体的相对位置与相对姿态**完全锁死**。
 *
 * 相当于把两块焊在一起（彼此之间不再有相对运动），常用于把零件拼成一个整体。
 */
export interface LockConstraint extends Constraint
{
    readonly __type__: 'LockConstraint';

    /** 最大约束力（缺失时用 cannon-es 的默认） */
    readonly maxForce?: number;
}

/**
 * 锁定约束 logic 接口。
 */
export interface LockConstraintLogic extends ConstraintLogic
{
}

/**
 * 工厂函数：LockConstraintLogic 的唯一创建入口。
 *
 * @param data 锁定约束数据（raw）
 */
export function lockConstraintLogic(data: LockConstraint): LockConstraintLogic
{
    const { state, members } = createConstraintLogicBase(data);
    state.createConstraint = (bodyA, bodyB) => new CannonLockConstraint(bodyA, bodyB, { maxForce: data.maxForce });

    const logic: LockConstraintLogic = {
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

registerLogic('LockConstraint', lockConstraintLogic);
registerComponentType('LockConstraint', { baseTypes: ['Constraint'] });
