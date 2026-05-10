import { func, attribute, clamp, dot, fract, fragment, fragColor, gl_Position, lessThan, let_, mat4, mix, pow, precision, return_, sampler2D, texture, uniform, var_, varying, vec2, vec3, vec4, vertex, float } from '@feng3d/tsl';

// ============================================================================
// 辅助函数（对应 GLSL 中的函数定义）
// ============================================================================

const rgbToSrgb = func('rgbToSrgb', [['colorRGB', vec3], ['gammaCorrection', float]], vec3, (colorRGB, gammaCorrection) =>
{
    const clampedColorRGB = let_('clampedColorRGB', clamp(colorRGB, 0.0, 1.0));

    return_(mix(
        pow(clampedColorRGB, vec3(gammaCorrection)).multiply(1.055).subtract(0.055),
        clampedColorRGB.multiply(12.92),
        lessThan(clampedColorRGB, vec3(0.0031308)),
    ));
});

/**
 * 对比度、饱和度、亮度调整
 * 对应 GLSL: vec3 contrastSaturationBrightness(vec3 color, float brt, float sat, float con)
 *
 * 所有设置: 1.0 = 100%, 0.5 = 50%, 1.5 = 150%
 */
const contrastSaturationBrightness = func('contrastSaturationBrightness', [['color', vec3], ['brt', float], ['sat', float], ['con', float]], vec3, (color, brt, sat, con) =>
{
    // 亮度系数（用于计算灰度）
    const lumCoeff = let_('lumCoeff', vec3(0.2125, 0.7154, 0.0721));

    const brtColor = let_('brtColor', color.multiply(brt));
    const intensity = let_('intensity', vec3(dot(brtColor, lumCoeff)));
    const satColor = let_('satColor', mix(intensity, brtColor, sat));
    const conColor = let_('conColor', mix(vec3(0.5), satColor, con));

    return_(conColor);
});

// ============================================================================
// 着色器变量定义
// ============================================================================

// 顶点属性
const position = attribute('position', vec2(), 0);
const textureCoordinates = attribute('textureCoordinates', vec2(), 4);

// Uniform 变量
const mvp = uniform('mvp', mat4());

// Varying 变量
// 使用 vec4 打包两个 vec2 坐标，减少 location 使用
// 总计: 1 (v_st) + 7 (垂直) + 7 (水平) = 15 个 location
const v_st = varying('v_st', vec2(), { location: 0 });

// 垂直方向模糊坐标 (打包为 vec4: xy = [i], zw = [i+1])
const v_blur_01 = varying('v_blur_01', vec4(), { location: 1 });
const v_blur_23 = varying('v_blur_23', vec4(), { location: 2 });
const v_blur_45 = varying('v_blur_45', vec4(), { location: 3 });
const v_blur_67 = varying('v_blur_67', vec4(), { location: 4 });
const v_blur_89 = varying('v_blur_89', vec4(), { location: 5 });
const v_blur_AB = varying('v_blur_AB', vec4(), { location: 6 });
const v_blur_CD = varying('v_blur_CD', vec4(), { location: 7 });

// 水平方向模糊坐标 (打包为 vec4: xy = [i], zw = [i+1])
const h_blur_01 = varying('h_blur_01', vec4(), { location: 8 });
const h_blur_23 = varying('h_blur_23', vec4(), { location: 9 });
const h_blur_45 = varying('h_blur_45', vec4(), { location: 10 });
const h_blur_67 = varying('h_blur_67', vec4(), { location: 11 });
const h_blur_89 = varying('h_blur_89', vec4(), { location: 12 });
const h_blur_AB = varying('h_blur_AB', vec4(), { location: 13 });
const h_blur_CD = varying('h_blur_CD', vec4(), { location: 14 });

/**
 * 顶点着色器
 * 传递纹理坐标并应用 MVP 变换，计算模糊采样坐标（打包为 vec4）
 */
export const vertexShader = vertex('main', () =>
{
    precision('highp', 'float');
    precision('highp', 'int');

    v_st.assign(textureCoordinates);
    gl_Position.assign(mvp.multiply(vec4(position, 0.0, 1.0)));

    // 垂直方向模糊坐标 (打包为 vec4)
    v_blur_01.assign(vec4(v_st.add(vec2(0.0, -0.050)), v_st.add(vec2(0.0, -0.036))));
    v_blur_23.assign(vec4(v_st.add(vec2(0.0, -0.020)), v_st.add(vec2(0.0, -0.016))));
    v_blur_45.assign(vec4(v_st.add(vec2(0.0, -0.012)), v_st.add(vec2(0.0, -0.008))));
    v_blur_67.assign(vec4(v_st.add(vec2(0.0, -0.004)), v_st.add(vec2(0.0, 0.004))));
    v_blur_89.assign(vec4(v_st.add(vec2(0.0, 0.008)), v_st.add(vec2(0.0, 0.012))));
    v_blur_AB.assign(vec4(v_st.add(vec2(0.0, 0.016)), v_st.add(vec2(0.0, 0.020))));
    v_blur_CD.assign(vec4(v_st.add(vec2(0.0, 0.036)), v_st.add(vec2(0.0, 0.050))));

    // 水平方向模糊坐标 (打包为 vec4)
    h_blur_01.assign(vec4(v_st.add(vec2(-0.050, 0.0)), v_st.add(vec2(-0.036, 0.0))));
    h_blur_23.assign(vec4(v_st.add(vec2(-0.020, 0.0)), v_st.add(vec2(-0.016, 0.0))));
    h_blur_45.assign(vec4(v_st.add(vec2(-0.012, 0.0)), v_st.add(vec2(-0.008, 0.0))));
    h_blur_67.assign(vec4(v_st.add(vec2(-0.004, 0.0)), v_st.add(vec2(0.004, 0.0))));
    h_blur_89.assign(vec4(v_st.add(vec2(0.008, 0.0)), v_st.add(vec2(0.012, 0.0))));
    h_blur_AB.assign(vec4(v_st.add(vec2(0.016, 0.0)), v_st.add(vec2(0.020, 0.0))));
    h_blur_CD.assign(vec4(v_st.add(vec2(0.036, 0.0)), v_st.add(vec2(0.050, 0.0))));
});

