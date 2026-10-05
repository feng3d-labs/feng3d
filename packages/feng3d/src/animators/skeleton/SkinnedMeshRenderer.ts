import { Renderable } from '../../core/Renderable';
import type { RenderObject, RenderPipeline } from '@feng3d/webgpu';
import { registerLogic, logic as getLogic, reactive, UnReadonly } from '@feng3d/reactivity';
import { mat4Identity, Matrix4x4 } from '@feng3d/math';
import { RenderableLogic } from '../../core/Renderable';
import type { Object3D } from '../../core/Object3D';
import { standardSkinnedVertexWGSL, standardVertexWGSL } from '../../materials/standardVertexShader';
import { SKIN_MATRIX_COUNT } from '../../shaders/modules/skeleton.wgsl';
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
 * - beforeRender: 调用 baseBeforeRender 后写入骨架 uniform，并把顶点着色器换成蒙皮变体
 *   （`standardSkinnedVertexWGSL`，issue #337）
 */
export class SkinnedMeshRendererLogic extends RenderableLogic
{
    /** init 去重标志（同一 component 只初始化一次） */
    #subInited = false;

    /**
     * 蒙皮顶点着色器变体的管线缓存（按材质原始管线对象缓存）。
     *
     * `WGPURenderPipeline` 以管线对象引用为缓存键，若每次 beforeRender 都新建对象会导致
     * GPU 管线反复重建，所以这里保持稳定引用（同一材质管线 → 同一蒙皮管线）。
     */
    readonly #skinnedPipelines = new WeakMap<RenderPipeline, RenderPipeline>();

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
        const r_skinnedUniforms = reactive(skinnedBinding.value as SkinnedUniforms);

        // 每帧新建数组：骨骼姿势是就地更新矩阵对象，换新数组才能可靠驱动 uniform 重新上传
        r_skinnedUniforms.u_skeletonGlobalMatriices = padSkeletonMatriices(this.#getSkeletonGlobalMatriices());

        // 顶点着色器换装成蒙皮变体：只认标准材质顶点着色器（其他材质暂无蒙皮变体）。
        // 换装后顶点布局会自动带上 a_skinIndices 等属性——顶点布局按 WGSL 入口的输入反射
        // 匹配 Geometry 的顶点属性表（见 WGPUVertexBufferLayout）。
        const sourcePipeline = renderObject.pipeline;
        if (sourcePipeline?.vertex?.wgsl === standardVertexWGSL)
        {
            (renderObject as UnReadonly<RenderObject>).pipeline = this.#skinnedPipeline(sourcePipeline);
        }
    }

    /** 取（或惰性创建）蒙皮管线变体 */
    #skinnedPipeline(source: RenderPipeline): RenderPipeline
    {
        let pipeline = this.#skinnedPipelines.get(source);
        if (!pipeline)
        {
            pipeline = { ...source, vertex: { ...source.vertex, wgsl: standardSkinnedVertexWGSL } };
            this.#skinnedPipelines.set(source, pipeline);
        }

        return pipeline;
    }
}
const defaultSkeletonGlobalMatriices: Matrix4x4[] = (() =>
{
    // 阶段 C-e：`Matrix4x4` 的 class 已删除，单位矩阵改成「纯数据字面量 + 判别字段」
    const v = [{ __type__: 'Matrix4x4' as const, ...mat4Identity() }]; let i = 150; while (i-- > 1) v.push(v[0]);

    return v;
})();

/**
 * 把骨骼矩阵补齐到 WGSL 固定数组长度 {@link SKIN_MATRIX_COUNT}。
 *
 * WGSL 里 `array<mat4x4<f32>, N>` 的长度必须是编译期常量，而骨骼数是运行时数据；
 * 数据侧补齐后着色器索引不会越界（不足的槽位用单位矩阵占位）。
 * 超出上限的骨骼被截断——glTF 模型骨骼数通常远小于上限。
 */
function padSkeletonMatriices(matrices: Matrix4x4[]): Matrix4x4[]
{
    const result: Matrix4x4[] = new Array(SKIN_MATRIX_COUNT);
    for (let i = 0; i < SKIN_MATRIX_COUNT; i++)
    {
        result[i] = matrices[i] ?? defaultSkeletonGlobalMatriices[0];
    }

    return result;
}

// 注册到 logic 分发表
registerLogic('SkinnedMeshRenderer', SkinnedMeshRendererLogic.create);
