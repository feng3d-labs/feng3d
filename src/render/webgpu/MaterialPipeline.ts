import {
    RenderObject,
    RenderPipeline,
    Sampler,
    Texture,
    TextureView,
    VertexAttribute,
    VertexAttributes,
} from '@feng3d/webgpu';
import { GeometryLogic } from '../../geometry/Geometry';

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
 * 根据 core `Geometry` 构建 webgpu `VertexAttributes`。
 *
 * Geometry 的 `_attributes` 已是 webgpu `VertexAttribute` 格式（data 为 Float32Array），
 * 这里仅做属性名映射（`a_position` → `position`）并跳过空数据。
 *
 * 注意：WebGPU 顶点缓冲布局根据着色器反射按名匹配（见 `WGPUVertexBufferLayout`），
 * 因此此处可以安全地提供全部属性，未被 shader 引用的属性会自动忽略。
 *
 * @param geometry core 几何体（调用前须确保几何体数据已构建，即 `geometry.positions` 可用）
 */
/**
 * 默认 color 顶点属性缓存（按 position 数据引用缓存）。
 *
 * geometry 无 color 属性时由 buildVertices 合成默认白色 color 数据。
 * 按 positionAttr.data（Float32Array）引用缓存，避免每帧 new Float32Array
 * 产生新 ArrayBuffer → 新 WGPUBuffer（顶点 buffer 按 ArrayBuffer 引用缓存）。
 */
const _defaultColorCache = new WeakMap<object, { data: Float32Array, format: 'float32x4' }>();

export function buildVertices(geometry: GeometryLogic): VertexAttributes
{
    // 触发几何体构建，确保 _attributes 中的数据已填充
    geometry.updateGeometry();

    const attributes = geometry.attributes;
    const vertices: VertexAttributes = {};

    for (const coreName in attributes)
    {
        if (!Object.prototype.hasOwnProperty.call(attributes, coreName)) continue;

        const wgslName = vertexAttributeMap[coreName];
        if (!wgslName) continue; // 未知属性，跳过

        const attr = attributes[coreName];
        if (!attr.data || attr.data.length === 0) continue;

        vertices[wgslName] = attr;
    }

    // 为着色器提供默认的 color 属性（如果 Geometry 没有）
    // WGSL 着色器声明 @location color: vec4<f32>，必须提供
    if (!vertices.color)
    {
        // 从 position 属性计算顶点数量（position 是 vec3，每个顶点 3 个 float）
        const positionAttr = attributes.a_position;
        if (positionAttr && positionAttr.data && positionAttr.data.length > 0)
        {
            // 按 positionAttr.data 引用缓存默认 color 数据，避免每帧 new Float32Array
            // 造成顶点 buffer 泄漏（WGPUBuffer 按 ArrayBuffer 引用缓存）。
            const posData = positionAttr.data;
            let colorAttr = _defaultColorCache.get(posData);
            if (!colorAttr)
            {
                const vertexCount = posData.length / 3;
                const colorData = new Float32Array(vertexCount * 4);
                // 填充白色 (1, 1, 1, 1)
                for (let i = 0; i < vertexCount; i++)
                {
                    colorData[i * 4] = 1;
                    colorData[i * 4 + 1] = 1;
                    colorData[i * 4 + 2] = 1;
                    colorData[i * 4 + 3] = 1;
                }
                colorAttr = { data: colorData, format: 'float32x4' as const };
                _defaultColorCache.set(posData, colorAttr);
            }
            vertices.color = colorAttr;
        }
    }

    return vertices;
}

/**
 * 默认 webgpu `Sampler`（与旧 TextureInfo 默认值等价的"线性 + repeat"配置）。
 *
 * sampler 配置已上移到 material.samplers，纹理本身不再携带 wrap/filter 元数据；
 * 调用方需要覆盖时在 material 上写 `samplers.<key>Sampler = { ... }` 即可。
 */
export const defaultSampler: Sampler = {
    addressModeU: 'repeat',
    addressModeV: 'repeat',
    magFilter: 'linear',
    minFilter: 'linear',
    mipmapFilter: 'linear',
    maxAnisotropy: 1,
};

