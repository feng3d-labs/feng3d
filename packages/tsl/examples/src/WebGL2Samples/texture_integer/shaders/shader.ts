import { attribute, fragColor, fragment, gl_Position, mat4, precision, texture, uniform, usampler2D, varying, vec2, vec4, vertex } from '@feng3d/tsl';

// ==================== 顶点着色器 ====================

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

// ==================== 片段着色器 ====================

// 无符号整数纹理采样器
const diffuse = usampler2D(uniform('diffuse'));

// 片段输出颜色
const color = vec4(fragColor(0, 'color'));

/**
 * 片段着色器
 * 使用无符号整数纹理采样器采样，并进行整数量化处理
 *
 * 原始 GLSL:
 * uvec4 intColor = texture(diffuse, v_st) / 32u * 32u;
 * color = vec4(intColor) / 255.0;
 */
export const fragmentShader = fragment('main', () =>
{
    precision('highp', 'float');
    precision('highp', 'int');
    precision('highp', 'usampler2D');

    // 采样整数纹理并进行量化处理：先除以 32 再乘以 32
    // 这会将颜色值量化到 0, 32, 64, 96, 128, 160, 192, 224 这些离散值
    const intColor = texture(diffuse, v_st).divide(32).multiply(32);

    // 将整数颜色转换为浮点颜色 [0, 255] -> [0, 1]
    color.assign(vec4(intColor).divide(255.0));
});

