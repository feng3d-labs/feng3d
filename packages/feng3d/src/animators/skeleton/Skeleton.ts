import { Component3D, ComponentLogicBase } from '../../component/Component';
import { Matrix4x4 } from '@feng3d/math';
import { registerLogic } from "@feng3d/reactivity";


declare module '../../component/Component'
{
    export interface ComponentMap
    {
        Skeleton: Skeleton;
    }
}

/**
 * Skeleton（纯数据接口）。
 */
export interface Skeleton extends Component3D
{
    readonly __type__: 'Skeleton';
    readonly boneInverses: Matrix4x4[];
    readonly boneNames: string[];
}

declare module '@feng3d/reactivity'
{
    interface LogicMap
    {
        Skeleton: SkeletonLogic;
    }
}

/**
 * Skeleton 逻辑类。
 *
 * 提供 globalMatrices：当前骨骼姿势的全局矩阵列表（由外部 SkinnedMeshRenderer 读取）。
 */
export class SkeletonLogic extends ComponentLogicBase
{
    /** 当前骨骼姿势的全局矩阵列表（内部可变，外部通过 getter 只读访问） */
    #globalMatrices: Matrix4x4[] = [];

    protected constructor(data: Skeleton)
    {
        super(data);
    }

    /** 内部创建入口（protected constructor 的唯一出口） */
    static create(data: Skeleton): SkeletonLogic
    {
        return new SkeletonLogic(data);
    }

    /** 当前骨骼姿势的全局矩阵列表 */
    get globalMatrices(): Matrix4x4[]
    {
        return this.#globalMatrices;
    }
}

// 注册到 logic 分发表
registerLogic('Skeleton', SkeletonLogic as unknown as new (data: Skeleton) => SkeletonLogic);
