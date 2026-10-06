declare module '@feng3d/reactivity'
{
    interface LogicMap
    {
        ProjectedShadowMaterial: MaterialLogic;
    }
}

import type { Matrix4x4 } from '@feng3d/math';
import { reactive, registerLogic } from '@feng3d/reactivity';
import { RenderPipeline } from '@feng3d/webgpu';
import type { Color4 } from '../core/Color4';
import { getProjectedShadowShaderWGSL } from '../shaders/tsl/projectedShadowMaterial';
import { Material, MaterialLogic, materialLogic, writeMaterialBase } from './Material';

declare module './Material'
{
    export interface MaterialMap
    {
        ProjectedShadowMaterial: ProjectedShadowMaterial;
    }
}

/**
 * 平面投影阴影材质的默认阴影矩阵（单位矩阵：不做投影）。
 *
 * 未显式提供 u_shadowMatrix 时使用——此时阴影网格按原几何体位置绘制，
 * 便于在调试中看出"矩阵没传"而不是静默消失。
 */
const DEFAULT_SHADOW_MATRIX: Matrix4x4 = {
    __type__: 'Matrix4x4',
    elements: [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1],
};

/** 默认阴影颜色（黑） */
const DEFAULT_SHADOW_COLOR: Color4 = { __type__: 'Color4', r: 0, g: 0, b: 0, a: 1 };

/** 默认阴影不透明度（与 three.js ShadowMesh 的 MeshBasicMaterial.opacity 一致） */
const DEFAULT_SHADOW_OPACITY = 0.6;

/**
 * ProjectedShadowMaterial uniforms。
 */
export interface ProjectedShadowUniforms
{
    /**
     * 平面投影矩阵（世界空间：把投射体世界坐标投到地面平面）。
     *
     * 与 three.js ShadowMesh.update 里算出的 \`_shadowMatrix\` 逐元素一致（列主序），
     * 由调用方在投射体变换/光源变化时更新（见 examples/src/three.js/webgl_shadowmesh.ts）。
     */
    readonly u_shadowMatrix?: Matrix4x4;
    /** 阴影颜色（默认黑，对应 three.js ShadowMesh 的 MeshBasicMaterial.color） */
    readonly u_color?: Color4;
    /** 阴影不透明度（默认 0.6，对应 three.js ShadowMesh 的 MeshBasicMaterial.opacity） */
    readonly u_opacity?: number;
}

/**
 * 平面投影阴影材质（纯数据接口）。
 *
 * 复刻 three.js 的 ShadowMesh 材质：纯色 + 半透明 + 不写深度 +
 * **模板测试（compare: equal / passOp: increment-clamp）**，使同一像素被同一阴影网格的
 * 重叠三角形多次覆盖时只混合一次（three.js 用 stencilWrite/stencilZPass 达到同一目的）。
 *
 * 该材质 \`isTransparent\` 恒为 true —— 因此不参与实时阴影投射（Scene.getPickByDirectionalLight
 * 会跳过透明材质），也不会被主 Pass 之外的阴影 Pass 收集。
 */
export interface ProjectedShadowMaterial extends Material
{
    readonly __type__: 'ProjectedShadowMaterial';
    readonly uniforms?: ProjectedShadowUniforms;
}

/**
 * ProjectedShadowMaterial 逻辑类。
 */
export interface ProjectedShadowMaterialLogic extends MaterialLogic
{
}

/**
 * 工厂函数：ProjectedShadowMaterialLogic 的唯一创建入口（registerLogic 注册它）。
 *
 * @param data 材质数据（raw）
 */
export function projectedShadowMaterialLogic(data: ProjectedShadowMaterial): ProjectedShadowMaterialLogic
{
    // 默认值 accessor：逐字段补齐（不能只判断 uniforms 整体是否存在——调用方可能只声明了部分字段）
    const r_material = reactive(data);
    const uniforms = () =>
    {
        const userUniforms = r_material.uniforms;

        return {
            u_shadowMatrix: userUniforms?.u_shadowMatrix ?? DEFAULT_SHADOW_MATRIX,
            u_color: userUniforms?.u_color ?? DEFAULT_SHADOW_COLOR,
            u_opacity: userUniforms?.u_opacity ?? DEFAULT_SHADOW_OPACITY,
        };
    };

    // TSL 构建的着色器（首次调用时构建并缓存，见 shaders/tsl/projectedShadowMaterial.ts）
    const shaderWGSL = getProjectedShadowShaderWGSL();

    const renderPipeline = reactive({
        vertex: { wgsl: shaderWGSL.vertex },
        fragment: {
            wgsl: shaderWGSL.fragment,
            targets: [{
                // 标准 alpha 混合：src * srcAlpha + dst * (1 - srcAlpha)
                blend: {
                    color: { operation: 'add', srcFactor: 'src-alpha', dstFactor: 'one-minus-src-alpha' },
                    alpha: { operation: 'add', srcFactor: 'one', dstFactor: 'one-minus-src-alpha' },
                },
            }],
        },
        primitive: { topology: 'triangle-list', cullFace: 'back', frontFace: 'ccw' },
        depthStencil: {
            // three.js：depthWrite: false（不写深度，避免阴影互相遮挡/挡住物体）
            depthWriteEnabled: false,
            depthCompare: 'less',
            // three.js：stencilWrite: true / stencilFunc: EqualStencilFunc / stencilRef: 0
            // / stencilZPass: IncrementStencilOp —— 每个像素只混合一次
            stencilFront: { compare: 'equal', failOp: 'keep', depthFailOp: 'keep', passOp: 'increment-clamp' },
            stencilBack: { compare: 'equal', failOp: 'keep', depthFailOp: 'keep', passOp: 'increment-clamp' },
            stencilReference: 0,
            stencilReadMask: 0xff,
            stencilWriteMask: 0xff,
        },
    }) as RenderPipeline;

    // 组合基类工厂：未覆写的成员显式委托（不要用 ...base 展开——会把 getter 立刻求值）
    const base = materialLogic(data);

    const logic: ProjectedShadowMaterialLogic = {
        // 恒为透明：进入透明渲染队列（在不透明物体之后绘制）
        get isTransparent() { return true; },
        get isPrimitivesTopology() { return base.isPrimitivesTopology; },
        get isLoaded() { return base.isLoaded; },
        beforeRender(renderObject) { writeMaterialBase(renderObject, renderPipeline, uniforms); },
    };

    return logic;
}

// 注册到 logic 分发表
registerLogic('ProjectedShadowMaterial', projectedShadowMaterialLogic);