// 纹理采样器
const materialDiffuse = sampler2D(uniform('materialDiffuse'));

/**
 * 片段着色器
 * 1. 从 sRGB 纹理采样（自动转换为线性 RGB）
 * 2. 应用完整的 14 点高斯模糊滤波器（从 vec4 解包 vec2）
 * 3. 应用亮度、饱和度、对比度调整
 * 4. 使用正确的 gamma 校正转回 sRGB（包含 lessThan 分支）
 */
export const fragmentShader = fragment('main', () =>
{
    precision('highp', 'float');
    precision('highp', 'int');

    // 获取采样坐标的小数部分（用于混合权重）
    const sampleCoord = let_('sampleCoord', fract(v_st));

    // 从 sRGB 纹理采样（GPU 自动将 sRGB 转换为线性 RGB）
    // 使用 var_ 而不是 let_，因为 colorRgb 会被多次重新赋值
    // 在 WGSL 中，let 是不可变的，var 是可变的
    const colorRgb = var_('colorRgb', vec4(texture(materialDiffuse, v_st).xyz, 1.0));

    // 垂直方向模糊采样（14 点，从 vec4 解包 vec2）
    colorRgb.assign(mix(colorRgb, texture(materialDiffuse, v_blur_01.xy), sampleCoord.y));
    colorRgb.assign(mix(colorRgb, texture(materialDiffuse, v_blur_01.zw), sampleCoord.y));
    colorRgb.assign(mix(colorRgb, texture(materialDiffuse, v_blur_23.xy), sampleCoord.y));
    colorRgb.assign(mix(colorRgb, texture(materialDiffuse, v_blur_23.zw), sampleCoord.y));
    colorRgb.assign(mix(colorRgb, texture(materialDiffuse, v_blur_45.xy), sampleCoord.y));
    colorRgb.assign(mix(colorRgb, texture(materialDiffuse, v_blur_45.zw), sampleCoord.y));
    colorRgb.assign(mix(colorRgb, texture(materialDiffuse, v_blur_67.xy), sampleCoord.y));
    colorRgb.assign(mix(colorRgb, texture(materialDiffuse, v_blur_67.zw), sampleCoord.y));
    colorRgb.assign(mix(colorRgb, texture(materialDiffuse, v_blur_89.xy), sampleCoord.y));
    colorRgb.assign(mix(colorRgb, texture(materialDiffuse, v_blur_89.zw), sampleCoord.y));
    colorRgb.assign(mix(colorRgb, texture(materialDiffuse, v_blur_AB.xy), sampleCoord.y));
    colorRgb.assign(mix(colorRgb, texture(materialDiffuse, v_blur_AB.zw), sampleCoord.y));
    colorRgb.assign(mix(colorRgb, texture(materialDiffuse, v_blur_CD.xy), sampleCoord.y));
    colorRgb.assign(mix(colorRgb, texture(materialDiffuse, v_blur_CD.zw), sampleCoord.y));

    // 水平方向模糊采样（14 点，从 vec4 解包 vec2）
    colorRgb.assign(mix(colorRgb, texture(materialDiffuse, h_blur_01.xy), sampleCoord.x));
    colorRgb.assign(mix(colorRgb, texture(materialDiffuse, h_blur_01.zw), sampleCoord.x));
    colorRgb.assign(mix(colorRgb, texture(materialDiffuse, h_blur_23.xy), sampleCoord.x));
    colorRgb.assign(mix(colorRgb, texture(materialDiffuse, h_blur_23.zw), sampleCoord.x));
    colorRgb.assign(mix(colorRgb, texture(materialDiffuse, h_blur_45.xy), sampleCoord.x));
    colorRgb.assign(mix(colorRgb, texture(materialDiffuse, h_blur_45.zw), sampleCoord.x));
    colorRgb.assign(mix(colorRgb, texture(materialDiffuse, h_blur_67.xy), sampleCoord.x));
    colorRgb.assign(mix(colorRgb, texture(materialDiffuse, h_blur_67.zw), sampleCoord.x));
    colorRgb.assign(mix(colorRgb, texture(materialDiffuse, h_blur_89.xy), sampleCoord.x));
    colorRgb.assign(mix(colorRgb, texture(materialDiffuse, h_blur_89.zw), sampleCoord.x));
    colorRgb.assign(mix(colorRgb, texture(materialDiffuse, h_blur_AB.xy), sampleCoord.x));
    colorRgb.assign(mix(colorRgb, texture(materialDiffuse, h_blur_AB.zw), sampleCoord.x));
    colorRgb.assign(mix(colorRgb, texture(materialDiffuse, h_blur_CD.xy), sampleCoord.x));
    colorRgb.assign(mix(colorRgb, texture(materialDiffuse, h_blur_CD.zw), sampleCoord.x));

    const brightness = let_('brightness', float(1.0));
    const saturation = let_('saturation', float(0.5));
    const contrast = let_('contrast', float(1.0));
    colorRgb.assign(vec4(contrastSaturationBrightness(colorRgb.rgb, brightness, saturation, contrast), 1.0));

    const color = vec4(fragColor(0, 'color'));
    color.assign(vec4(rgbToSrgb(colorRgb.rgb, float(0.41666)), 1.0));
});
