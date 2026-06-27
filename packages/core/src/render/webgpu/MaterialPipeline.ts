import { Attribute } from '../data/Attribute';
import { CullFace as RendererCullFace } from '../data/enums';
import { RenderParams } from '../data/RenderParams';
import {
    BlendComponent,
    BlendState,
    BufferBinding,
    DepthStencilState,
    PrimitiveState,
    RenderObject,
    RenderPipeline,
    Sampler,
    VertexAttribute,
    VertexAttributes,
    VertexFormat,
} from '@feng3d/webgpu';
import { Geometry } from '../../geometry/Geometry';
import { TextureInfo } from '../data/TextureInfo';
import { Texture2D } from '../../textures/Texture2D';
import { TextureCube } from '../../textures/TextureCube';

/**
 * core 材质 uniform 对象类型（等价于 `UniformsLike`，在此局部定义以避免与 `Material` 循环依赖）。
 *
 * 不导出，仅本模块内部使用。
 */
type UniformsLike = Record<string, unknown>;

/**
 * core 顶点属性名（如 `a_position`）→ WGSL `@location(N)` 形参名（如 `position`）的统一映射。
 *
 * core 的几何体属性名统一带 `a_` 前缀，WGSL 着色器统一使用无前缀名。
 * 某个 shader 不使用某属性时不会出错：WebGPU 顶点缓冲布局根据着色器反射
 * （见 `WGPUVertexBufferLayout`）按名匹配，多余属性自动忽略。
 */
const vertexAttributeMap: { [coreName: string]: string } = {
    a_position: 'position',
    a_color: 'color',
    a_uv: 'uv',
    a_normal: 'normal',
    a_tangent: 'tangent',
    a_skinIndices: 'skinIndices',
    a_skinWeights: 'skinWeights',
    a_skinIndices1: 'skinIndices1',
    a_skinWeights1: 'skinWeights1',
};

/**
 * WGSL 着色器与材质配置描述。
 *
 * 描述一个 core 材质 shader 对应的 WebGPU 渲染数据：
 * - 顶点着色器 WGSL 源码
 * - 片段着色器 WGSL 源码
 * - uniforms 工厂（创建该 shader 的默认 uniform 对象）
 * - 渲染状态（cullFace/blend/topology 等，隐含于材质中）
 */
export interface WGSLShaderAsset
{
    /**
     * 顶点着色器 WGSL 源码。
     */
    vertex: string;

    /**
     * 片段着色器 WGSL 源码。
     */
    fragment: string;

    /**
     * uniforms 工厂函数，创建该 shader 的默认 uniform 对象。
     *
     * Material 按 shaderName 查询此工厂来实例化 uniforms。
     */
    uniformsFactory?: () => Record<string, unknown>;

    /**
     * 渲染状态（渲染参数隐含于材质）。
     *
     * 使用 webgpu 小写值，由 buildRenderPipeline 直接使用，无需 GL→webgpu 映射。
     */
    renderState?: RenderState;
}

/**
 * 渲染状态（材质的渲染管线配置）。
 *
 * 值使用 webgpu 小写形式（与 webgpu 包的 PrimitiveState/DepthStencilState/BlendState 一致），
 * 由 {@link buildRenderPipeline} 直接使用。
 * 仅包含活跃字段（原 RenderParams 的 15 个无引用字段如 stencil 已移除）。
 */
export interface RenderState
{
    /** 图元拓扑。 */
    topology?: 'point-list' | 'line-list' | 'line-strip' | 'triangle-list' | 'triangle-strip';
    /** 剔除面。 */
    cullFace?: 'none' | 'front' | 'back';
    /** 正面方向。 */
    frontFace?: 'ccw' | 'cw';
    /** 是否开启混合。 */
    enableBlend?: boolean;
    /** 源混合因子。 */
    blendSrc?: BlendComponent['srcFactor'];
    /** 目标混合因子。 */
    blendDst?: BlendComponent['dstFactor'];
    /** 混合操作。 */
    blendOperation?: BlendComponent['operation'];
    /** 是否写入深度。 */
    depthWriteEnabled?: boolean;
    /** 深度比较函数。 */
    depthCompare?: DepthStencilState['depthCompare'];
}

/**
 * 顶点属性 size → WebGPU VertexFormat 映射。
 *
 * core 的 `Attribute` 仅记录 `size`（每个顶点的分量数，1~4），类型默认 FLOAT，
 * 这里将其转换为 WebGPU 的顶点格式。
 */
