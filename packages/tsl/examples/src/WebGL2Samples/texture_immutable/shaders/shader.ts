import { attribute, fragment, gl_Position, mat4, precision, return_, sampler2D, sampler3D, texture, uniform, varying, vec2, vec3, vec4, vertex } from '@feng3d/tsl';

// ============================================================================
// 2D 纹理着色器（左侧视口）
// ============================================================================

// 顶点属性
const position = attribute('position', vec2(), 0);
const texcoord = attribute('texcoord', vec2(), 4);

// Uniform 变量
const MVP = uniform('MVP', mat4());

// Varying 变量
const v_st = varying('v_st', vec2());

/**
 * 2D 纹理顶点着色器
 * - 传递纹理坐标到片段着色器
 * - 使用 MVP 矩阵变换顶点位置
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

/**
 * 2D 纹理片段着色器
 * - 采样 2D 纹理并输出颜色
 */
export const fragmentShader = fragment('main', () =>
{
    precision('highp', 'float');
    precision('highp', 'int');

    return_(texture(diffuse, v_st));
});

// ============================================================================
// 3D 纹理着色器（右侧视口）
// ============================================================================

// 顶点属性（复用 position，使用不同名称的 texcoord）
const position3D = attribute('position', vec2(), 0);
const in_texcoord = attribute('in_texcoord', vec2(), 4);

// Varying 变量
const v_texcoord = varying('v_texcoord', vec3());

/**
 * 3D 纹理顶点着色器
 * - 将 2D 纹理坐标通过矩阵变换到 3D 空间
 * - 输出 3D 纹理坐标用于片段着色器采样
 */
export const vertexShader3D = vertex('main', () =>
{
    precision('highp', 'float');
    precision('highp', 'int');

    // 将纹理坐标乘以变换矩阵（单位矩阵），放置到 3D 空间
    // v_texcoord = (mat4(1.0) * vec4(in_texcoord - vec2(0.5, 0.5), 0.5, 1.0)).stp;
    const transformed = mat4(1.0).multiply(vec4(in_texcoord.subtract(vec2(0.5, 0.5)), 0.5, 1.0));
    v_texcoord.assign(transformed.xyz);

    gl_Position.assign(vec4(position3D, 0.0, 1.0));
});

// 3D 纹理采样器
const diffuse3D = sampler3D(uniform('diffuse'));

/**
 * 3D 纹理片段着色器
 * - 采样 3D 纹理并输出颜色
 */
export const fragmentShader3D = fragment('main', () =>
{
    precision('highp', 'float');
    precision('highp', 'int');
    precision('highp', 'sampler3D');

    return_(texture(diffuse3D, v_texcoord));
});

