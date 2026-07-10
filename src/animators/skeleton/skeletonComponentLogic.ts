import { registerLogic } from "@feng3d/reactivity";
import { logic } from '@feng3d/reactivity';
import { Matrix4x4 } from '@feng3d/math';
import { ComponentLogic, } from '../../component/componentLogic';
import { findObject3DChild } from '../../core/object3DLogic';
import { SkeletonComponent } from './SkeletonComponent';

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
