import { Renderable, renderableLogic } from '../../core/Renderable';
import type { BindingResource, RenderObject } from '@feng3d/webgpu';
import { registerLogic, logic as getLogic } from "@feng3d/reactivity";
import { Matrix4x4 } from '@feng3d/math';
import type { Camera } from '../../cameras/Camera';
import type { Scene } from '../../scene/Scene';
import type { RenderableLogic } from '../../core/Renderable';
import type { Object3D } from '../../core/Object3D';
import type { Skeleton } from './Skeleton';
// 引入全局 uniform 类型定义（SkinnedUniforms 通过 declare global 声明）
import '../../render/data/Uniform';

import './SkinnedMeshRenderer';

declare module '../../component/Component'
{
    export interface ComponentMap
    {
        SkinnedMeshRenderer: SkinnedMeshRenderer;
    }
}

/**
 * SkinnedMeshRenderer（纯数据接口）。
 */
export interface SkinnedMeshRenderer extends Renderable
{
    readonly __type__: 'SkinnedMeshRenderer';
}

declare module '@feng3d/reactivity'
{
    interface LogicMap
    {
        SkinnedMeshRenderer: SkinnedMeshRendererLogic;
    }
}

/**
 * SkinnedMeshRenderer 逻辑处理接口。
 *
 * 组合 RenderableLogic，额外：
 * - beforeRender: 调用 base.baseBeforeRender 后写入骨架 uniform
 */
export interface SkinnedMeshRendererLogic extends RenderableLogic
{
}

/**
 * 创建 SkinnedMeshRendererLogic 实例（工厂函数，组合 renderableLogic 基础行为）。
 */
export function skinnedMeshRendererLogic(skinnedMeshRenderer: SkinnedMeshRenderer): SkinnedMeshRendererLogic
{
    const base = renderableLogic(skinnedMeshRenderer);

    /** init 去重标志（同一 component 只初始化一次） */
    let _subInited = false;

    function getSkeletonGlobalMatriices(): Matrix4x4[]
    {
        const skeletonComponent = getLogic(base.entity).getComponentInParent<Skeleton>('Skeleton');

        if (skeletonComponent)
        {
            return getLogic(skeletonComponent).globalMatrices;
        }

        return defaultSkeletonGlobalMatriices;
    }

    // 捕获基类方法，避免 Object.assign 覆盖后再调用 base.init 导致递归
    const baseInit = base.init;

    return Object.assign(base, {
        init(object3D?: Object3D): void
        {
            if (_subInited) return;
            _subInited = true;
            baseInit(object3D);
        },
        beforeRender(renderObject: RenderObject, scene: Scene | null, camera: Camera | null): void
        {
            base.baseBeforeRender(renderObject, scene, camera);

            const bindingResources = renderObject.bindingResources as Record<string, BindingResource> | undefined;
            const skinnedBinding = (bindingResources && (bindingResources.skinned ||= { value: {} as SkinnedUniforms })) as { value: SkinnedUniforms } | undefined;
            if (!skinnedBinding) return;
            const skinnedUniforms = skinnedBinding.value;

            skinnedUniforms.u_skeletonGlobalMatriices = getSkeletonGlobalMatriices();
        },
    }) as unknown as SkinnedMeshRendererLogic;
}
const defaultSkeletonGlobalMatriices: Matrix4x4[] = (() =>
{
    const v = [new Matrix4x4()]; let i = 150; while (i-- > 1) v.push(v[0]);

    return v;
})();

// 注册到 componentLogic 分发表
registerLogic('SkinnedMeshRenderer', skinnedMeshRendererLogic);
