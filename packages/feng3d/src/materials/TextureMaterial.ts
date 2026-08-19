declare module '@feng3d/reactivity'
{
    interface LogicMap
    {
        TextureMaterial: MaterialLogic;
    }
}

import type { Color4 } from '../core/Color4';
import { RenderObject, RenderPipeline, Sampler, Texture, TextureView } from '@feng3d/webgpu';
import { cameraUniformsWGSL } from '../cameras/Camera';
import { transformUniformsWGSL } from '../core/Object3D';
import { defaultTexture } from '../textures/createTexture';
import { isTextureFieldLoaded, resolveTexture, TextureResource } from '../textures/TextureResource';
import { Material, MaterialLogic, writeMaterialBase, writeTextureBindings } from './Material';
import { reactive, registerLogic, computed, Computed, toRaw } from '@feng3d/reactivity';

/**
 * 默认采样器（线性过滤 + repeat 寻址）。
 */
const DEFAULT_SAMPLER: Sampler = {
    addressModeU: 'repeat',
    addressModeV: 'repeat',
    magFilter: 'linear',
    minFilter: 'linear',
    mipmapFilter: 'linear',
    maxAnisotropy: 1,
};

/**
 * 从纹理构建 TextureView（cube/cube-array 用 cube 视图，其余 2d）。
 */
function buildTextureView(texture: Texture): TextureView
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

declare module './Material'
{
    export interface MaterialMap
    {
        TextureMaterial: TextureMaterial;
    }
}

/**
 * 纹理材质 uniforms（颜色）。
 */
export interface TextureUniforms
{
    /** 颜色 */
    readonly u_color: Color4;
}

/**
 * 纹理材质（纯数据接口）。
 *
 * 使用 texture 着色器（采样纹理 × 材质颜色）。shader 与渲染状态由 materialLogic 在
 * 创建时填充到 renderPipeline，纹理 s_texture 由 materialLogic 监听变化重算
 * textureView/sampler 绑定，在 beforeRender 中写入 bindingResources。
 *
 * 可选 {@link sampler} 字段覆盖默认采样器（线性过滤），用于切换 Nearest/Linear 过滤、
 * 寻址模式等（对应 three.js Texture.magFilter/minFilter/wrapS/wrapT）。
 */
export interface TextureMaterial extends Material
{
    readonly __type__: 'TextureMaterial';
    readonly uniforms: TextureUniforms;
    /** 纹理（运行时 Texture 或 `{ __type__: 'Texture', url }` 声明式引用） */
    readonly s_texture: Texture | TextureResource;
    /** 可选采样器（覆盖默认线性采样器）。省略时用 DEFAULT_SAMPLER（linear + repeat）。 */
    readonly sampler?: Sampler;
}

/**
 * TextureMaterial 逻辑类：填入 texture 着色器，监听 s_texture 变化重算绑定。
 */
export class TextureMaterialLogic extends MaterialLogic
{
    #uniforms: () => TextureUniforms;
    #s_texture: () => Texture;
    #renderPipeline: RenderPipeline;
    #bindingResources: Computed<Record<string, import('@feng3d/webgpu').BindingResource>>;