function sizeToVertexFormat(size: number): VertexFormat
{
    switch (size)
    {
        case 1: return 'float32';
        case 2: return 'float32x2';
        case 3: return 'float32x3';
        case 4: return 'float32x4';
        default: return 'float32';
    }
}

/**
 * core `CullFace`（大写枚举）→ webgpu `CullFace`（小写枚举）。
 */
function mapCullFace(cullFace: string): PrimitiveState['cullFace']
{
    switch (cullFace as RendererCullFace)
    {
        case 'FRONT': return 'front';
        case 'BACK': return 'back';
        case 'FRONT_AND_BACK': return 'front'; // WebGPU 不支持 FRONT_AND_BACK，退化剔除正面
        case 'NONE':
        default: return 'none';
    }
}

/**
 * 把 core `RenderParams.renderMode` 映射为 WebGPU 图元拓扑。
 *
 * 注意：WebGPU 不支持 `LINE_LOOP` 与 `TRIANGLE_FAN`，遇到时退化到 `line-list` / `triangle-list`。
 */
function mapPrimitiveTopology(renderMode: string): PrimitiveState['topology']
{
    switch (renderMode)
    {
        case 'POINTS': return 'point-list';
        case 'LINES':
        case 'LINE_LOOP': return 'line-list';
        case 'LINE_STRIP': return 'line-strip';
        case 'TRIANGLES':
        case 'TRIANGLE_FAN': return 'triangle-list';
        case 'TRIANGLE_STRIP': return 'triangle-strip';
        default: return 'triangle-list';
    }
}

/**
 * 把 core `RenderParams` 转换为 webgpu `PrimitiveState`。
 */
export function renderParamsToPrimitiveState(renderParams: RenderParams): PrimitiveState
{
    return {
        topology: mapPrimitiveTopology(renderParams.renderMode),
        cullFace: mapCullFace(renderParams.cullFace),
        // core 默认 CW（顺时针为正面），与 webgpu 默认 ccw 不同，这里显式传递保持一致。
        frontFace: renderParams.frontFace === 'CCW' ? 'ccw' : 'cw',
    };
}

/**
 * 把 core `RenderParams` 转换为 webgpu `DepthStencilState`。
 */
export function renderParamsToDepthStencilState(renderParams: RenderParams): DepthStencilState
{
    // core 的 depthFunc 是大写枚举（如 'LESS'），webgpu 是小写（如 'less'）。
    const depthCompare = renderParams.depthtest
        ? renderParams.depthFunc.toLowerCase() as DepthStencilState['depthCompare']
        : 'always';

    return {
        depthWriteEnabled: renderParams.depthMask,
        depthCompare,
    };
}

/**
 * 把 core `RenderParams` 的混合配置转换为 webgpu `BlendState`。
 *
 * 仅当 `enableBlend` 为 true 时返回有效 BlendState，否则返回 undefined（关闭混合）。
 */
export function renderParamsToBlendState(renderParams: RenderParams): BlendState | undefined
{
    if (!renderParams.enableBlend) return undefined;

    // core 的 BlendFactor 大写（如 'SRC_ALPHA'）→ webgpu 小写连字符（如 'src-alpha'）。
    const toBlendFactor = (f: string): BlendComponent['srcFactor'] =>
        f.toLowerCase().replace(/_/g, '-') as BlendComponent['srcFactor'];

    const component: BlendComponent = {
        srcFactor: toBlendFactor(renderParams.sfactor),
        dstFactor: toBlendFactor(renderParams.dfactor),
        operation: renderParams.blendEquation === 'FUNC_ADD' ? 'add'
            : renderParams.blendEquation === 'FUNC_SUBTRACT' ? 'subtract'
                : 'reverse-subtract',
    };

    return {
        color: component,
        alpha: component,
    };
}

/**
 * WGSL 着色器注册表。
 *
 * 把 shaderName（与 core `Material.shaderName` 对应）映射到 WGSL 着色器资源。
 * 各材质模块在加载时调用 {@link registerShader} 注册自己。
 */
const shaderRegistry: Map<string, WGSLShaderAsset> = new Map();

/**
 * 注册 WGSL 着色器。
 *
 * @param shaderName shader 名称（与 core `Material.shaderName` 对应）
 * @param asset WGSL 着色器资源
 */
export function registerShader(shaderName: string, asset: WGSLShaderAsset): void
{
    shaderRegistry.set(shaderName, asset);
}

