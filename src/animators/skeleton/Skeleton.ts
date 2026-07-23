import { Component3D, Component3DLogic } from '../../component/Component';
import { Matrix4x4 } from '@feng3d/math';
import { registerLogic } from "@feng3d/reactivity";

import './Skeleton';

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
 * Skeleton 逻辑接口。
 *
 * 提供 globalMatrices：当前骨骼姿势的全局矩阵列表（由外部 SkinnedMeshRenderer 读取）。
 */
export interface SkeletonLogic extends Component3DLogic
{
    /** 当前骨骼姿势的全局矩阵列表 */
    readonly globalMatrices: Matrix4x4[];
}

/**
 * 创建 SkeletonLogic 实例（函数式实现）。
 */
function skeletonLogic(skeleton: Skeleton): SkeletonLogic
{
    /** 当前骨骼姿势的全局矩阵列表（内部可变，外部通过 getter 只读访问） */
    let _globalMatrices: Matrix4x4[] = [];

    return {
        get component() { return skeleton; },
        get entity() { return null; },
        init() { },
        beforeRender() { },
        dispose() { },
        get globalMatrices() { return _globalMatrices; },
    } as unknown as SkeletonLogic;
}

// 注册到 componentLogic 分发表
registerLogic('Skeleton', skeletonLogic);