    protected constructor(data: TextureMaterial)
    {
        super(data);
        // 默认值 accessor：声明式引用经 resolveTexture 解析（占位符渐进换装，设计文档 3.2）
        const r_material = reactive(data);
        this.#uniforms = () => r_material.uniforms ?? { u_color: { __type__: 'Color4', r: 1, g: 1, b: 1, a: 1 } };
        this.#s_texture = () => resolveTexture(toRaw(r_material.s_texture), defaultTexture);

        this.#renderPipeline = reactive({
            vertex: { wgsl: textureVertexWGSL },
            fragment: { wgsl: textureFragmentWGSL, targets: [{}] },
            primitive: { topology: 'triangle-list', cullFace: 'back', frontFace: 'ccw' },
            depthStencil: { depthWriteEnabled: true, depthCompare: 'less' },
        }) as RenderPipeline;

        // 纹理视图缓存：同一 Texture 复用同一 TextureView（稳定引用，避免每次重算
        // 新建 view 对象导致 WGPUTextureView 缓存失效、GPU 纹理重建泄漏）
        const viewCache = new Map<Texture, TextureView>();
        const textureViewOf = (texture: Texture): TextureView =>
        {
            let view = viewCache.get(texture);
            if (!view)
            {
                view = buildTextureView(texture);
                viewCache.set(texture, view);
            }

            return view;
        };

        // 纹理绑定（纯 computed）：字段变化或声明式纹理加载完成时精确失效
        this.#bindingResources = computed(() =>
        {
            const result: Record<string, import('@feng3d/webgpu').BindingResource> = {};
            result.s_texture = textureViewOf(this.#s_texture());
            // sampler 字段优先，省略则用默认线性采样器
            result.s_textureSampler = r_material.sampler ?? DEFAULT_SAMPLER;

            return result;
        });
    }

    /** 内部创建入口（protected constructor 的唯一出口） */
    static create(data: TextureMaterial): TextureMaterialLogic
    {
        return new TextureMaterialLogic(data);
    }

    /** 加载状态：声明式引用查缓存（未加载时 false），运行时 Texture 视为已加载 */
    #allLoaded = (): boolean => isTextureFieldLoaded(toRaw(reactive(this._data as TextureMaterial).s_texture));

    beforeRender(renderObject: RenderObject): void
    {
        writeMaterialBase(renderObject, this.#renderPipeline, this.#uniforms);
        writeTextureBindings(renderObject, this.#bindingResources.value);
    }

    get isLoaded(): boolean
    {
        return this.#allLoaded();
    }
}

// 注册到 logic 分发表
registerLogic('TextureMaterial', TextureMaterialLogic as unknown as new (data: TextureMaterial) => TextureMaterialLogic);

// ============================================================================
// 纹理顶点着色器 WGSL
//
// 顶点输入（统一 location 约定）：
// - @location(0) a_position
// - @location(3) a_uv
//
// 纹理顶点着色器代码
const textureVertexWGSL = `
struct VertexInput {
    @location(0) a_position: vec3<f32>,
    @location(3) a_uv: vec2<f32>,
}

struct VertexOutput {
    @builtin(position) position: vec4<f32>,
    @location(0) uv: vec2<f32>,
}
` + transformUniformsWGSL + cameraUniformsWGSL + `
@vertex
fn main(input: VertexInput) -> VertexOutput {
    var output: VertexOutput;
    let worldPosition = transform.u_modelMatrix * vec4<f32>(input.a_position, 1.0);
    output.position = cameraUniforms.u_viewProjection * worldPosition;
    output.uv = input.a_uv;
    return output;
}
`;

// ============================================================================
// 纹理片段着色器 WGSL
//
// 采样纹理颜色，与材质 u_color 相乘输出。
//
// 绑定约定：
// - @group(0) @binding(3) var<uniform> material_uniforms        - { u_color: vec4 }（TextureUniforms）
// - @group(1) @binding(0) var s_textureSampler: sampler
// - @group(1) @binding(1) var s_texture: texture_2d<f32>
//
// 注意：sampler 与 texture 的 WGSL 变量名遵循 webgpu 绑定解析约定
// （bindingResources.s_texture = { texture, sampler }）。
//
// 纹理片段着色器代码
const textureFragmentWGSL = `
struct FragmentInput {
    @location(0) uv: vec2<f32>,
}

struct FragmentOutput {
    @location(0) color: vec4<f32>,
}

struct TextureUniforms {
    u_color: vec4<f32>,
}

@group(0) @binding(3) var<uniform> material_uniforms: TextureUniforms;

@group(1) @binding(0) var s_textureSampler: sampler;
@group(1) @binding(1) var s_texture: texture_2d<f32>;

@fragment
fn main(input: FragmentInput) -> FragmentOutput {
    var output: FragmentOutput;
    let texColor = textureSample(s_texture, s_textureSampler, input.uv);
    output.color = texColor * material_uniforms.u_color;
    return output;
}
`;