/**
 * 获取已注册的 WGSL 着色器资源。
 */
export function getShaderAsset(shaderName: string): WGSLShaderAsset | undefined
{
    return shaderRegistry.get(shaderName);
}

/**
 * 获取已注册 shader 的 uniforms 工厂。
 */
export function getUniformsFactory(shaderName: string): (() => Record<string, unknown>) | undefined
{
    return shaderRegistry.get(shaderName)?.uniformsFactory;
}

/**
 * 获取已注册 shader 的渲染状态。
 */
export function getRenderState(shaderName: string): RenderState | undefined
{
    return shaderRegistry.get(shaderName)?.renderState;
}

/**
 * 根据 core `Attribute` 构建 webgpu `VertexAttribute`。
 *
 * - data（`number[]`）转换为 `Float32Array`
 * - size 映射为 VertexFormat
 *
 * @param attribute core 顶点属性
 */
export function buildVertexAttribute(attribute: Attribute): VertexAttribute
{
    return {
        data: new Float32Array(attribute.data),
        format: sizeToVertexFormat(attribute.size),
    };
}

/**
 * 根据 core `Geometry` 构建 webgpu `VertexAttributes`。
 *
 * 使用统一的 {@link vertexAttributeMap} 做属性名映射（`a_position` → `position`），
 * 映射后键名需与 WGSL `@location(N)` 形参名一致。
 *
 * 注意：WebGPU 顶点缓冲布局根据着色器反射按名匹配（见 `WGPUVertexBufferLayout`），
 * 因此此处可以安全地提供全部属性，未被 shader 引用的属性会自动忽略。
 *
 * @param geometry core 几何体（调用前须确保几何体数据已构建，即 `geometry.positions` 可用）
 */
export function buildVertices(geometry: Geometry): VertexAttributes
{
    // 触发几何体构建，确保 _attributes 中的数据已填充
    geometry.updateGrometry();

    const attributes = (geometry as unknown as { _attributes: Record<string, Attribute> })._attributes;
    const vertices: VertexAttributes = {};

    for (const coreName in attributes)
    {
        if (!Object.prototype.hasOwnProperty.call(attributes, coreName)) continue;

        const wgslName = vertexAttributeMap[coreName];
        if (!wgslName) continue; // 未知属性，跳过

        const attr = attributes[coreName];
        if (!attr.data || attr.data.length === 0) continue;

        vertices[wgslName] = buildVertexAttribute(attr);
    }

    // 为着色器提供默认的 color 属性（如果 Geometry 没有）
    // WGSL 着色器声明 @location(4) color: vec4<f32>，必须提供
    if (!vertices.color)
    {
        // 从 position 属性计算顶点数量（position 是 vec3，每个顶点 3 个 float）
        const positionAttr = attributes.a_position || attributes.position;
        if (positionAttr && positionAttr.data && positionAttr.data.length > 0)
        {
            const vertexCount = positionAttr.data.length / positionAttr.size;
            const colorData = new Float32Array(vertexCount * 4);
            // 填充白色 (1, 1, 1, 1)
            for (let i = 0; i < vertexCount; i++)
            {
                colorData[i * 4] = 1;
                colorData[i * 4 + 1] = 1;
                colorData[i * 4 + 2] = 1;
                colorData[i * 4 + 3] = 1;
            }
            vertices.color = {
                data: colorData,
                format: 'float32x4',
            };
        }
    }

    return vertices;
}

/**
 * 从 core uniform 对象中提取纹理（Texture2D / TextureCube）字段。
 */
function extractTextures(uniforms: UniformsLike): { key: string, texture: Texture2D | TextureCube }[]
{
    const textures: { key: string, texture: Texture2D | TextureCube }[] = [];
    const record = uniforms as unknown as Record<string, unknown>;

    for (const key in record)
    {
        if (!Object.prototype.hasOwnProperty.call(record, key)) continue;

        const value = record[key];
        if (value instanceof Texture2D || value instanceof TextureCube)
        {
            textures.push({ key, texture: value });
        }
    }

    return textures;
}

/**
 * 把 core uniform 对象中非纹理字段提取为普通数据对象（用于 BufferBinding.value）。
 *
 * 纹理字段会被剔除（由 `extractTextures` 单独处理）。
 */
