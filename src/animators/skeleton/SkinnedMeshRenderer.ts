import { Renderable, createRenderable } from '../../core/Renderable';
import type { BufferBinding, RenderObject } from '@feng3d/webgpu';
import { registerLogic, reactive } from "@feng3d/reactivity";
import { Matrix4x4 } from '@feng3d/math';
import { getComponentInParent } from '../../component/componentQuery';
import type { Camera } from '../../cameras/Camera';
import type { Scene } from '../../scene/Scene';
import { HideFlags } from '../../core/HideFlags';
import { renderableLogic, RenderableLogic } from '../../core/Renderable';
import { skeletonComponentLogic } from './SkeletonComponent'
import type { SkeletonComponent } from './SkeletonComponent';

import './SkinnedMeshRenderer';

declare module '../../component/Component'
{
    export interface ComponentMap
    {
        SkinnedMeshRenderer: SkinnedMeshRenderer;
    }
}

declare module '@feng3d/webgpu'
{
    export interface BindingResources
    {
        skinned: BufferBinding<any>;
    }
}

/**
 * SkinnedMeshRenderer（纯数据接口）。
 */
export interface SkinnedMeshRenderer extends Renderable
{
    readonly __type__: 'SkinnedMeshRenderer';
}

/**
 * 创建 SkinnedMeshRenderer 实例。
 */
export function createSkinnedMeshRenderer(): SkinnedMeshRenderer
{
    return {
        ...createRenderable(), __type__: 'SkinnedMeshRenderer'
    };
}

declare module '@feng3d/reactivity'
{
    interface LogicMap
    {
        SkinnedMeshRenderer: RenderableLogic;
    }
}

/**
 * SkinnedMeshRenderer 逻辑处理输出。
 *
 * 组合 renderableLogic，额外：
 * - init: 设置 hideFlags = DontTransform
 * - beforeRender: 调用基类 beforeRender 后写入骨架 uniform
 */
export function skinnedMeshRendererLogic(skinnedMeshRenderer: SkinnedMeshRenderer)
{
    const base = renderableLogic(skinnedMeshRenderer);
    let _inited = false;

    const logic = {
        ...base,
        init()
        {
            if (_inited) return;
            _inited = true;
            base.init();
        },
        beforeRender(renderObject: RenderObject, scene: Scene | null, camera: Camera | null)
        {
            base.baseBeforeRender(renderObject, scene, camera);

            const skinnedUniforms = ((renderObject.bindingResources as any).skinned ||= { value: {} as SkinnedUniforms }).value;

            skinnedUniforms.u_skeletonGlobalMatriices = getSkeletonGlobalMatriices();
        },
    };

    function getSkeletonGlobalMatriices(): Matrix4x4[]
    {
        const skeletonComponent = getComponentInParent(base.object3D, 'SkeletonComponent') as any;

        if (skeletonComponent)
        {
            return skeletonComponentLogic(skeletonComponent).globalMatrices;
        }

        return defaultSkeletonGlobalMatriices;
    }

    return logic;
}

const defaultSkeletonGlobalMatriices: Matrix4x4[] = (() =>
{
    const v = [new Matrix4x4()]; let i = 150; while (i-- > 1) v.push(v[0]);

    return v;
})();

// 注册到 componentLogic 分发表
registerLogic('SkinnedMeshRenderer', (component) =>
{
    return skinnedMeshRendererLogic(component as SkinnedMeshRenderer) as any;
});
