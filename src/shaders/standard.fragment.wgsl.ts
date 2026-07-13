/**
 * 标准片段着色器 WGSL（v2 - location layout fixed）
 *
 * 从 standard.fragment.glsl + fragment modules 逐模块翻译。
 *
 * 数据流（与 GLSL 一致）：
 *   color_frag     → finalColor = v_color
 *   normal_frag    → normal = normalize(v_worldNormal) （法线贴图待后续）
 *   diffuse_frag   → diffuseColor = finalColor * u_diffuse * texture(s_diffuse, uv)
 *   alphatest_frag → discard if diffuseColor.a < u_alphaThreshold
 *   specular_frag  → specularColor, glossiness
 *   ambient_frag   → ambientColor = u_ambient.a * u_ambient.rgb * u_sceneAmbientColor.rgb * u_sceneAmbientColor.a
 *   lights_frag    → resultColor += (diffuse * diffuseColor + specular * specularColor) * lightColor * intensity * falloff
 *                    resultColor += ambientColor * diffuseColor
 *   envmap_frag    → finalColor.rgb *= envColor * u_reflectivity （待后续）
 *   fog_frag       → mix(finalColor, fogColor, fogFactor)
 */

/**
 * 标准片段着色器代码
 */
export const standardFragmentWGSL = `
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
    u_splatEnabled: f32,
}

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

@group(0) @binding(1) var<uniform> cameraUniforms: CameraUniforms;
@group(0) @binding(2) var<uniform> globalUniforms: GlobalUniforms;
@group(0) @binding(3) var<uniform> material_uniforms: StandardUniforms;
@group(0) @binding(4) var<uniform> lights: LightsUniform;

// ---- diffuse_pars_frag ----
@group(1) @binding(0) var s_diffuseSampler: sampler;
@group(1) @binding(1) var s_diffuse: texture_2d<f32>;
// ---- specular_pars_frag ----
@group(1) @binding(2) var s_specularSampler: sampler;
@group(1) @binding(3) var s_specular: texture_2d<f32>;

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

    finalColor = vec4<f32>(resultColor, diffuseColor.a);

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

    output.color = finalColor;
    return output;
}
`;
