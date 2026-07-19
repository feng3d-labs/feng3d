import type { Color4 } from '../core/Color4';
import { BufferBinding, RenderObject, RenderPipeline, Sampler, Texture, TextureView } from '@feng3d/webgpu';
import { cameraUniformsWGSL } from '../cameras/Camera';
import { transformUniformsWGSL } from '../core/Object3D';
import { defaultCubeTexture, defaultNormalTexture, defaultTexture } from '../textures/createTexture';
import { Material, MaterialLogic, registerDefaultMaterialFactory } from './Material';
import { reactive, effect, registerLogic } from '@feng3d/reactivity';
import { globalUniformsWGSL } from '../render/renderer/ForwardRenderer';

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
        StandardMaterial: StandardMaterial;
    }
}

/**
 * 雾模式
 */
export enum FogMode
{
    NONE = 0,
    EXP = 1,
    EXP2 = 2,
    LINEAR = 3
}

/**
 * StandardMaterial uniforms。
 */
export interface StandardUniforms
{
    /** 漫反射颜色 */
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
}

/**
 * 标准材质（纯数据接口）。
 *
 * 使用 standard 着色器（漫反射纹理 + 环境光）。uniform 数据通过 {@link uniforms} 自动传递，
 * 纹理（s_diffuse / s_normal / s_specular / s_ambient / s_envMap）由 materialLogic 监听
 * 纹理字段变化重算 textureView/sampler 绑定，在 beforeRender 中写入 bindingResources。
 *
 * 注：地形 splat 纹理混合由独立的 TerrainMaterial 提供，本材质不含地形逻辑。
 */
export interface StandardMaterial extends Material
{
    readonly __type__: 'StandardMaterial';
    readonly uniforms?: StandardUniforms;
    /** 漫反射纹理 */
    readonly s_diffuse?: Texture;
    /** 法线纹理 */
    readonly s_normal?: Texture;
    /** 镜面反射光泽图 */
    readonly s_specular?: Texture;
    /** 环境纹理 */
    readonly s_ambient?: Texture;
    /** 环境映射贴图（立方体） */
    readonly s_envMap?: Texture;
}

/**
 * 创建 StandardMaterial 实例。
 */
export function createStandardMaterial(): StandardMaterial
{
    return {
        __type__: 'StandardMaterial',
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
        },
        s_diffuse: defaultTexture,
        s_normal: defaultNormalTexture,
        s_specular: defaultTexture,
        s_ambient: defaultTexture,
        s_envMap: defaultCubeTexture,
    };
}

/**
 * StandardMaterial 默认 uniforms 模板（缺失 uniforms 字段时使用）。
 *
 * 各 Color4 字面量随 uniforms 整体赋值，每次新建避免实例间共享引用。
 */
const STANDARD_DEFAULT_UNIFORMS = {
    u_diffuse: { __type__: 'Color4', r: 1, g: 1, b: 1, a: 1 },
    u_alphaThreshold: 0,
    u_specular: { __type__: 'Color4', r: 0, g: 0, b: 0, a: 1 },
    u_glossiness: 50,
    u_ambient: { __type__: 'Color4', r: 1, g: 1, b: 1, a: 1 },
    u_reflectivity: 1,
    u_fogMinDistance: 0,
    u_fogMaxDistance: 100,
    u_fogColor: { __type__: 'Color4', r: 0, g: 0, b: 0, a: 1 },
    u_fogDensity: 0.1,
    u_fogMode: FogMode.NONE,
};

/**
 * StandardMaterial logic：填入 standard 着色器，监听 9 个纹理变化重算绑定。
 *
 * 函数式实现：构造逻辑变为闭包变量，仅暴露 isLoaded / onLoadCompleted / beforeRender /
 * renderPipeline。通过 registerLogic('StandardMaterial', standardMaterialLogic) 注册，
 * 调用方用 `logic(material)` 获取实例。
 */
