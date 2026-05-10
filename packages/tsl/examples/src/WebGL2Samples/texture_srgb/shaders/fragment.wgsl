@group(0) @binding(1) var materialDiffuse_texture: texture_2d<f32>;
@group(0) @binding(2) var materialDiffuse: sampler;

// 使用 vec4 打包两个 vec2 坐标，减少 location 使用
struct VaryingStruct {
    @location(0) v_st: vec2<f32>,
    // 垂直方向模糊坐标 (打包为 vec4: xy = [i], zw = [i+1])
    @location(1) v_blur_01: vec4<f32>,
    @location(2) v_blur_23: vec4<f32>,
    @location(3) v_blur_45: vec4<f32>,
    @location(4) v_blur_67: vec4<f32>,
    @location(5) v_blur_89: vec4<f32>,
    @location(6) v_blur_AB: vec4<f32>,
    @location(7) v_blur_CD: vec4<f32>,
    // 水平方向模糊坐标 (打包为 vec4: xy = [i], zw = [i+1])
    @location(8) h_blur_01: vec4<f32>,
    @location(9) h_blur_23: vec4<f32>,
    @location(10) h_blur_45: vec4<f32>,
    @location(11) h_blur_67: vec4<f32>,
    @location(12) h_blur_89: vec4<f32>,
    @location(13) h_blur_AB: vec4<f32>,
    @location(14) h_blur_CD: vec4<f32>,
}

fn rgbToSrgb(colorRGB: vec3<f32>, gammaCorrection: f32) -> vec3<f32> {
    let clampedColorRGB = clamp(colorRGB, vec3<f32>(0.0), vec3<f32>(1.0));
    let threshold = vec3<f32>(0.0031308);
    let lowValue = clampedColorRGB * 12.92;
    let highValue = pow(clampedColorRGB, vec3<f32>(gammaCorrection)) * 1.055 - vec3<f32>(0.055);
    return select(highValue, lowValue, clampedColorRGB < threshold);
}

fn contrastSaturationBrightness(color: vec3<f32>, brt: f32, sat: f32, con: f32) -> vec3<f32> {
    let lumCoeff = vec3<f32>(0.2125, 0.7154, 0.0721);
    let brtColor = color * brt;
    let intensity = vec3<f32>(dot(brtColor, lumCoeff));
    let satColor = mix(intensity, brtColor, sat);
    let conColor = mix(vec3<f32>(0.5), satColor, con);
    return conColor;
}

@fragment
fn main(v: VaryingStruct) -> @location(0) vec4<f32> {
    let sampleCoord = fract(v.v_st);

    // sRGB 纹理采样（GPU 自动将 sRGB 转换为线性 RGB）
    var colorRgb = vec4<f32>(textureSample(materialDiffuse_texture, materialDiffuse, v.v_st).rgb, 1.0);

    // 垂直方向高斯模糊（从 vec4 解包 vec2）
    colorRgb = mix(colorRgb, textureSample(materialDiffuse_texture, materialDiffuse, v.v_blur_01.xy), sampleCoord.y);
    colorRgb = mix(colorRgb, textureSample(materialDiffuse_texture, materialDiffuse, v.v_blur_01.zw), sampleCoord.y);
    colorRgb = mix(colorRgb, textureSample(materialDiffuse_texture, materialDiffuse, v.v_blur_23.xy), sampleCoord.y);
    colorRgb = mix(colorRgb, textureSample(materialDiffuse_texture, materialDiffuse, v.v_blur_23.zw), sampleCoord.y);
    colorRgb = mix(colorRgb, textureSample(materialDiffuse_texture, materialDiffuse, v.v_blur_45.xy), sampleCoord.y);
    colorRgb = mix(colorRgb, textureSample(materialDiffuse_texture, materialDiffuse, v.v_blur_45.zw), sampleCoord.y);
    colorRgb = mix(colorRgb, textureSample(materialDiffuse_texture, materialDiffuse, v.v_blur_67.xy), sampleCoord.y);
    colorRgb = mix(colorRgb, textureSample(materialDiffuse_texture, materialDiffuse, v.v_blur_67.zw), sampleCoord.y);
    colorRgb = mix(colorRgb, textureSample(materialDiffuse_texture, materialDiffuse, v.v_blur_89.xy), sampleCoord.y);
    colorRgb = mix(colorRgb, textureSample(materialDiffuse_texture, materialDiffuse, v.v_blur_89.zw), sampleCoord.y);
    colorRgb = mix(colorRgb, textureSample(materialDiffuse_texture, materialDiffuse, v.v_blur_AB.xy), sampleCoord.y);
    colorRgb = mix(colorRgb, textureSample(materialDiffuse_texture, materialDiffuse, v.v_blur_AB.zw), sampleCoord.y);
    colorRgb = mix(colorRgb, textureSample(materialDiffuse_texture, materialDiffuse, v.v_blur_CD.xy), sampleCoord.y);
    colorRgb = mix(colorRgb, textureSample(materialDiffuse_texture, materialDiffuse, v.v_blur_CD.zw), sampleCoord.y);

    // 水平方向高斯模糊（从 vec4 解包 vec2）
    colorRgb = mix(colorRgb, textureSample(materialDiffuse_texture, materialDiffuse, v.h_blur_01.xy), sampleCoord.x);
    colorRgb = mix(colorRgb, textureSample(materialDiffuse_texture, materialDiffuse, v.h_blur_01.zw), sampleCoord.x);
    colorRgb = mix(colorRgb, textureSample(materialDiffuse_texture, materialDiffuse, v.h_blur_23.xy), sampleCoord.x);
    colorRgb = mix(colorRgb, textureSample(materialDiffuse_texture, materialDiffuse, v.h_blur_23.zw), sampleCoord.x);
    colorRgb = mix(colorRgb, textureSample(materialDiffuse_texture, materialDiffuse, v.h_blur_45.xy), sampleCoord.x);
    colorRgb = mix(colorRgb, textureSample(materialDiffuse_texture, materialDiffuse, v.h_blur_45.zw), sampleCoord.x);
    colorRgb = mix(colorRgb, textureSample(materialDiffuse_texture, materialDiffuse, v.h_blur_67.xy), sampleCoord.x);
    colorRgb = mix(colorRgb, textureSample(materialDiffuse_texture, materialDiffuse, v.h_blur_67.zw), sampleCoord.x);
    colorRgb = mix(colorRgb, textureSample(materialDiffuse_texture, materialDiffuse, v.h_blur_89.xy), sampleCoord.x);
    colorRgb = mix(colorRgb, textureSample(materialDiffuse_texture, materialDiffuse, v.h_blur_89.zw), sampleCoord.x);
    colorRgb = mix(colorRgb, textureSample(materialDiffuse_texture, materialDiffuse, v.h_blur_AB.xy), sampleCoord.x);
    colorRgb = mix(colorRgb, textureSample(materialDiffuse_texture, materialDiffuse, v.h_blur_AB.zw), sampleCoord.x);
    colorRgb = mix(colorRgb, textureSample(materialDiffuse_texture, materialDiffuse, v.h_blur_CD.xy), sampleCoord.x);
    colorRgb = mix(colorRgb, textureSample(materialDiffuse_texture, materialDiffuse, v.h_blur_CD.zw), sampleCoord.x);

    let brightness = 1.0;
    let saturation = 0.5;
    let contrast = 1.0;
    let adjustedColor = contrastSaturationBrightness(colorRgb.rgb, brightness, saturation, contrast);
    return vec4<f32>(rgbToSrgb(adjustedColor, 0.41666), 1.0);
}
