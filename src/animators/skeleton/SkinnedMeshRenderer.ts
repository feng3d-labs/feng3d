import { Renderable, createRenderable } from '../../core/Renderable';
import type { BufferBinding, RenderObject } from '@feng3d/webgpu';
import { registerLogic, logic as getLogic } from "@feng3d/reactivity";
import { Matrix4x4 } from '@feng3d/math';
import { getComponentInParent } from '../../component/componentQuery';
import type { Camera } from '../../cameras/Camera';
import type { Scene } from '../../scene/Scene';
import { RenderableLogic } from '../../core/Renderable';
import {  } from './SkeletonComponent'
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
        SkinnedMeshRenderer: SkinnedMeshRendererLogic;
    }
}

/**
 * SkinnedMeshRenderer 逻辑处理类。
 *
 * 继承 RenderableLogic，额外：
 * - beforeRender: 调用 super.baseBeforeRender 后写入骨架 uniform
 */
export class SkinnedMeshRendererLogic extends RenderableLogic
{
    /** init 去重标志（同一 component 只初始化一次） */
    private _subInited = false;

    constructor(skinnedMeshRenderer: SkinnedMeshRenderer)
    {
        super(skinnedMeshRenderer);
    }

    init(object3D?: import('../../core/Object3D').Object3D): void
    {
        if (this._subInited) return;
        this._subInited = true;
        super.init(object3D);
    }

    beforeRender(renderObject: RenderObject, scene: Scene | null, camera: Camera | null): void
    {
        super.baseBeforeRender(renderObject, scene, camera);

        const skinnedUniforms = ((renderObject.bindingResources as any).skinned ||= { value: {} as SkinnedUniforms }).value;

        skinnedUniforms.u_skeletonGlobalMatriices = this.getSkeletonGlobalMatriices();
    }

    private getSkeletonGlobalMatriices(): Matrix4x4[]
    {
        const skeletonComponent = getComponentInParent(this.object3D, 'SkeletonComponent') as any;

        if (skeletonComponent)
        {
            return getLogic(skeletonComponent).globalMatrices;
        }

        return defaultSkeletonGlobalMatriices;
    }
}
const defaultSkeletonGlobalMatriices: Matrix4x4[] = (() =>
{
    const v = [new Matrix4x4()]; let i = 150; while (i-- > 1) v.push(v[0]);

    return v;
})();

// 注册到 componentLogic 分发表
registerLogic('SkinnedMeshRenderer', (component) =>
{
    return new SkinnedMeshRendererLogic(component as SkinnedMeshRenderer);
});
