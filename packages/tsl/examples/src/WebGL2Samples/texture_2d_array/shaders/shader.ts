import { attribute, fragment, gl_Position, int, mat4, precision, return_, sampler2DArray, texture, uniform, varying, vec2, vec4, vertex } from '@feng3d/tsl';

// 顶点属性
const position = attribute('position', vec2(), 0);
const texcoord = attribute('texcoord', vec2(), 4);

// Uniforms
const MVP = uniform('MVP', mat4());

// Varying 变量
const v_st = varying('v_st', vec2());

/**
 * 顶点着色器
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

// 片段着色器 Uniforms
const diffuse = sampler2DArray(uniform('diffuse'));
const layer = uniform('layer', int());

/**
 * 片段着色器
 * - 从 2D 纹理数组中采样
 * - 使用 layer uniform 选择纹理层
 */
export const fragmentShader = fragment('main', () =>
{
    precision('highp', 'float');
    precision('highp', 'int');
    precision('highp', 'sampler2DArray');

    return_(texture(diffuse, v_st, layer));
});

