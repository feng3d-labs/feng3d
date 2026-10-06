import { Renderable, RenderableLogic, createRenderableLogicBase } from '../../core/Renderable';
import type { RenderObject, RenderPipeline } from '@feng3d/webgpu';
import { registerLogic, reactive, UnReadonly } from '@feng3d/reactivity';
import type { CustomGeometry } from '../../geometry/CustomGeometry';
import { standardMorphVertexWGSL, standardVertexWGSL } from '../../materials/standardVertexShader';
import { MORPH_TARGET_COUNT } from '../../shaders/tsl/morph';

declare module '../../component/Component'
{
    export interface ComponentMap
    {
        MorphMeshRenderer: MorphMeshRenderer;
    }
}

/**
 * MorphMeshRenderer（纯数据接口）。
 *
 * 与 `MeshRenderer` 的差别只有一处：几何带 `morphTargets` 时，顶点着色器换成 morph 变体、
 * 并把 morph delta 与权重送进 GPU。
 */
export interface MorphMeshRenderer extends Renderable
{
    readonly __type__: 'MorphMeshRenderer';
}

declare module '@feng3d/reactivity'
{
    interface LogicMap
    {
        MorphMeshRenderer: MorphMeshRendererLogic;
    }
}

/**
 * MorphMeshRenderer 逻辑接口（继承 RenderableLogic，覆写 beforeRender）。
 */
export interface MorphMeshRendererLogic extends RenderableLogic
{
}

/**
 * 工厂函数：MorphMeshRendererLogic 的唯一创建入口（registerLogic 注册它）。
 *
 * @param data 组件数据（raw）
 */
export function morphMeshRendererLogic(data: MorphMeshRenderer): MorphMeshRendererLogic
{
    const { members } = createRenderableLogicBase(data);

    /** init 去重标志（同一 component 只初始化一次） */
    let subInited = false;

    /**
     * morph 顶点着色器变体的管线缓存。
     *
     * 与 `SkinnedMeshRenderer` 同样的理由：`WGPURenderPipeline` 以管线对象引用为缓存键，
     * 每次 beforeRender 新建对象会让 GPU 管线反复重建，所以保持稳定引用。
     */
    const morphPipelines = new WeakMap<RenderPipeline, RenderPipeline>();

    /** 取（或惰性创建）morph 管线变体 */
    function morphPipeline(source: RenderPipeline): RenderPipeline
    {
        let pipeline = morphPipelines.get(source);
        if (!pipeline)
        {
            pipeline = { ...source, vertex: { ...source.vertex, wgsl: standardMorphVertexWGSL } };
            morphPipelines.set(source, pipeline);
        }

        return pipeline;
    }

    const logic: MorphMeshRendererLogic = {
        get component() { return members.component; },
        get entity() { return members.entity; },
        get isVisibleAndEnabled() { return members.isVisibleAndEnabled; },
        get lightPicker() { return members.lightPicker; },
        get renderObject() { return members.renderObject; },
        get selfLocalBounds() { return members.selfLocalBounds; },
        get selfWorldBounds() { return members.selfWorldBounds; },
        get isLoaded() { return members.isLoaded; },
        baseBeforeRender(renderObject) { members.baseBeforeRender(renderObject); },
        init(object3D)
        {
            if (subInited) return;
            subInited = true;
            members.init(object3D);
        },
        /**
         * 渲染前回调：先走基类分发，再把 morph 数据写进 binding、把顶点着色器换成 morph 变体。
         */
        beforeRender(renderObject)
        {
            members.baseBeforeRender(renderObject);

            const bindingResources = renderObject.bindingResources;
            if (!bindingResources) return;

            const geometry = data.geometry as CustomGeometry | undefined;
            const morphTargets = geometry?.morphTargets ?? [];
            const vertexCount = Math.floor((geometry?.positions?.length ?? 0) / 3);

            // 1) delta → storage buffer：按 target 分行，每顶点一个 vec4（xyz = delta，w 补 0）
            const positions = new Float32Array(MORPH_TARGET_COUNT * vertexCount * 4);
            const targetCount = Math.min(morphTargets.length, MORPH_TARGET_COUNT);
            for (let t = 0; t < targetCount; t++)
            {
                const target = morphTargets[t];
                for (let v = 0; v < vertexCount; v++)
                {
                    const base = (t * vertexCount + v) * 4;
                    positions[base] = target[v * 3] ?? 0;
                    positions[base + 1] = target[v * 3 + 1] ?? 0;
                    positions[base + 2] = target[v * 3 + 2] ?? 0;
                }
            }
            reactive(bindingResources).u_morphPositions = { __type__: 'BufferBinding', bufferView: positions } as never;

            // 2) 权重与顶点数 → uniform（权重补齐到 MORPH_TARGET_COUNT，不足为 0）
            const weights = new Float32Array(MORPH_TARGET_COUNT);
            const source = data.morphWeights ?? [];
            for (let i = 0; i < MORPH_TARGET_COUNT; i++) weights[i] = source[i] ?? 0;
            reactive(bindingResources).morph = { value: { u_morphWeights: weights, u_morphVertexCount: vertexCount } } as never;

            // 3) 顶点着色器换装成 morph 变体：只认标准材质顶点着色器（其他材质暂无 morph 变体）
            const sourcePipeline = renderObject.pipeline;
            if (sourcePipeline?.vertex?.wgsl === standardVertexWGSL)
            {
                (renderObject as UnReadonly<RenderObject>).pipeline = morphPipeline(sourcePipeline);
            }
        },
        update(interval) { members.update(interval); },
        localRayIntersection(localRay) { return members.localRayIntersection(localRay); },
        worldRayIntersection(worldRay) { return members.worldRayIntersection(worldRay); },
        dispose() { members.dispose(); },
    };

    return logic;
}

// 注册到 logic 分发表
registerLogic('MorphMeshRenderer', morphMeshRendererLogic);
