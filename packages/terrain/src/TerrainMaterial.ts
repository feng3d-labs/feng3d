import { BufferBinding, RenderObject, RenderPipeline, Sampler, Texture, TextureView } from '@feng3d/webgpu';
import {
    Color4,
    defaultTexture,
    FogMode,
    Material,
    MaterialLogic,
    registerDefaultMaterialFactory,
    registerLogic,
    reactive,
    effect,
    standardLightingParsWGSL,
    standardLightingMainWGSL,
    standardFogMainWGSL,
    standardVertexWGSL,
    cameraUniformsWGSL,
    globalUniformsWGSL,
} from 'feng3d';

/**
 * 默认采样器（线性过滤 + repeat 寻址，splat 各层 UV 重复采样需要 repeat）。
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

declare module 'feng3d'
{
    export interface MaterialMap
    {
        TerrainMaterial: TerrainMaterial;
    }
}

declare module '@feng3d/reactivity'
{
    interface LogicMap
    {
        TerrainMaterial: MaterialLogic;
    }
}

/**
 * TerrainMaterial uniforms。
 *
 * 与 StandardUniforms 共享光照相关字段（u_specular/u_glossiness/u_ambient/u_reflectivity/
 * u_fog*），以便复用 {@link standardLightingMainWGSL} 片段。
 * 额外 u_splatRepeats 控制 splat 各层 UV 重复次数（r=未用，g/b/a 对应 splat 1/2/3）。
 */
export interface TerrainUniforms
{
    /** 漫反射颜色（与 s_diffuse 相乘，作为 splat 混合的基色） */
    readonly u_diffuse?: Color4;
    /** 透明度阈值（alpha 测试） */
    readonly u_alphaThreshold?: number;
    /** 镜面反射颜色 */
    readonly u_specular?: Color4;
    /** 光泽度 */
    readonly u_glossiness?: number;
    /** 环境光颜色 */
    readonly u_ambient?: Color4;
    /** 反射率 */
    readonly u_reflectivity?: number;
    /** 雾起始距离 */
    readonly u_fogMinDistance?: number;
    /** 雾结束距离 */
    readonly u_fogMaxDistance?: number;
    /** 雾颜色 */
    readonly u_fogColor?: Color4;
    /** 雾密度 */
    readonly u_fogDensity?: number;
    /** 雾模式 */
    readonly u_fogMode?: FogMode;
    /** splat 各层 UV 重复次数（r=未用，g=splat1，b=splat2，a=splat3） */
    readonly u_splatRepeats?: Color4;
}

/**
 * 地形材质（纯数据接口）。
 *
 * 使用 terrain 着色器（splat 纹理混合 + 标准光照/阴影/雾）。uniform 数据通过 {@link uniforms}
 * 自动传递；纹理（s_diffuse + s_blendTexture + s_splatTexture1/2/3）由 terrainMaterialLogic
 * 监听变化重算 textureView/sampler 绑定，在 beforeRender 中写入 bindingResources。
 *
 * splat 混合按 {@link ../../../src/shaders/modules/terrainDefault_pars_frag.glsl} 翻译，
 * 用 textureSampleLevel（lod=0）支持非均匀控制流。
 */
export interface TerrainMaterial extends Material
{
    readonly __type__: 'TerrainMaterial';
    readonly uniforms?: TerrainUniforms;
    /** 基础漫反射纹理（与各 splat 层混合） */
    readonly s_diffuse?: Texture;
    /** 镜面反射光泽图（复用 standard lighting，无 specular 可省略） */
    readonly s_specular?: Texture;
    /** 地形混合权重图（RGB 通道对应 splat 1/2/3 的权重） */
    readonly s_blendTexture?: Texture;
    /** 地形层 1（沙滩） */
    readonly s_splatTexture1?: Texture;
    /** 地形层 2（草地） */
    readonly s_splatTexture2?: Texture;
    /** 地形层 3（岩石） */
    readonly s_splatTexture3?: Texture;
}

/**
 * 创建 TerrainMaterial 实例。
 */
