import { Renderable } from '../../core/Renderable';
import type { RenderObject } from '@feng3d/webgpu';
import { registerLogic, logic as getLogic, reactive } from "@feng3d/reactivity";
import { Matrix4x4 } from '@feng3d/math';
import { RenderableLogic } from '../../core/Renderable';
import type { Object3D } from '../../core/Object3D';
import type { Skeleton } from './Skeleton';
// 引入全局 uniform 类型定义（SkinnedUniforms 通过 declare global 声明）
import '../../render/data/Uniform';


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
 * SkinnedMeshRenderer 逻辑类。
 *
 * 继承 RenderableLogic，额外：
 * - beforeRender: 调用 baseBeforeRender 后写入骨架 uniform
 */
export class SkinnedMeshRendererLogic extends RenderableLogic
{
    /** init 去重标志（同一 component 只初始化一次） */
    #subInited = false;

    protected constructor(data: SkinnedMeshRenderer)
    {
        super(data);
    }

    /** 内部创建入口（protected constructor 的唯一出口） */
    static create(data: SkinnedMeshRenderer): SkinnedMeshRendererLogic
    {
        return new SkinnedMeshRendererLogic(data);
    }

    #getSkeletonGlobalMatriices(): Matrix4x4[]
    {
        const skeletonComponent = getLogic(this.entity as Object3D).getComponentInParent<Skeleton>('Skeleton');

        if (skeletonComponent)
        {
            return getLogic(skeletonComponent).globalMatrices;
        }

        return defaultSkeletonGlobalMatriices;
    }

    override init(object3D?: Object3D): void
    {
        if (this.#subInited) return;
        this.#subInited = true;
        super.init(object3D);
    }

    override beforeRender(renderObject: RenderObject): void
    {
        this.baseBeforeRender(renderObject);

        const bindingResources = renderObject.bindingResources;
        const skinnedBinding = bindingResources && (bindingResources.skinned ||= { value: {} });
        if (!skinnedBinding) return;
        const r_skinnedUniforms = reactive(skinnedBinding.value);

        r_skinnedUniforms.u_skeletonGlobalMatriices = this.#getSkeletonGlobalMatriices();
    }
}
const defaultSkeletonGlobalMatriices: Matrix4x4[] = (() =>
{
    const v = [new Matrix4x4()]; let i = 150; while (i-- > 1) v.push(v[0]);

    return v;
})();

// 注册到 logic 分发表
registerLogic('SkinnedMeshRenderer', SkinnedMeshRendererLogic as unknown as new (data: SkinnedMeshRenderer) => SkinnedMeshRendererLogic);
