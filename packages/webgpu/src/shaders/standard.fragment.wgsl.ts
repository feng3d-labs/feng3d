/**
 * 标准片段着色器 WGSL 框架
 */

/**
 * 标准片段着色器代码框架
 */
export const standardFragmentWGSL = `
// 引入通用工具函数
${/* 这里会在编译时引入 common.wgsl */''}

struct FragmentInput {
    @location(0) worldPosition: vec3<f32>,
    @location(1) worldNormal: vec3<f32>,
    @location(2) worldTangent: vec3<f32>,
    @location(3) uv: vec2<f32>,
    @location(4) color: vec4<f32>,
}

struct FragmentOutput {
    @location(0) color: vec4<f32>,
}

struct MaterialUniforms {
    baseColor: vec4<f32>,
    metallic: f32,
    roughness: f32,
    emissive: vec3<f32>,
    ambient: vec3<f32>,
}

struct LightUniforms {
    lightPosition: vec3<f32>,
    lightDirection: vec3<f32>,
    lightColor: vec3<f32>,
    lightIntensity: f32,
    lightType: u32,
}

struct CameraUniforms {
    cameraPosition: vec3<f32>,
}

@group(0) @binding(1) var<uniform> material: MaterialUniforms;
@group(0) @binding(2) var<uniform> light: LightUniforms;
@group(0) @binding(3) var<uniform> camera: CameraUniforms;

@group(1) @binding(0) var baseTextureSampler: sampler;
@group(1) @binding(1) var baseTexture: texture_2d<f32>;
@group(1) @binding(2) var normalTextureSampler: sampler;
@group(1) @binding(3) var normalTexture: texture_2d<f32>;

// 计算漫反射光照
fn calculateDiffuse(normal: vec3<f32>, lightDir: vec3<f32>, lightColor: vec3<f32>, intensity: f32) -> vec3<f32> {
    let NdotL = max(dot(normal, lightDir), 0.0);
    return lightColor * intensity * NdotL;
}

// 计算高光反射（简化的 Blinn-Phong）
fn calculateSpecular(normal: vec3<f32>, lightDir: vec3<f32>, viewDir: vec3<f32>, lightColor: vec3<f32>, intensity: f32, shininess: f32) -> vec3<f32> {
    let halfDir = normalize(lightDir + viewDir);
    let NdotH = max(dot(normal, halfDir), 0.0);
    return lightColor * intensity * pow(NdotH, shininess);
}

@fragment
fn main(input: FragmentInput) -> FragmentOutput {
    var output: FragmentOutput;

    // 获取基础颜色
    var baseColor = material.baseColor;
    // 如果有纹理，采样纹理颜色
    // baseColor = textureSample(baseTexture, baseTextureSampler, input.uv);

    // 计算法线
    var normal = normalize(input.worldNormal);
    // 如果有法线贴图，应用法线贴图
    // let mapNormal = textureSample(normalTexture, normalTextureSampler, input.uv);
    // normal = perturbNormal(normal, input.worldTangent, cross(normal, input.worldTangent), mapNormal);

    // 计算光照
    let lightDir = normalize(-light.lightDirection);
    let viewDir = normalize(camera.cameraPosition - input.worldPosition);

    // 漫反射
    let diffuse = calculateDiffuse(normal, lightDir, light.lightColor, light.lightIntensity);

    // 高光
    let shininess = 32.0 * (1.0 - material.roughness);
    let specular = calculateSpecular(normal, lightDir, viewDir, light.lightColor, light.lightIntensity, shininess);

    // 最终颜色
    let ambient = material.ambient * baseColor.rgb;
    let finalColor = ambient + diffuse * baseColor.rgb + specular * material.metallic + material.emissive;

    output.color = vec4<f32>(finalColor, baseColor.a);

    return output;
}
`;

/**
 * 标准片段着色器导出
 */
export default standardFragmentWGSL;