function extractUniformData(uniforms: UniformsLike): Record<string, unknown>
{
    const data: Record<string, unknown> = {};
    const record = uniforms as unknown as Record<string, unknown>;

    for (const key in record)
    {
        if (!Object.prototype.hasOwnProperty.call(record, key)) continue;

        const value = record[key];
        if (value instanceof Texture2D || value instanceof TextureCube) continue;

        data[key] = extractValue(value);
    }

    return data;
}

function extractValue(value: unknown): unknown
{
    if (value === null || value === undefined || typeof value !== 'object')
    {
        return value;
    }

    if (Array.isArray(value))
    {
        return value.map(v => extractValue(v));
    }

    const obj = value as Record<string, unknown>;
    const result: Record<string, unknown> = {};
    for (const key in obj)
    {
        if (!Object.prototype.hasOwnProperty.call(obj, key)) continue;
        if (key === '__class__') continue;

        result[key] = extractValue(obj[key]);
    }
    return result;
}

/**
 * 从 core `TextureInfo` 的采样配置构建 webgpu `Sampler`。
 *
 * 把 core 的 TextureMinFilter/TextureMagFilter/TextureWrap（大写枚举）映射为
 * webgpu 的 addressMode/filter（小写/连字符枚举）。
 *
 * @param textureInfo core 纹理信息
 */
export function buildSamplerFromTextureInfo(textureInfo: TextureInfo<unknown>): Sampler
{
    // TextureWrap: CLAMP_TO_EDGE / REPEAT / MIRRORED_REPEAT
    const mapWrap = (w: string): Sampler['addressModeU'] =>
    {
        switch (w)
        {
            case 'CLAMP_TO_EDGE': return 'clamp-to-edge';
            case 'MIRRORED_REPEAT': return 'mirror-repeat';
            case 'REPEAT':
            default: return 'repeat';
        }
    };

    // TextureMinFilter / TextureMagFilter: NEAREST / LINEAR / NEAREST_MIPMAP_* / LINEAR_MIPMAP_*
    const isLinear = (f: string) => f === 'LINEAR' || f?.startsWith('LINEAR');
    const isMipmapLinear = (f: string) => f === 'LINEAR_MIPMAP_LINEAR' || f === 'LINEAR_MIPMAP_NEAREST'
        || f === 'LINEAR';

    return {
        addressModeU: mapWrap(textureInfo.wrapS),
        addressModeV: mapWrap(textureInfo.wrapT),
        magFilter: isLinear(textureInfo.magFilter) ? 'linear' : 'nearest',
        minFilter: isLinear(textureInfo.minFilter) ? 'linear' : 'nearest',
        mipmapFilter: isMipmapLinear(textureInfo.minFilter) ? 'linear' : 'nearest',
        maxAnisotropy: textureInfo.anisotropy || 1,
    };
}

/**
 * 构建 WGSL shader 对应的绑定资源。
 *
 * 该函数只负责构建与材质相关的绑定资源（uniform 数据 + 纹理）。
 * 相机、全局、模型等 uniform 由 `ForwardRenderer` 单独注入。
 *
 * 约定：纹理在 bindingResources 中以 `<key>`（与 WGSL 变量名一致）为键，
 * 值为 `{ texture, sampler }` 形式。webgpu 绑定解析支持：
 * - WGSL `var <key>: texture_2d` + `var <key>Sampler: sampler` ← `bindingResources[<key>] = { texture, sampler }`
 *
 * @param uniforms core 材质 uniform 对象
 */
export function buildMaterialBindingResources(uniforms: UniformsLike): Record<string, unknown>
{
    const bindingResources: Record<string, unknown> = {};

    // 1. 普通数据字段 → BufferBinding
    const uniformData = extractUniformData(uniforms);
    if (Object.keys(uniformData).length > 0)
    {
        bindingResources.uniforms = { value: uniformData } as BufferBinding;
    }

    // 2. 纹理字段 → { texture, sampler }
    const textures = extractTextures(uniforms);
    for (const { key, texture } of textures)
    {
        bindingResources[key] = {
            texture,
            sampler: buildSamplerFromTextureInfo(texture as TextureInfo<unknown>),
        };
    }

    return bindingResources;
}

/**
 * 根据 shader 名称与渲染参数构建 webgpu `RenderPipeline`。
 *
 * @param shaderName shader 名称
 * @param renderParams core 渲染参数
 */
