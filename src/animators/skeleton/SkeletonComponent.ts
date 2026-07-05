import type { Component } from '../../component/Component';
import type { Matrix4x4 } from '@feng3d/math';

import './skeletonComponentLogic';

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
