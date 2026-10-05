import { Object3D, registerComponentType } from 'feng3d';
import { registerLogic } from '@feng3d/reactivity';
// 别名导入：cannon-es 的 DistanceConstraint 与本组件同名（同时也是 R3 判据的已知同名误报来源）。
import { DistanceConstraint as CannonDistanceConstraint } from 'cannon-es';
import { Constraint, ConstraintLogic, createConstraintLogicBase } from './Constraint';

declare module 'feng3d'
{
    export interface ComponentMap
    {
        DistanceConstraint: DistanceConstraint;
    }
}

declare module '@feng3d/reactivity'
{
    interface LogicMap
    {
        DistanceConstraint: DistanceConstraintLogic;
    }
}

/**
 * 距离约束（纯数据接口）：把两个刚体约束在给定距离上。
 *
 * 用在链条、摆锤、绳索这类结构上——把若干刚体首尾相连即可。
 */
export interface DistanceConstraint extends Constraint
{
    readonly __type__: 'DistanceConstraint';

    /** 约束距离（缺失时取两端刚体的当前距离） */
    readonly distance?: number;

    /** 最大约束力（缺失时用 cannon-es 的默认） */
    readonly maxForce?: number;
}

/**
 * 距离约束 logic 接口。
 */
export interface DistanceConstraintLogic extends ConstraintLogic
{
}

/**
 * 工厂函数：DistanceConstraintLogic 的唯一创建入口。
 *
 * @param data 距离约束数据（raw）
 */
export function distanceConstraintLogic(data: DistanceConstraint): DistanceConstraintLogic
{
    const { state, members } = createConstraintLogicBase(data);
    state.createConstraint = (bodyA, bodyB) =>
        new CannonDistanceConstraint(bodyA, bodyB, data.distance, data.maxForce);

    const logic: DistanceConstraintLogic = {
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

registerLogic('DistanceConstraint', distanceConstraintLogic);
registerComponentType('DistanceConstraint', { baseTypes: ['Constraint'] });