export function buildRenderPipeline(shaderName: string, renderParams: RenderParams): RenderPipeline | undefined
{
    const asset = shaderRegistry.get(shaderName);
    if (!asset) return undefined;

    const primitive = renderParamsToPrimitiveState(renderParams);
    const depthStencil = renderParamsToDepthStencilState(renderParams);
    const blend = renderParamsToBlendState(renderParams);

    const pipeline: RenderPipeline = {
        vertex: {
            wgsl: asset.vertex,
        },
        fragment: {
            wgsl: asset.fragment,
            targets: blend ? [{ blend }] : [{}],
        },
        primitive,
        depthStencil,
    };

    return pipeline;
}

/**
 * 可变的 RenderObject 视图。
 *
 * `RenderObject` 接口将 `pipeline`/`vertices`/`indices`/`draw`/`bindingResources` 声明为 `readonly`，
 * 但运行时它们是可变的（webgpu 包内部也按此方式修改）。这里提供一个可写视图，便于适配层赋值。
 */
type MutableRenderObject = {
    pipeline: RenderPipeline;
    vertices?: VertexAttributes;
    indices?: Uint16Array | Uint32Array;
    draw?: { __type__: 'DrawIndexed' | 'DrawVertex' } & Record<string, unknown>;
    bindingResources: Record<string, unknown>;
};

/**
 * 把材质相关的 WebGPU 原生数据写入 RenderObject。
 *
 * - 设置 `pipeline`（WGSL 着色器 + 渲染状态）
 * - 初始化 `bindingResources` 并合并材质相关绑定（uniform 数据 + 纹理）
 *
 * 相机、全局、模型等 uniform 由 `ForwardRenderer` 单独注入到 `bindingResources`。
 * 顶点 / 索引 / draw 数据由 geometry 相关流程注入（见 {@link applyGeometryRenderData}）。
 *
 * @param renderObject 渲染对象
 * @param shaderName shader 名称
 * @param renderParams core 渲染参数
 * @param uniforms core 材质 uniform 对象
 * @returns 是否成功写入（shader 未注册时返回 false）
 */
export function applyMaterialRenderData(
    renderObject: RenderObject,
    shaderName: string,
    renderParams: RenderParams,
    uniforms: unknown,
): boolean
{
    const pipeline = buildRenderPipeline(shaderName, renderParams);
    if (!pipeline) return false;

    const ro = renderObject as unknown as MutableRenderObject;
    ro.pipeline = pipeline;

    // 确保 bindingResources 已初始化
    if (!ro.bindingResources)
    {
        ro.bindingResources = {};
    }

    const materialResources = buildMaterialBindingResources(uniforms as UniformsLike);
    Object.assign(ro.bindingResources, materialResources);

    return true;
}

/**
 * 把 geometry 相关的 WebGPU 原生数据写入 RenderObject。
 *
 * - 设置 `vertices`（属性名已映射为 WGSL 形参名）
 * - 设置 `indices`（`Uint16Array`/`Uint32Array`）
 * - 设置 `draw`（`DrawIndexed`，无索引时 `DrawVertex`）
 *
 * @param renderObject 渲染对象
 * @param geometry core 几何体
 */
export function applyGeometryRenderData(renderObject: RenderObject, geometry: Geometry): void
{
    const ro = renderObject as unknown as MutableRenderObject;

    // 顶点属性
    ro.vertices = buildVertices(geometry);

    // 索引数据
    const indexBuffer = (geometry as unknown as { _indexBuffer: { indices: number[] } })._indexBuffer;
    const indices = indexBuffer?.indices;
    if (indices && indices.length > 0)
    {
        // 顶点数超过 65535 时需要 Uint32，否则用 Uint16 节省显存
        const maxIndex = indices.reduce((m, v) => v > m ? v : m, 0);
        ro.indices = maxIndex > 65535 ? new Uint32Array(indices) : new Uint16Array(indices);

        ro.draw = {
            __type__: 'DrawIndexed',
            indexCount: indices.length,
            firstIndex: 0,
            instanceCount: 1,
        };
    }
    else
    {
        // 无索引，按顶点绘制。用 WebGPU VertexAttribute.getVertexCount 计算顶点数。
        const vertices = ro.vertices;
        const firstAttr = vertices ? Object.values(vertices)[0] : undefined;
        const vertexCount = firstAttr ? VertexAttribute.getVertexCount(firstAttr) : 0;

        ro.draw = {
            __type__: 'DrawVertex',
            vertexCount,
            instanceCount: 1,
        };
    }
}
