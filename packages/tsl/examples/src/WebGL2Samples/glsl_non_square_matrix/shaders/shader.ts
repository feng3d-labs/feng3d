/**
 * glsl_non_square_matrix TSL 着色器
 *
 * 演示使用 mat4x3 非方阵矩阵存储 MVP 变换
 *
 * mat4x3 是 4 列 3 行的矩阵：
 * - mat4x3 * vec4 -> vec3（降维变换）
 * - MVP[3] 访问第四列（平移向量）
 *
 * TSL 用法：
 * - `mat4x3(uniform('MVP'))` - 声明 mat4x3 uniform
 * - `MVP.multiply(vec4(...))` - 矩阵乘法
 * - `MVP.col(3)` - 访问第四列
 */

import {
    attribute, fragment, gl_Position, mat4x3, precision,
    return_, sampler2D, texture, uniform, varying, vec2, vec4, vertex,
} from '@feng3d/tsl';

// ==================== 顶点着色器 ====================

const position = attribute('position', vec2(), 0);
const texcoord = attribute('texcoord', vec2(), 1);
const MVP = uniform('MVP', mat4x3());

// Varying 变量
const v_st = varying('v_st', vec2());

export const vertexShader = vertex('main', () =>
{
    precision('highp', 'float');
    precision('highp', 'int');

    v_st.assign(texcoord);

    // mat4x3 * vec4 -> vec3，然后加上平移列 MVP[3]，最后构造 vec4
    // gl_Position = vec4(MVP * vec4(position, 0.0, 1.0) + MVP[3], 1.0);
    gl_Position.assign(vec4(MVP.multiply(vec4(position, 0.0, 1.0)).add(MVP.col(3)), 1.0));
});

// ==================== 片段着色器 ====================

const diffuse = sampler2D(uniform('diffuse'));

export const fragmentShader = fragment('main', () =>
{
    precision('highp', 'float');
    precision('highp', 'int');

    return_(texture(diffuse, v_st));
});
