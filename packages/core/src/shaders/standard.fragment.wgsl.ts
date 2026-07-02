/**
 * 标准片段着色器 WGSL
 *
 * 第一阶段实现：漫反射纹理采样 + 材质颜色 + 场景环境光。
 * 光照数组（点光源/方向光/聚光灯）、法线贴图、高光、环境反射、雾效等待后续迭代补全。
 *
 * 绑定约定：
 * - @group(0) @binding(2) var<uniform> globalUniforms - { u_sceneAmbientColor: vec4, _Time: vec4 }
 * - @group(0) @binding(3) var<uniform> material_uniforms        - StandardUniforms（材质参数，见下）
 * - @group(1) @binding(0) var s_diffuseSampler: sampler
 * - @group(1) @binding(1) var s_diffuse: texture_2d<f32>
 *
 * 注意：StandardUniforms 中纹理字段（s_diffuse/s_normal/s_specular/s_ambient/s_envMap）
 * 会被剔除出 uniform 数据，作为独立的纹理绑定（见 MaterialPipeline.buildMaterialBindingResources）。
 * 为了使 uniform 缓冲区大小确定，WGSL StandardUniforms struct 仅声明标量/向量字段。
 */

/**
 * 标准片段着色器代码
 */
export const standardFragmentWGSL = `
struct FragmentInput {
    @location(0) worldPosition: vec3<f32>,
    @location(1) worldNormal: vec3<f32>,
    @location(2) uv: vec2<f32>,
    @location(3) color: vec4<f32>,
}

struct FragmentOutput {
    @location(0) color: vec4<f32>,
}

struct GlobalUniforms {
    u_sceneAmbientColor: vec4<f32>,
    _Time: vec4<f32>,
}

struct CameraUniforms {
    u_projectionMatrix: mat4x4<f32>,
    u_viewProjection: mat4x4<f32>,
    u_viewMatrix: mat4x4<f32>,
    u_cameraMatrix: mat4x4<f32>,
    u_cameraPos: vec3<f32>,
    u_skyBoxSize: f32,
    u_scaleByDepth: f32,
}

// 仅标量/向量字段；纹理字段单独绑定
struct StandardUniforms {
    u_PointSize: f32,
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

@group(0) @binding(1) var<uniform> cameraUniforms: CameraUniforms;
@group(0) @binding(2) var<uniform> globalUniforms: GlobalUniforms;
@group(0) @binding(3) var<uniform> material_uniforms: StandardUniforms;

@group(1) @binding(0) var s_diffuseSampler: sampler;
@group(1) @binding(1) var s_diffuse: texture_2d<f32>;

@fragment
fn main(input: FragmentInput) -> FragmentOutput {
    var output: FragmentOutput;

    // 1. 基础颜色 = 漫反射纹理 * 材质 u_diffuse
    let texColor = textureSample(s_diffuse, s_diffuseSampler, input.uv);
    var baseColor = texColor * material_uniforms.u_diffuse * input.color;

    // 2. 透明度测试
    if (material_uniforms.u_alphaThreshold > 0.0 && baseColor.a < material_uniforms.u_alphaThreshold) {
        discard;
    }

    // 3. 环境光（来自场景）
    let ambient = globalUniforms.u_sceneAmbientColor.rgb * material_uniforms.u_ambient.rgb;

    // 4. 最终颜色（暂只用环境光，光照数组待补全）
    var finalColor = baseColor.rgb * (vec3<f32>(1.0, 1.0, 1.0) + ambient);

    output.color = vec4<f32>(finalColor, baseColor.a);

    return output;
}
`;

/**
 * 标准片段着色器导出
 */
export default standardFragmentWGSL;
