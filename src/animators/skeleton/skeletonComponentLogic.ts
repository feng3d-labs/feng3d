import { logic } from '@feng3d/reactivity';
import { Matrix4x4 } from '@feng3d/math';
import { ComponentLogic, registerComponentLogic } from '../../component/componentLogic';
import { findObject3DChild } from '../../core/object3DLogic';
import { transformLogic } from '../../core/transformLogic';
import { SkeletonComponent } from './SkeletonComponent';

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
    return logic<SkeletonComponentLogic>(skeleton);
}

// 注册到 componentLogic 分发表
registerComponentLogic('SkeletonComponent', (component) =>
{
    return skeletonComponentLogic(component as SkeletonComponent);
});
