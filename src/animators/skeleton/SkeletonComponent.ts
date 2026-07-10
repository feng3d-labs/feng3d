import { Component, ComponentLogic } from '../../component/Component';
import { Matrix4x4 } from '@feng3d/math';
import { registerLogic, toRaw } from "@feng3d/reactivity";
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
 * SkeletonComponent 逻辑处理类。
 *
 * 提供 globalMatrices：当前骨骼姿势的全局矩阵列表（由外部 SkinnedMeshRenderer 读取）。
 */
export class SkeletonComponentLogic extends ComponentLogic
{
    /** 当前骨骼姿势的全局矩阵列表 */
    readonly globalMatrices: Matrix4x4[] = [];

    constructor(skeleton: SkeletonComponent)
    {
        super(skeleton);
    }
}

const skeletonComponentLogicMap = new WeakMap<SkeletonComponent, SkeletonComponentLogic>();

/**
 * 获取 SkeletonComponent 的 logic。
 */
export function skeletonComponentLogic(skeleton: SkeletonComponent): SkeletonComponentLogic
{
    const raw = toRaw(skeleton);
    let l = skeletonComponentLogicMap.get(raw);
    if (l) return l;

    l = new SkeletonComponentLogic(raw);
    skeletonComponentLogicMap.set(raw, l);

    return l;
}

// 注册到 componentLogic 分发表
registerLogic('SkeletonComponent', (component) =>
{
    return new SkeletonComponentLogic(component as SkeletonComponent);
});
