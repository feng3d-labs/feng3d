import { attribute, fragColor, fragment, gl_Position, ivec2, let_, mat4, precision, sampler2D, texelFetch, texture, textureSize, uniform, usampler2D, varying, vec2, vec4, vertex } from '@feng3d/tsl';

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

// ==================== 普通纹理片段着色器 ====================

// 普通纹理采样器
const diffuseNormalized = sampler2D(uniform('diffuse'));

// 片段输出颜色
const colorNormalized = vec4(fragColor(0, 'color'));

/**
 * 片段着色器（普通纹理）
 * 直接采样纹理并输出颜色
 */
export const fragmentShaderNormalized = fragment('main', () =>
{
    precision('highp', 'float');
    precision('highp', 'int');

    colorNormalized.assign(texture(diffuseNormalized, v_st));
});

// ==================== 无符号整数纹理片段着色器 ====================

// 无符号整数纹理采样器
const diffuseUint = usampler2D(uniform('diffuse'));

// 片段输出颜色
const colorUint = vec4(fragColor(0, 'color'));

/**
 * 片段着色器（无符号整数纹理）
 * 使用 texelFetch 采样并转换为浮点颜色
 */
export const fragmentShaderUint = fragment('main', () =>
{
    precision('highp', 'float');
    precision('highp', 'int');
    precision('highp', 'usampler2D');

    // 原始 GLSL: ivec2 size = textureSize(diffuse, 0);
    const size = let_('size', textureSize(diffuseUint, 0));
    // 原始 GLSL: vec2 texcoord = v_st * vec2(size);
    const texcoordF = let_('texcoord', v_st.multiply(vec2(size)));
    // 原始 GLSL: ivec2 coord = ivec2(texcoord);
    const coord = let_('coord', ivec2(texcoordF));
    // 原始 GLSL: uvec4 texel = uvec4(texelFetch(diffuse, coord, 0));
    // 注意：texelFetch 对 usampler2D 已经返回 uvec4，不需要再用 uvec4() 包装
    const texel = let_('texel', texelFetch(diffuseUint, coord, 0));

    // 原始 GLSL: color = vec4(texel) / 255.0;
    colorUint.assign(vec4(texel).divide(255.0));
});

