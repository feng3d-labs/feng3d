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

const skeletonComponentLogicMap = new WeakMap<SkeletonComponent, SkeletonComponentLogic>();

/**
 * 获取 SkeletonComponent 的 logic。
 */
export function skeletonComponentLogic(skeleton: SkeletonComponent): SkeletonComponentLogic
{
    let logic = skeletonComponentLogicMap.get(skeleton);
    if (logic) return logic;

    let _globalMatrices: Matrix4x4[] = [];

    logic = {
        object3D: null as any,
        init() { /* no-op */ },
        beforeRender() { /* no-op */ },
        get globalMatrices()
        {
            for (let i = 0; i < skeleton.boneNames.length; i++)
            {
                const jointGameobject = findObject3DChild(logic.object3D, skeleton.boneNames[i]);

                _globalMatrices[i] = _globalMatrices[i] || new Matrix4x4();
                _globalMatrices[i].copy(transformLogic(jointGameobject).local2world.value).prepend(skeleton.boneInverses[i]);
            }

            return _globalMatrices;
        },
        dispose()
        {
            _globalMatrices = [];
            skeletonComponentLogicMap.delete(skeleton);
        },
    };

    skeletonComponentLogicMap.set(skeleton, logic);

    return logic;
}

// 注册到 componentLogic 分发表
registerComponentLogic('SkeletonComponent', (component) =>
{
    return skeletonComponentLogic(component as SkeletonComponent);
});
