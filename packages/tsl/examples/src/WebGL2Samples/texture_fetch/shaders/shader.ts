import { attribute, fragColor, fract, fragment, gl_Position, ivec2, let_, mat4, mix, precision, sampler2D, texelFetch, textureSize, uniform, varying, vec2, vec4, vertex } from '@feng3d/tsl';

// 顶点属性
const position = attribute('position', vec2(), 0);
const texcoord = attribute('texcoord', vec2(), 4);

// Uniform 变量
const MVP = uniform('MVP', mat4());

// Varying 变量
const v_st = varying('v_st', vec2());

/**
 * 顶点着色器
 * 传递纹理坐标并应用 MVP 变换
 */
export const vertexShader = vertex('main', () =>
{
    precision('highp', 'float');
    precision('highp', 'int');

    v_st.assign(texcoord);
    gl_Position.assign(MVP.multiply(vec4(position, 0.0, 1.0)));
});

// 纹理采样器
const diffuse = sampler2D(uniform('diffuse'));

// 片段输出颜色
const color = vec4(fragColor(0, 'color'));

/**
 * 片段着色器
 * 使用 texelFetch 实现手动双线性过滤
 * texelFetch 直接获取单个纹素，不进行任何过滤
 *
 * 注意：使用 let_ 创建局部变量，确保生成的 GLSL 代码与原始代码结构一致
 */
export const fragmentShader = fragment('main', () =>
{
    precision('highp', 'float');
    precision('highp', 'int');

    // 获取纹理尺寸减 1（转换为 vec2）
    // 原始 GLSL: vec2 size = vec2(textureSize(diffuse, 0) - 1);
    const size = let_('size', vec2(textureSize(diffuse, 0).subtract(1)));

    // 计算浮点纹理坐标（像素坐标）
    // 原始 GLSL: vec2 texcoord = v_st * size;
    const texcoordF = let_('texcoord', v_st.multiply(size));

    // 转换为整数坐标（左下角纹素）
    // 原始 GLSL: ivec2 coord = ivec2(texcoord);
    const coord = let_('coord', ivec2(texcoordF));

    // 获取四个相邻纹素的颜色
    const texel00 = let_('texel00', texelFetch(diffuse, coord.add(ivec2(0, 0)), 0));
    const texel10 = let_('texel10', texelFetch(diffuse, coord.add(ivec2(1, 0)), 0));
    const texel11 = let_('texel11', texelFetch(diffuse, coord.add(ivec2(1, 1)), 0));
    const texel01 = let_('texel01', texelFetch(diffuse, coord.add(ivec2(0, 1)), 0));

    // 获取小数部分（用于插值权重）
    // 原始 GLSL: vec2 sampleCoord = fract(texcoord.xy);
    const sampleCoord = let_('sampleCoord', fract(texcoordF));

    // 在 Y 方向插值
    const texel0 = let_('texel0', mix(texel00, texel01, sampleCoord.y));
    const texel1 = let_('texel1', mix(texel10, texel11, sampleCoord.y));

    // 在 X 方向插值，得到最终颜色
    color.assign(mix(texel0, texel1, sampleCoord.x));
});

