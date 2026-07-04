import { Matrix4x4 } from '@feng3d/math';
import { decoratorRegisterClass } from '@feng3d/polyfill';
import { Component, RegisterComponent } from '../../component/Component';

// 触发 skeletonComponentLogic 注册到 componentLogic 分发表
export { skeletonComponentLogic } from './skeletonComponentLogic';

declare global
{
    export interface MixinsComponentMap
    {
        SkeletonComponent: SkeletonComponent;
    }
}

/**
 * 骨骼组件（纯数据）。
 *
 * 骨骼姿势全局矩阵计算由 {@link skeletonComponentLogic} 提供。
 */
@RegisterComponent()
@decoratorRegisterClass()
export class SkeletonComponent extends Component
{
    __class__: 'SkeletonComponent';

    /**
     * 骨骼蒙皮时逆矩阵列表。
     */
    boneInverses: Matrix4x4[];

    /**
     * 骨骼名称列表
     */
    boneNames: string[];
}