/**
 * 从纹理构建 webgpu `TextureView`。
 *
 * cube / cube-array 维度的纹理自动使用 cube 视图（6 层），其余按默认 2D 视图。
 *
 * @param texture webgpu 纹理
 */
export function buildTextureView(texture: Texture): TextureView
{
    const dimension = texture.descriptor?.dimension;
    if (dimension === 'cube' || dimension === 'cube-array')
    {
        return {
            texture: texture as unknown as TextureView['texture'],
            dimension: 'cube',
            arrayLayerCount: 6,
        };
    }

    return {
        texture: texture as unknown as TextureView['texture'],
        dimension: '2d',
    };
}

/**
 * 可变的 RenderObject 视图。
 *
 * `RenderObject` 接口将 `pipeline`/`vertices`/`indices`/`draw`/`bindingResources` 声明为 `readonly`，
 * 但运行时它们是可变的（webgpu 包内部也按此方式修改）。这里提供一个可写视图，便于适配层赋值。
 */
export type MutableRenderObject = {
    pipeline: RenderPipeline;
    vertices?: VertexAttributes;
    indices?: Uint16Array | Uint32Array;
    draw?: { __type__: 'DrawIndexed' | 'DrawVertex' } & Record<string, unknown>;
    bindingResources: Record<string, unknown>;
};

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
/**
 * geometry 渲染数据缓存（按 geometry 实例缓存 vertices 对象与 indices TypedArray）。
 *
 * applyGeometryRenderData 每帧调用，若每次都 buildVertices + new TypedArray 会产生
 * 新对象引用 → renderPipeline/buffer 缓存 key 变化 → 每帧新建 GPU 资源（泄漏）。
 * 缓存按 geometry 实例 + attributes 数据引用 + indices 引用判断：数据不变则复用。
 */
interface GeometryRenderCache
{
    /** 缓存对应的 position 数据引用（用于检测 geometry 是否变化） */
    posRef: object | undefined;
    indicesRef: number[] | undefined;
    vertices: VertexAttributes;
    indicesTyped: Uint16Array | Uint32Array | undefined;
    draw: { __type__: 'DrawIndexed' | 'DrawVertex' } & Record<string, unknown>;
}

const _geometryRenderCache = new WeakMap<GeometryLogic, GeometryRenderCache>();

export function applyGeometryRenderData(renderObject: RenderObject, geometry: GeometryLogic): void
{
    const ro = renderObject as unknown as MutableRenderObject;

    geometry.updateGeometry();
    const indices = geometry.indices;
    const posRef = geometry.attributes.a_position?.data as object | undefined;

    // 命中缓存则复用（geometry 数据未变化）
    let cache = _geometryRenderCache.get(geometry);
    if (cache && cache.posRef === posRef && cache.indicesRef === indices)
    {
        ro.vertices = cache.vertices;
        ro.indices = cache.indicesTyped;
        ro.draw = cache.draw;

        return;
    }

    // 顶点属性
    const vertices = buildVertices(geometry);
    ro.vertices = vertices;

    // 索引数据
    let indicesTyped: Uint16Array | Uint32Array | undefined;
    let draw: { __type__: 'DrawIndexed' | 'DrawVertex' } & Record<string, unknown>;
    if (indices && indices.length > 0)
    {
        // 顶点数超过 65535 时需要 Uint32，否则用 Uint16 节省显存
        const maxIndex = indices.reduce((m, v) => v > m ? v : m, 0);
        indicesTyped = maxIndex > 65535 ? new Uint32Array(indices) : new Uint16Array(indices);
        draw = {
            __type__: 'DrawIndexed',
            indexCount: indices.length,
            firstIndex: 0,
            instanceCount: 1,
        };
    }
    else
    {
        // 无索引，按顶点绘制。用 WebGPU VertexAttribute.getVertexCount 计算顶点数。
        const firstAttr = vertices ? Object.values(vertices)[0] : undefined;
        const vertexCount = firstAttr ? VertexAttribute.getVertexCount(firstAttr) : 0;
        draw = {
            __type__: 'DrawVertex',
            vertexCount,
            instanceCount: 1,
        };
    }
    ro.indices = indicesTyped;
    ro.draw = draw;

    // 写入缓存
    cache = { posRef, indicesRef: indices, vertices, indicesTyped, draw };
    _geometryRenderCache.set(geometry, cache);
}
