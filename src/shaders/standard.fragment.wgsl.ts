/**
 * 标准片段着色器 WGSL
 *
 * Blinn-Phong 光照：环境光 + 方向光 + 点光源（漫反射 + 镜面高光）+ 雾效。
 *
 * 绑定约定：
 * - @group(0) @binding(2) var<uniform> globalUniforms - { u_sceneAmbientColor: vec4, _Time: vec4 }
 * - @group(0) @binding(3) var<uniform> material_uniforms - StandardUniforms（材质参数）
 * - @group(0) @binding(4) var<uniform> lights - LightsUniform（光源数据）
 * - @group(1) @binding(0) var s_diffuseSampler: sampler
 * - @group(1) @binding(1) var s_diffuse: texture_2d<f32>
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

@group(0) @binding(1) var<uniform> cameraUniforms: CameraUniforms;
@group(0) @binding(2) var<uniform> globalUniforms: GlobalUniforms;
@group(0) @binding(3) var<uniform> material_uniforms: StandardUniforms;
@group(0) @binding(4) var<uniform> lights: LightsUniform;

@group(1) @binding(0) var s_diffuseSampler: sampler;
@group(1) @binding(1) var s_diffuse: texture_2d<f32>;
@group(1) @binding(2) var s_normal: texture_2d<f32>;
@group(1) @binding(3) var s_blendTexture: texture_2d<f32>;
@group(1) @binding(4) var s_splatTexture1Sampler: sampler;
@group(1) @binding(5) var s_splatTexture1: texture_2d<f32>;
@group(1) @binding(6) var s_splatTexture2Sampler: sampler;
@group(1) @binding(7) var s_splatTexture2: texture_2d<f32>;
@group(1) @binding(8) var s_splatTexture3Sampler: sampler;
@group(1) @binding(9) var s_splatTexture3: texture_2d<f32>;

@fragment
fn main(input: FragmentInput) -> FragmentOutput {
    var output: FragmentOutput;

    // 1. 基础颜色 = 漫反射纹理 * 材质 u_diffuse * 顶点颜色
    let texColor = textureSample(s_diffuse, s_diffuseSampler, input.uv);
    var baseColor: vec4<f32> = texColor * material_uniforms.u_diffuse * input.color;

    // 2. 地形 splat 纹理混合
    let blend = textureSample(s_blendTexture, s_diffuseSampler, input.uv);
    if (blend.r > 0.0 || blend.g > 0.0 || blend.b > 0.0) {
        let splatUV = input.uv * 50.0;
        let splat1 = textureSample(s_splatTexture1, s_splatTexture1Sampler, splatUV).rgb;
        let splat2 = textureSample(s_splatTexture2, s_splatTexture2Sampler, splatUV).rgb;
        let splat3 = textureSample(s_splatTexture3, s_splatTexture3Sampler, splatUV).rgb;
        var splatColor = baseColor.rgb;
        splatColor = mix(splatColor, splat1, blend.r);
        splatColor = mix(splatColor, splat2, blend.g);
        splatColor = mix(splatColor, splat3, blend.b);
        baseColor = vec4<f32>(splatColor, baseColor.a);
    }

    // 2. 透明度测试
    if (material_uniforms.u_alphaThreshold > 0.0 && baseColor.a < material_uniforms.u_alphaThreshold) {
        discard;
    }

    // 3. Blinn-Phong 光照
    let N = normalize(input.worldNormal);
    let V = normalize(cameraUniforms.u_cameraPos - input.worldPosition);

    // 环境光
    var lighting: vec3<f32> = globalUniforms.u_sceneAmbientColor.rgb * material_uniforms.u_ambient.rgb;

    // 方向光（漫反射 + 镜面高光）
    let dirLight = lights.u_directionalLight;
    if (dirLight.intensity > 0.0) {
        let L = normalize(-dirLight.direction);
        let NdotL = max(dot(N, L), 0.0);
        let H = normalize(L + V);
        let NdotH = max(dot(N, H), 0.0);
        let spec = pow(NdotH, material_uniforms.u_glossiness);
        let lightColor = dirLight.color * dirLight.intensity;
        lighting += lightColor * NdotL;
        lighting += lightColor * spec * material_uniforms.u_specular.rgb;
    }

    // 点光源（带距离衰减）
    let count = u32(clamp(lights.u_pointLightCount, 0.0, 8.0));
    for (var i: u32 = 0u; i < count; i++) {
        let light = lights.u_pointLights[i];
        let toLight = light.position - input.worldPosition;
        let dist = length(toLight);
        let L = toLight / max(dist, 0.001);
        let atten = max(1.0 - dist / max(light.range, 0.001), 0.0);
        let NdotL = max(dot(N, L), 0.0);
        let H = normalize(L + V);
        let NdotH = max(dot(N, H), 0.0);
        let spec = pow(NdotH, material_uniforms.u_glossiness);
        let lightColor = light.color * light.intensity * atten;
        lighting += lightColor * NdotL;
        lighting += lightColor * spec * material_uniforms.u_specular.rgb;
    }

    let fogged = mix(baseColor.rgb, baseColor.rgb * lighting, vec3<f32>(1.0));
    baseColor = vec4<f32>(baseColor.rgb * lighting, baseColor.a);

    // 4. 雾效
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
        baseColor = vec4<f32>(mix(baseColor.rgb, material_uniforms.u_fogColor.rgb, fogFactor), baseColor.a);
    }

    output.color = baseColor;

    return output;
}
`;
