import { attribute, fragment, gl_Position, mat4, precision, return_, sampler3D, texture, uniform, varying, vec2, vec3, vec4, vertex } from '@feng3d/tsl';

// 顶点属性
const position = attribute('position', vec2(), 0);
const in_texcoord = attribute('in_texcoord', vec2(), 1);

// Uniforms
const orientation = uniform('orientation', mat4());

// Varying 变量
const v_texcoord = varying('v_texcoord', vec3());

/**
 * 顶点着色器
 * - 将 2D 纹理坐标通过 orientation 矩阵变换到 3D 空间
 * - 输出 3D 纹理坐标用于片段着色器采样
 */
export const vertexShader = vertex('main', () =>
{
    precision('highp', 'float');
    precision('highp', 'int');

    // 将纹理坐标乘以变换矩阵，放置到 3D 空间
    // 使用 .xyz 分量获取变换后的 3D 坐标
    const transformed = orientation.multiply(vec4(in_texcoord.subtract(vec2(0.5, 0.5)), 0.5, 1.0));
    v_texcoord.assign(transformed.xyz);

    gl_Position.assign(vec4(position, 0.0, 1.0));
});

// 片段着色器 Uniforms
const diffuse = sampler3D(uniform('diffuse'));

/**
 * 片段着色器
 * - 使用 3D 纹理坐标采样 3D 纹理
 */
export const fragmentShader = fragment('main', () =>
{
    precision('highp', 'float');
    precision('highp', 'int');
    precision('highp', 'sampler3D');

    return_(texture(diffuse, v_texcoord));
});

