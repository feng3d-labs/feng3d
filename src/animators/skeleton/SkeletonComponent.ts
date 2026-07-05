import type { Component } from '../../component/Component';
import type { Matrix4x4 } from '@feng3d/math';

import './skeletonComponentLogic';

declare global
{
    export interface MixinsComponentMap
    {
        SkeletonComponent: SkeletonComponent;
    }
}

/**
 * SkeletonComponent（纯数据接口）。
 */
export interface SkeletonComponent extends Component
{
    boneInverses: Matrix4x4[];
    boneNames: string[];
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
