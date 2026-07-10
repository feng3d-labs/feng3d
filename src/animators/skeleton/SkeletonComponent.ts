import type { Component, ComponentLogic } from '../../component/Component';
import type { Matrix4x4 } from '@feng3d/math';
import { registerLogic, logic } from "@feng3d/reactivity";
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
export interface SkeletonComponent extends Component
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
 * SkeletonComponent 逻辑处理输出。
 *
 * 提供 globalMatrices：当前骨骼姿势的全局矩阵列表。
 */
export interface SkeletonComponentLogic extends ComponentLogic
{
    readonly globalMatrices: Matrix4x4[];
}

/**
 * 获取 SkeletonComponent 的 logic。
 */
export function skeletonComponentLogic(skeleton: SkeletonComponent): SkeletonComponentLogic

{
    return logic(skeleton);
}

// 注册到 componentLogic 分发表
registerLogic('SkeletonComponent', (component) =>
{
    return skeletonComponentLogic(component as SkeletonComponent);
});