export function createTerrainMaterial(): TerrainMaterial
{
    return {
        __type__: 'TerrainMaterial',
        name: '',
        uniforms: {
            u_diffuse: { __type__: 'Color4', r: 1, g: 1, b: 1, a: 1 },
            u_alphaThreshold: 0,
            u_specular: { __type__: 'Color4', r: 0, g: 0, b: 0, a: 1 },
            u_glossiness: 50,
            u_ambient: { __type__: 'Color4', r: 1, g: 1, b: 1, a: 1 },
            u_reflectivity: 0,
            u_fogMinDistance: 0,
            u_fogMaxDistance: 100,
            u_fogColor: { __type__: 'Color4', r: 0, g: 0, b: 0, a: 1 },
            u_fogDensity: 0.1,
            u_fogMode: FogMode.NONE,
            u_splatRepeats: { __type__: 'Color4', r: 1, g: 1, b: 1, a: 1 },
        },
        s_diffuse: defaultTexture,
        s_specular: defaultTexture,
        s_blendTexture: defaultTexture,
        s_splatTexture1: defaultTexture,
        s_splatTexture2: defaultTexture,
        s_splatTexture3: defaultTexture,
    };
}

/**
 * TerrainMaterial 默认 uniforms 模板（缺失 uniforms 字段时按字段补默认）。
 */
const TERRAIN_DEFAULT_UNIFORMS = {
    u_diffuse: { __type__: 'Color4', r: 1, g: 1, b: 1, a: 1 },
    u_alphaThreshold: 0,
    u_specular: { __type__: 'Color4', r: 0, g: 0, b: 0, a: 1 },
    u_glossiness: 50,
    u_ambient: { __type__: 'Color4', r: 1, g: 1, b: 1, a: 1 },
    u_reflectivity: 0,
    u_fogMinDistance: 0,
    u_fogMaxDistance: 100,
    u_fogColor: { __type__: 'Color4', r: 0, g: 0, b: 0, a: 1 },
    u_fogDensity: 0.1,
    u_fogMode: FogMode.NONE,
    u_splatRepeats: { __type__: 'Color4', r: 1, g: 1, b: 1, a: 1 },
};

/**
 * TerrainMaterial logic：填入 terrain 着色器，监听 6 个纹理变化重算绑定。
 *
 * 结构与 standardMaterialLogic 一致：构造逻辑变为闭包变量，仅暴露 isLoaded /
 * onLoadCompleted / beforeRender / renderPipeline。通过
 * registerLogic('TerrainMaterial', terrainMaterialLogic) 注册，调用方用 `logic(material)`
 * 获取实例。
 */