function standardMaterialLogic(material: StandardMaterial): MaterialLogic
{
    // 默认值（缺失字段单独赋值）
    const writable = material as { [k: string]: any };
    if (material.name === undefined) writable.name = '';
    // uniforms 缺失整体赋值；部分提供时按字段补默认（深拷贝避免实例间共享引用）
    if (material.uniforms === undefined)
    {
        writable.uniforms = JSON.parse(JSON.stringify(STANDARD_DEFAULT_UNIFORMS));
    }
    else
    {
        const r_uniforms = reactive(material.uniforms);
        for (const key in STANDARD_DEFAULT_UNIFORMS)
        {
            if (material.uniforms[key] === undefined)
            {
                r_uniforms[key] = JSON.parse(JSON.stringify(STANDARD_DEFAULT_UNIFORMS[key]));
            }
        }
    }
    if (material.s_diffuse === undefined) writable.s_diffuse = defaultTexture;
    if (material.s_normal === undefined) writable.s_normal = defaultNormalTexture;
    if (material.s_specular === undefined) writable.s_specular = defaultTexture;
    if (material.s_ambient === undefined) writable.s_ambient = defaultTexture;
    if (material.s_envMap === undefined) writable.s_envMap = defaultCubeTexture;

    const _material = material;
    const renderPipeline = reactive({
        vertex: { wgsl: standardVertexWGSL },
        fragment: { wgsl: standardFragmentWGSL, targets: [{}] },
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
    const keys = ['s_diffuse', 's_normal', 's_specular', 's_ambient', 's_envMap'];
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
        // createTextureFromUrl / 默认纹理在赋值时数据已就绪（sources 存在即视为已加载）。
        get isLoaded()
        {
            return [_material.s_diffuse, _material.s_normal, _material.s_specular, _material.s_ambient, _material.s_envMap]
                .every(t => !t || !!t.sources?.length);
        },
        // createTextureFromUrl 是 Promise 工厂，加载在创建时完成，无需事件监听。
        onLoadCompleted: (callback) => callback(),
        beforeRender,
    };
}

// 注册到 logic 分发表
registerLogic('StandardMaterial', standardMaterialLogic);

// 注册默认材质工厂（由 Material.ts 的 ensureDefaultMaterials 惰性调用）
// Default-Material 与 Water-Material（仓库无 water.wgsl，暂用 StandardMaterial 占位）均使用 StandardMaterial。
registerDefaultMaterialFactory('Default-Material', createStandardMaterial);
registerDefaultMaterialFactory('Water-Material', createStandardMaterial);

// ============================================================================
// 标准顶点着色器 WGSL
//
// 从 standard.vertex.glsl + vertex modules 翻译：
// position_vert → worldposition_vert → project_vert → normalmap_vert
//
// 输出：worldPosition, worldNormal, worldTangent, worldBitangent, uv, color
//
// 标准/地形材质共用本顶点着色器（地形顶点数据已 CPU 烘焙，无需 shader 位移）。
export const standardVertexWGSL = `
struct VertexInput {
    @location(0) position: vec3<f32>,
    @location(1) normal: vec3<f32>,
    @location(2) tangent: vec3<f32>,
    @location(3) uv: vec2<f32>,
    @location(4) color: vec4<f32>,
}

struct VertexOutput {
    @builtin(position) position: vec4<f32>,
    @location(0) worldPosition: vec3<f32>,
    @location(1) worldNormal: vec3<f32>,
    @location(2) worldTangent: vec3<f32>,
    @location(3) worldBitangent: vec3<f32>,
    @location(4) uv: vec2<f32>,
    @location(5) color: vec4<f32>,
}
` + transformUniformsWGSL + cameraUniformsWGSL + `
@vertex
fn main(input: VertexInput) -> VertexOutput {
    var output: VertexOutput;

    // position_vert
    let position = vec4<f32>(input.position, 1.0);

    // worldposition_vert
    let worldPosition = transform.u_modelMatrix * position;
    output.worldPosition = worldPosition.xyz;

    // project_vert
    output.position = cameraUniforms.u_viewProjection * worldPosition;

    // normalmap_vert: 法线/切线/副切线变换到世界空间
    let normal = normalize((transform.u_ITModelMatrix * vec4<f32>(input.normal, 0.0)).xyz);
    let tangent = normalize((transform.u_modelMatrix * vec4<f32>(input.tangent, 0.0)).xyz);
    let bitangent = cross(normal, tangent);
    output.worldNormal = normal;
    output.worldTangent = tangent;
    output.worldBitangent = bitangent;

    // uv_vert
    output.uv = input.uv;

    // color_vert
    output.color = input.color;

    // shadow 坐标改在片元着色器内用 worldPosition × u_shadowVP 计算（见 standard.fragment）

    return output;
}
`;

// ============================================================================
// 标准光照/阴影/雾 WGSL 片段（共享：StandardMaterial + TerrainMaterial 等）
//
// 包含：lights_pars_frag（struct + binding）+ shadowmap_pars_frag（struct + binding + getShadow）
//       + 光照辅助函数（computeDistanceLightFalloff / calculateLightDiffuse / calculateLightSpecular）
//
// 不含：material_uniforms 绑定声明（各材质自带 XxxUniforms struct + 自行声明 binding(3)）。
// 各材质需保证 uniforms struct 含以下字段（同名同类型，供 standardLightingMainWGSL 引用）：
//   u_alphaThreshold/u_specular/u_glossiness/u_ambient/u_reflectivity/
//   u_fogMinDistance/u_fogMaxDistance/u_fogColor/u_fogDensity/u_fogMode
export const standardLightingParsWGSL = `
// ---- lights_pars_frag ----
struct DirectionalLightData {
    direction: vec3<f32>,
    intensity: f32,
    color: vec3<f32>,
    _pad0: f32,
}

struct PointLightData {
    position: vec3<f32>,
    range: f32,
    color: vec3<f32>,
    intensity: f32,
}

struct LightsUniform {
    u_directionalLight: DirectionalLightData,
    u_pointLightCount: f32,
    _pad0: f32,
    _pad1: f32,
    _pad2: f32,
    u_pointLights: array<PointLightData, 8>,
}

@group(0) @binding(4) var<uniform> lights: LightsUniform;

// ---- shadowmap_pars_frag ----
struct ShadowUniforms {
    u_shadowVP: mat4x4<f32>,
    u_lightPosition: vec3<f32>,
    u_shadowCameraNear: f32,
    u_shadowCameraFar: f32,
    u_shadowBias: f32,
    u_shadowEnabled: f32,
    _pad0: f32,
    _pad1: f32,
}

@group(0) @binding(5) var<uniform> shadowData: ShadowUniforms;

// ---- shadowmap_pars_frag: 阴影纹理 ----
// depth 纹理必须用 texture_depth_2d 声明 + sampler_comparison 比较采样器。
// textureSampleCompare 直接返回比较结果（1.0=照亮，0.0=阴影），硬件 PCF。
@group(2) @binding(0) var s_shadowMapSampler: sampler_comparison;
@group(2) @binding(1) var s_shadowMap: texture_depth_2d;

// ---- shadowmap_pars_frag: 阴影采样函数 ----
// shadowMap 为 depth 纹理，用 textureSampleCompare（比较采样器）直接做硬件深度比较。
// sampler.compare = 'less'：textureSampleCompare 比较 depth_ref < texel_depth，
// 即片元深度比存储的最近表面更近（没被遮挡）→ 1（照亮），否则 → 0（阴影）。
// 这是标准阴影映射约定。
fn getShadow(worldPosition: vec3<f32>) -> f32 {
    // 片元内投影：用 worldPosition × shadowVP 计算阴影坐标（与顶点投影等价，
    // 但避免了顶点→片元额外插值一个 vec4，且语义更清晰）。
    let shadowCoord = shadowData.u_shadowVP * vec4<f32>(worldPosition, 1.0);

    // 投影到 [0,1] 纹理 UV 空间。
    // X：标准映射 NDC x∈[-1,1] → U∈[0,1]（shadowCamera 用与观察相机相同的 lookAt 约定，
    //    渲染端与采样端共用同一 viewProjection，无 handedness 镜像）。
    // Y：WebGPU 纹理 V=0 在顶部、NDC Y=+1 在顶部，渲染到纹理时 V 与 NDC y 反向，需翻转。
    var uv = shadowCoord.xy / shadowCoord.w;
    uv = vec2<f32>((uv.x + 1.0) / 2.0, (1.0 - uv.y) / 2.0);

    // 参考深度（片元在光源空间的深度）：shadowCoord.z 是 VP 投影后的 clip z，投影矩阵
    // （setOrtho）将 [near,far] 映射到 [-1,1]（OpenGL 风格），WebGPU 光栅化把 clip z
    // 映射到 [0,1]（z*0.5+0.5）。shadowMap 存的是 [0,1] 的深度，参考深度也映射到 [0,1] 再加 bias。
    // 注：'ref' 是 WGSL 保留关键字，变量名用 depthRef。
    let depthRef = shadowCoord.z / shadowCoord.w * 0.5 + 0.5 + shadowData.u_shadowBias;

    // textureSampleCompare 要求 uniform control flow，不能放在依赖片元插值变量的 if 内。
    // 改为：始终在无条件流调用（uv 越界时由 sampler addressMode=clamp-to-edge 钳到边界，
    // 边界处深度为 clearValue=1.0，depthRef<1.0 → 比较为照亮），再用 select 在越界时强制返回 1.0。
    let inFrustum = uv.x >= 0.0 && uv.x <= 1.0 && uv.y >= 0.0 && uv.y <= 1.0 && depthRef <= 1.0 && depthRef >= 0.0;
    var shadow = textureSampleCompare(s_shadowMap, s_shadowMapSampler, uv, depthRef);

    return select(1.0, shadow, inFrustum);
}

// ---- lights_pars_frag: 光照辅助函数 ----
fn computeDistanceLightFalloff(lightDistance: f32, range: f32) -> f32 {
    return max(0.0, 1.0 - lightDistance / range);
}

fn calculateLightDiffuse(normal: vec3<f32>, lightDir: vec3<f32>) -> f32 {
    return clamp(dot(normal, lightDir), 0.0, 1.0);
}

fn calculateLightSpecular(normal: vec3<f32>, lightDir: vec3<f32>, viewDir: vec3<f32>, glossiness: f32) -> f32 {
    let halfVec = normalize(lightDir + viewDir);
    var specComp = max(dot(normal, halfVec), 0.0);
    return pow(specComp, glossiness);
}
`;

// ============================================================================
// 标准光照/阴影片元 main 片段（共享：StandardMaterial + TerrainMaterial）
//
// 完成 specular + ambient + lights + shadow 计算，把结果写入 finalColor。
// 调用方在 diffuse_frag 后调用本片段，之后可选择性插入 envmap_frag 等扩展，
// 最后再调用 standardFogMainWGSL 应用雾效。
//
// 引用以下变量（调用方需在拼接前已声明）：
//   - material_uniforms.{u_specular, u_glossiness, u_ambient}
//   - s_specular, s_specularSampler（@group(1) 各材质自行声明）
//   - input.worldPosition, input.worldNormal（FragmentInput）
//   - diffuseColor, normal（局部变量，调用方在 diffuse_frag 后已赋值）
//   - finalColor（调用方维护的输出颜色，本片段会用 resultColor 覆盖其 .rgb）
export const standardLightingMainWGSL = `
    // ---- specular_frag ----
    var glossiness: f32 = material_uniforms.u_glossiness;
    var specularColor: vec3<f32> = material_uniforms.u_specular.rgb;
    // 从 s_specular 纹理采样覆盖 specularColor 和 glossiness（对应 GLSL specular_frag）
    let specularMapColor = textureSample(s_specular, s_specularSampler, input.uv);
    specularColor = specularMapColor.rgb;
    glossiness = glossiness * specularMapColor.a;

    // ---- ambient_frag ----
    let ambientColor: vec3<f32> = material_uniforms.u_ambient.a * material_uniforms.u_ambient.rgb
        * globalUniforms.u_sceneAmbientColor.rgb * globalUniforms.u_sceneAmbientColor.a;

    // ---- lights_frag ----
    let viewDir = normalize(cameraUniforms.u_cameraPos - input.worldPosition);
    var resultColor: vec3<f32> = vec3<f32>(0.0, 0.0, 0.0);

    // 方向光
    let dirLight = lights.u_directionalLight;
    if (dirLight.intensity > 0.0) {
        let lightDir = normalize(-dirLight.direction);
        let diffuse = calculateLightDiffuse(normal, lightDir);
        let specular = calculateLightSpecular(normal, lightDir, viewDir, glossiness);
        resultColor += (diffuse * diffuseColor.rgb + specular * specularColor)
            * dirLight.color * dirLight.intensity;
    }

    // 点光源
    let count = u32(clamp(lights.u_pointLightCount, 0.0, 8.0));
    for (var i: u32 = 0u; i < count; i++) {
        let light = lights.u_pointLights[i];
        let lightOffset = light.position - input.worldPosition;
        let lightDir = normalize(lightOffset);
        let falloff = computeDistanceLightFalloff(length(lightOffset), light.range);
        let diffuse = calculateLightDiffuse(normal, lightDir);
        let specular = calculateLightSpecular(normal, lightDir, viewDir, glossiness);
        resultColor += (diffuse * diffuseColor.rgb + specular * specularColor)
            * light.color * light.intensity * falloff;
    }

    // 环境光
    resultColor += ambientColor * diffuseColor.rgb;

    // ---- shadowmap_frag: 阴影因子 ----
    if (shadowData.u_shadowEnabled > 0.5) {
        let shadow = getShadow(input.worldPosition);
        resultColor *= shadow;
    }

    finalColor = vec4<f32>(resultColor, diffuseColor.a);
`;

// ============================================================================
// 标准雾片元 main 片段（共享：StandardMaterial + TerrainMaterial）
//
// 在 lighting + 可选 envmap 之后调用，按 u_fogMode 应用雾混合。
// 引用：material_uniforms.{u_fogMode, u_fogDensity, u_fogMinDistance,
//   u_fogMaxDistance, u_fogColor} / cameraUniforms.u_cameraPos / input.worldPosition / finalColor
export const standardFogMainWGSL = `
    // ---- fog_frag ----
    if (material_uniforms.u_fogMode > 0.0) {
        let dist = distance(cameraUniforms.u_cameraPos, input.worldPosition);
        var fogFactor: f32;
        if (material_uniforms.u_fogMode == 1.0) {
            fogFactor = 1.0 - exp(-material_uniforms.u_fogDensity * dist);
        } else if (material_uniforms.u_fogMode == 2.0) {
            fogFactor = 1.0 - exp(-material_uniforms.u_fogDensity * material_uniforms.u_fogDensity * dist * dist);
        } else {
            let range = max(material_uniforms.u_fogMaxDistance - material_uniforms.u_fogMinDistance, 0.0001);
            fogFactor = clamp((dist - material_uniforms.u_fogMinDistance) / range, 0.0, 1.0);
        }
        finalColor = vec4<f32>(mix(finalColor.rgb, material_uniforms.u_fogColor.rgb, fogFactor), finalColor.a);
    }
`;

// ============================================================================
// 标准片段着色器 WGSL
//
// 从 standard.fragment.glsl + fragment modules 逐模块翻译。
//
// 数据流（与 GLSL 一致）：
//   color_frag     → finalColor = v_color
//   normal_frag    → normal = normalize(v_worldNormal) （法线贴图待后续）
//   diffuse_frag   → diffuseColor = finalColor * u_diffuse * texture(s_diffuse, uv)
//   alphatest_frag → discard if diffuseColor.a < u_alphaThreshold
//   specular_frag + ambient_frag + lights_frag + shadowmap_frag + fog_frag
//     → 由 standardLightingMainWGSL 共享片段提供
//
// 标准片段着色器代码
const standardFragmentWGSL = `
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
struct StandardUniforms {
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
}

@group(0) @binding(3) var<uniform> material_uniforms: StandardUniforms;

// ---- diffuse_pars_frag ----
@group(1) @binding(0) var s_diffuseSampler: sampler;
@group(1) @binding(1) var s_diffuse: texture_2d<f32>;
// ---- specular_pars_frag ----
@group(1) @binding(2) var s_specularSampler: sampler;
@group(1) @binding(3) var s_specular: texture_2d<f32>;
// ---- envmap_pars_frag ----
// 环境贴图（cube），用于反射高光。对照 src/shaders/modules/envmap_pars_frag.glsl。
@group(1) @binding(4) var s_envMapSampler: sampler;
@group(1) @binding(5) var s_envMap: texture_cube<f32>;

// ---- envmap_pars_frag: 环境反射函数 ----
// finalColor.rgb *= envColor.rgb * u_reflectivity
fn envmapMethod(finalColor: vec4<f32>, worldPosition: vec3<f32>, normal: vec3<f32>) -> vec4<f32> {
    let cameraToVertex = normalize(worldPosition - cameraUniforms.u_cameraPos);
    let reflectVec = reflect(cameraToVertex, normal);
    let envColor = textureSample(s_envMap, s_envMapSampler, reflectVec);

    return vec4<f32>(finalColor.rgb * (envColor.rgb * material_uniforms.u_reflectivity), finalColor.a);
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
    // 法线贴图待后续实现，暂用顶点法线
    let normal = normalize(input.worldNormal);

    // ---- diffuse_frag ----
    var diffuseColor: vec4<f32> = material_uniforms.u_diffuse;
    diffuseColor = finalColor * diffuseColor * textureSample(s_diffuse, s_diffuseSampler, input.uv);

    // ---- alphatest_frag ----
    if (diffuseColor.a < material_uniforms.u_alphaThreshold) {
        discard;
    }

    // ---- finalColor = diffuseColor ----
    finalColor = diffuseColor;

` + standardLightingMainWGSL + `

    // ---- envmap_frag ----
    // 环境反射（u_reflectivity > 0 时生效；默认 0 不影响非反射材质）
    if (material_uniforms.u_reflectivity > 0.0) {
        finalColor = envmapMethod(finalColor, input.worldPosition, normal);
    }

` + standardFogMainWGSL + `

    output.color = finalColor;
    return output;
}
`;
