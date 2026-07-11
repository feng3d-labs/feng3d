import { Component3D, Component, Component3DLogic, ComponentLogic } from '../../component/Component';
import { Matrix4x4 } from '@feng3d/math';
import { registerLogic, logic as getLogic } from "@feng3d/reactivity";
import { findObject3DChild } from '../../core/Object3D';

import './SkeletonComponent';

declare module '../../component/Component'
{
    export interface ComponentMap
    {
        SkeletonComponent: SkeletonComponent;
    }
}

/**
 * SkeletonComponent（纯数据接口）。
 */
export interface SkeletonComponent extends Component3D
{
    readonly __type__: 'SkeletonComponent';
    readonly boneInverses: Matrix4x4[];
    readonly boneNames: string[];
}

/**
 * 创建 SkeletonComponent 实例。
 */
export function createSkeletonComponent(): SkeletonComponent
{
    return {
        __type__: 'SkeletonComponent',
        boneInverses: null as any,
        boneNames: null as any,
    };
}

declare module '@feng3d/reactivity'
{
    interface LogicMap
    {
        SkeletonComponent: SkeletonComponentLogic;
    }
}

/**
 * SkeletonComponent 逻辑处理类。
 *
 * 提供 globalMatrices：当前骨骼姿势的全局矩阵列表（由外部 SkinnedMeshRenderer 读取）。
 */
export class SkeletonComponentLogic extends Component3DLogic
{
    /** 当前骨骼姿势的全局矩阵列表 */
    readonly globalMatrices: Matrix4x4[] = [];

    constructor(skeleton: SkeletonComponent)
    {
        super(skeleton);
    }
}
// 注册到 componentLogic 分发表
registerLogic('SkeletonComponent', (component) =>
{
    return new SkeletonComponentLogic(component as SkeletonComponent);
});