function terrainMaterialLogic(material: TerrainMaterial): MaterialLogic
{
    // 默认值（缺失字段单独赋值）
    const writable = material as { [k: string]: any };
    if (material.name === undefined) writable.name = '';
    // uniforms 缺失整体赋值；部分提供时按字段补默认（深拷贝避免实例间共享引用）
    if (material.uniforms === undefined)
    {
        writable.uniforms = JSON.parse(JSON.stringify(TERRAIN_DEFAULT_UNIFORMS));
    }
    else
    {
        const r_uniforms = reactive(material.uniforms);
        for (const key in TERRAIN_DEFAULT_UNIFORMS)
        {
            if (material.uniforms[key] === undefined)
            {
                r_uniforms[key] = JSON.parse(JSON.stringify(TERRAIN_DEFAULT_UNIFORMS[key]));
            }
        }
    }
    if (material.s_diffuse === undefined) writable.s_diffuse = defaultTexture;
    if (material.s_specular === undefined) writable.s_specular = defaultTexture;
    if (material.s_blendTexture === undefined) writable.s_blendTexture = defaultTexture;
    if (material.s_splatTexture1 === undefined) writable.s_splatTexture1 = defaultTexture;
    if (material.s_splatTexture2 === undefined) writable.s_splatTexture2 = defaultTexture;
    if (material.s_splatTexture3 === undefined) writable.s_splatTexture3 = defaultTexture;

    const _material = material;
    const renderPipeline = reactive({
        vertex: { wgsl: standardVertexWGSL },
        fragment: { wgsl: terrainFragmentWGSL, targets: [{}] },
        primitive: { topology: 'triangle-list', cullFace: 'back', frontFace: 'cw' },
        depthStencil: { depthWriteEnabled: true, depthCompare: 'less' },
    }) as RenderPipeline;

    // 纹理绑定缓存（key → textureView + sampler），beforeRender 时写入 bindingResources
    const _textureBindings: Record<string, { textureView: TextureView, sampler: Sampler }> = {};

    const updateTexture = (key: string) =>
    {
        const texture = (material as any)[key];
        _textureBindings[key] = {
            textureView: buildTextureView(texture),
            sampler: DEFAULT_SAMPLER,
        };
    };

    // 初始化与响应式更新纹理绑定（监听纹理字段变化）
    const keys = ['s_diffuse', 's_specular', 's_blendTexture',
        's_splatTexture1', 's_splatTexture2', 's_splatTexture3'];
    for (const key of keys)
    {
        effect(() => updateTexture(key));
    }

    function beforeRender(renderObject: RenderObject): void
    {
        reactive(renderObject).pipeline = renderPipeline;
        if (!renderObject.bindingResources) reactive(renderObject).bindingResources = {} as any;
        const bindingResources = renderObject.bindingResources;
        if (!bindingResources.material_uniforms)
        {
            reactive(bindingResources).material_uniforms = { value: {} };
        }
        reactive(bindingResources.material_uniforms as BufferBinding).value = _material.uniforms;
        const r_bindingResources = reactive(renderObject.bindingResources);
        for (const key in _textureBindings)
        {
            const binding = _textureBindings[key];
            r_bindingResources[key] = binding.textureView;
            r_bindingResources[`${key}Sampler`] = binding.sampler;
        }
    }

    return {
        renderPipeline,
        get isLoaded()
        {
            return [_material.s_diffuse, _material.s_specular, _material.s_blendTexture,
                _material.s_splatTexture1, _material.s_splatTexture2, _material.s_splatTexture3]
                .every(t => !t || !!t.sources?.length);
        },
        onLoadCompleted: (callback) => callback(),
        beforeRender,
    };
}

// 注册到 logic 分发表
registerLogic('TerrainMaterial', terrainMaterialLogic);

// 注册默认材质工厂（由 Material.ts 的 ensureDefaultMaterials 惰性调用）
// Terrain 组件用 getDefaultMaterial('Terrain-Material') 取用本材质。
registerDefaultMaterialFactory('Terrain-Material', createTerrainMaterial);

