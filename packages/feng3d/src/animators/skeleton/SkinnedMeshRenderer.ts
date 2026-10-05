import { Renderable, RenderableLogic, createRenderableLogicBase } from '../../core/Renderable';
import type { RenderObject, RenderPipeline } from '@feng3d/webgpu';
import { registerLogic, logic as getLogic, reactive, UnReadonly } from '@feng3d/reactivity';
import { mat4Identity, Matrix4x4 } from '@feng3d/math';
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
 * SkinnedMeshRenderer 逻辑接口。
 *
 * 继承 RenderableLogic，额外：
 * - beforeRender: 调用 baseBeforeRender 后写入骨架 uniform，并把顶点着色器换成蒙皮变体
 *   （`standardSkinnedVertexWGSL`，issue #337）
 */
export interface SkinnedMeshRendererLogic extends RenderableLogic
{
}

/**
 * 工厂函数：SkinnedMeshRendererLogic 的唯一创建入口（registerLogic 注册它）。
 *
 * @param data 组件数据（raw）
 */
export function skinnedMeshRendererLogic(data: SkinnedMeshRenderer): SkinnedMeshRendererLogic
{
    const { members } = createRenderableLogicBase(data);

    /** init 去重标志（同一 component 只初始化一次） */
    let subInited = false;

    /**
     * 蒙皮顶点着色器变体的管线缓存（按材质原始管线对象缓存）。
     *
     * `WGPURenderPipeline` 以管线对象引用为缓存键，若每次 beforeRender 都新建对象会导致
     * GPU 管线反复重建，所以这里保持稳定引用（同一材质管线 → 同一蒙皮管线）。
     */
    const skinnedPipelines = new WeakMap<RenderPipeline, RenderPipeline>();

    function getSkeletonGlobalMatriices(): Matrix4x4[]
    {
        const skeletonComponent = getLogic(members.entity as Object3D).getComponentInParent<Skeleton>('Skeleton');

        if (skeletonComponent)
        {
            return getLogic(skeletonComponent).globalMatrices;
        }

        return defaultSkeletonGlobalMatriices;
    }

    /** 取（或惰性创建）蒙皮管线变体 */
    function skinnedPipeline(source: RenderPipeline): RenderPipeline
    {
        let pipeline = skinnedPipelines.get(source);
        if (!pipeline)
        {
            pipeline = { ...source, vertex: { ...source.vertex, wgsl: standardSkinnedVertexWGSL } };
            skinnedPipelines.set(source, pipeline);
        }

        return pipeline;
    }

    const logic: SkinnedMeshRendererLogic = {
        get component() { return members.component; },
        get entity() { return members.entity; },
        get isVisibleAndEnabled() { return members.isVisibleAndEnabled; },
        /** 光源拾取器（init 时创建，持有引用防止被 GC） */
        get lightPicker() { return members.lightPicker; },
        /** 渲染对象（computed，依赖 transform 与组件） */
        get renderObject() { return members.renderObject; },
        /** 自身局部包围盒 */
        get selfLocalBounds() { return members.selfLocalBounds; },
        /** 自身世界包围盒 */
        get selfWorldBounds() { return members.selfWorldBounds; },
        /** 是否加载完成 */
        get isLoaded() { return members.isLoaded; },
        /** 基类 beforeRender（子类 logic 可调用后再追加自身逻辑） */
        baseBeforeRender(renderObject) { members.baseBeforeRender(renderObject); },
        init(object3D)
        {
            if (subInited) return;
            subInited = true;
            members.init(object3D);
        },
        /** 渲染前回调：先走基类分发，再写入蒙皮 uniform 并换装顶点着色器 */
        beforeRender(renderObject)
        {
            members.baseBeforeRender(renderObject);

            const bindingResources = renderObject.bindingResources;
            const skinnedBinding = bindingResources && (bindingResources.skinned ||= { value: {} });
            if (!skinnedBinding) return;
            const r_skinnedUniforms = reactive(skinnedBinding.value as SkinnedUniforms);

            // 每帧新建数组：骨骼姿势是就地更新矩阵对象，换新数组才能可靠驱动 uniform 重新上传
            r_skinnedUniforms.u_skeletonGlobalMatriices = padSkeletonMatriices(getSkeletonGlobalMatriices());

            // 顶点着色器换装成蒙皮变体：只认标准材质顶点着色器（其他材质暂无蒙皮变体）。
            // 换装后顶点布局会自动带上 a_skinIndices 等属性——顶点布局按 WGSL 入口的输入反射
            // 匹配 Geometry 的顶点属性表（见 WGPUVertexBufferLayout）。
            const sourcePipeline = renderObject.pipeline;
            if (sourcePipeline?.vertex?.wgsl === standardVertexWGSL)
            {
                (renderObject as UnReadonly<RenderObject>).pipeline = skinnedPipeline(sourcePipeline);
            }
        },
        /** 每帧更新（委托 Behaviour 基类） */
        update(interval) { members.update(interval); },
        /** 与局部空间射线相交 */
        localRayIntersection(localRay) { return members.localRayIntersection(localRay); },
        /** 与世界空间射线相交 */
        worldRayIntersection(worldRay) { return members.worldRayIntersection(worldRay); },
        /** 释放：委托基类 */
        dispose() { members.dispose(); },
    };

    return logic;
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
registerLogic('SkinnedMeshRenderer', skinnedMeshRendererLogic);
