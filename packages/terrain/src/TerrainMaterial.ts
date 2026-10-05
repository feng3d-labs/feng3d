import { BindingResource, RenderPipeline, Sampler, Texture, TextureView } from '@feng3d/webgpu';
import {
    type Color4,
    defaultTexture,
    FogMode,
    Material,
    MaterialLogic,
    writeMaterialBase,
    writeTextureBindings,
    materialLogic,

    registerLogic,
    reactive,
    effect,
    computed,
    standardVertexWGSL,
} from 'feng3d';
import { getTerrainFragmentWGSL } from './terrainFragment';

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
        TerrainMaterial: TerrainMaterialLogic;
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
 * 自动传递；纹理（s_diffuse + s_blendTexture + s_splatTexture1/2/3）由 TerrainMaterialLogic
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
 * TerrainMaterialLogic 逻辑类：填入 terrain 着色器，监听 6 个纹理变化重算绑定。
 *
 * 结构与 TextureMaterialLogic 一致：构造逻辑收敛为私有字段/方法，仅暴露 isLoaded /
 * beforeRender。通过 registerLogic('TerrainMaterial', terrainMaterial) 注册，
 * 调用方用 `logic(material)` 获取实例。
 */
export interface TerrainMaterialLogic extends MaterialLogic
{
}

/**
 * 工厂函数：TerrainMaterialLogic 的唯一创建入口（registerLogic 注册它）。
 *
 * @param material 材质数据（raw）
 */
export function terrainMaterialLogic(material: TerrainMaterial): TerrainMaterialLogic
{
    // ---- 默认值填充（写在 raw 数据上，不涉及实例状态）----
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

    const uniforms = () => material.uniforms;

    const renderPipeline = reactive({
        vertex: { wgsl: standardVertexWGSL },
        fragment: { wgsl: getTerrainFragmentWGSL(), targets: [{}] },
        primitive: { topology: 'triangle-list', cullFace: 'back', frontFace: 'cw' },
        depthStencil: { depthWriteEnabled: true, depthCompare: 'less' },
    }) as RenderPipeline;

    // 纹理绑定缓存（key → textureView + sampler），beforeRender 时写入 bindingResources
    const textureBindings: Record<string, { textureView: TextureView, sampler: Sampler }> = {};

    /** 更新指定纹理字段的绑定缓存（textureView + sampler） */
    const updateTexture = (key: string): void =>
    {
        const texture = (material as any)[key];
        textureBindings[key] = {
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

    const bindingResources = computed<Record<string, BindingResource>>(() =>
    {
        const result: Record<string, BindingResource> = {};
        for (const key in textureBindings)
        {
            const binding = textureBindings[key];
            // 键名按 TSL 的采样器展开约定（sampler2D(uniform('s_diffuse')) → s_diffuse_texture + s_diffuse），
            // 与手写的 s_diffuse + s_diffuseSampler 相反。见 terrainFragment.ts。
            result[key + '_texture'] = binding.textureView;
            result[key] = binding.sampler;
        }

        return result;
    });

    // 组合基类工厂：未覆写的成员显式委托（不要用 ...base 展开——会把 getter 立刻求值）
    const base = materialLogic(material);

    const logic: TerrainMaterialLogic = {
        get isTransparent() { return base.isTransparent; },
        get isPrimitivesTopology() { return base.isPrimitivesTopology; },
        get isLoaded()
        {
            return [material.s_diffuse, material.s_specular, material.s_blendTexture,
                material.s_splatTexture1, material.s_splatTexture2, material.s_splatTexture3]
                .every(t => !t || !!t.sources?.length);
        },
        beforeRender(renderObject)
        {
            writeMaterialBase(renderObject, renderPipeline, uniforms);
            writeTextureBindings(renderObject, bindingResources.value);
        },
    };

    return logic;
}

// 注册到 logic 分发表
registerLogic('TerrainMaterial', terrainMaterialLogic);

// 注册默认材质工厂（由 Material.ts 的 ensureDefaultMaterials 惰性调用）
// Terrain 组件用 getDefaultMaterial('Terrain-Material') 取用本材质。

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