// ============================================================================
// 地形片段着色器 WGSL
//
// 在 standard 片段基础上加入 splat 纹理混合：
//   color_frag → normal_frag → diffuse_frag → terrain_frag（splat 混合）
//   → alphatest_frag → specular+ambient+lights+shadow+fog（复用 standardLightingMainWGSL）
//
// 数据流（与 GLSL terrainDefault_pars_frag 一致）：
//   diffuseColor = base * u_diffuse * texture(s_diffuse, uv)
//   blend = texture(s_blendTexture, uv)               // 权重图 RGB
//   diffuseColor = lerp(diffuseColor, splat1, blend.x)  // 按 u_splatRepeats.y 缩放 UV
//   diffuseColor = lerp(diffuseColor, splat2, blend.y)  // 按 u_splatRepeats.z 缩放 UV
//   diffuseColor = lerp(diffuseColor, splat3, blend.z)  // 按 u_splatRepeats.w 缩放 UV
//
// 绑定约定：
// - @group(0) @binding(3) var<uniform> material_uniforms: TerrainUniforms
// - @group(0) @binding(4) lights / @binding(5) shadowData / @group(2) shadowMap（共享片段）
// - @group(1) @binding(0-1)  s_diffuse + sampler
// - @group(1) @binding(2-3)  s_specular + sampler
// - @group(1) @binding(4-5)  s_blendTexture + sampler
// - @group(1) @binding(6-7)  s_splatTexture1 + sampler
// - @group(1) @binding(8-9)  s_splatTexture2 + sampler
// - @group(1) @binding(10-11) s_splatTexture3 + sampler
const terrainFragmentWGSL = `
struct FragmentInput {
    @location(0) worldPosition: vec3<f32>,
    @location(1) worldNormal: vec3<f32>,
    @location(2) worldTangent: vec3<f32>,
    @location(3) worldBitangent: vec3<f32>,
    @location(4) uv: vec2<f32>,
    @location(5) color: vec4<f32>,
}

struct FragmentOutput {
    @location(0) color: vec4<f32>,
}
` + cameraUniformsWGSL + globalUniformsWGSL + `
// ---- diffuse_pars_frag ----
struct TerrainUniforms {
    u_diffuse: vec4<f32>,
    u_alphaThreshold: f32,
    u_specular: vec4<f32>,
    u_glossiness: f32,
    u_ambient: vec4<f32>,
    u_reflectivity: f32,
    u_fogMinDistance: f32,
    u_fogMaxDistance: f32,
    u_fogColor: vec4<f32>,
    u_fogDensity: f32,
    u_fogMode: f32,
    u_splatRepeats: vec4<f32>,
}

@group(0) @binding(3) var<uniform> material_uniforms: TerrainUniforms;

// ---- diffuse_pars_frag ----
@group(1) @binding(0) var s_diffuseSampler: sampler;
@group(1) @binding(1) var s_diffuse: texture_2d<f32>;
// ---- specular_pars_frag ----
@group(1) @binding(2) var s_specularSampler: sampler;
@group(1) @binding(3) var s_specular: texture_2d<f32>;
// ---- terrainDefault_pars_frag ----
@group(1) @binding(4) var s_blendTextureSampler: sampler;
@group(1) @binding(5) var s_blendTexture: texture_2d<f32>;
@group(1) @binding(6) var s_splatTexture1Sampler: sampler;
@group(1) @binding(7) var s_splatTexture1: texture_2d<f32>;
@group(1) @binding(8) var s_splatTexture2Sampler: sampler;
@group(1) @binding(9) var s_splatTexture2: texture_2d<f32>;
@group(1) @binding(10) var s_splatTexture3Sampler: sampler;
@group(1) @binding(11) var s_splatTexture3: texture_2d<f32>;

// ---- terrainDefault_pars_frag: 地形 splat 混合函数 ----
// 对照 src/shaders/modules/terrainDefault_pars_frag.glsl 翻译。
// 非均匀控制流下用 textureSampleLevel（lod=0.0）替代 textureSample。
fn terrainMethod(diffuseColor: vec4<f32>, uv: vec2<f32>) -> vec4<f32> {
    let blend = textureSampleLevel(s_blendTexture, s_blendTextureSampler, uv, 0.0);

    var t_uv = uv * material_uniforms.u_splatRepeats.y;
    var tColor = textureSampleLevel(s_splatTexture1, s_splatTexture1Sampler, t_uv, 0.0);
    var result = (tColor - diffuseColor) * blend.x + diffuseColor;

    t_uv = uv * material_uniforms.u_splatRepeats.z;
    tColor = textureSampleLevel(s_splatTexture2, s_splatTexture2Sampler, t_uv, 0.0);
    result = (tColor - result) * blend.y + result;

    t_uv = uv * material_uniforms.u_splatRepeats.w;
    tColor = textureSampleLevel(s_splatTexture3, s_splatTexture3Sampler, t_uv, 0.0);
    result = (tColor - result) * blend.z + result;

    return result;
}

` + standardLightingParsWGSL + `
@fragment
fn main(input: FragmentInput) -> FragmentOutput {
    var output: FragmentOutput;

    // 初始化
    var finalColor: vec4<f32> = vec4<f32>(1.0, 1.0, 1.0, 1.0);

    // ---- color_frag ----
    finalColor = input.color * finalColor;

    // ---- normal_frag ----
    let normal = normalize(input.worldNormal);

    // ---- diffuse_frag ----
    var diffuseColor: vec4<f32> = material_uniforms.u_diffuse;
    diffuseColor = finalColor * diffuseColor * textureSample(s_diffuse, s_diffuseSampler, input.uv);

    // ---- terrain_frag ----
    // 地形 splat 纹理混合（无条件执行，TerrainMaterial 即为地形材质）
    diffuseColor = terrainMethod(diffuseColor, input.uv);

    // ---- alphatest_frag ----
    if (diffuseColor.a < material_uniforms.u_alphaThreshold) {
        discard;
    }

    // ---- finalColor = diffuseColor ----
    finalColor = diffuseColor;

` + standardLightingMainWGSL + `

` + standardFogMainWGSL + `

    output.color = finalColor;
    return output;
}
`;
