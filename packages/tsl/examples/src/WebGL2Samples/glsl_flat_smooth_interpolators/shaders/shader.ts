/**
 * glsl_flat_smooth_interpolators TSL 着色器
 *
 * 演示 flat 和 smooth 插值限定符的区别
 *
 * TSL 用法：
 * - smooth varying（默认）: `varying('v_normal', vec3())`
 * - flat varying: `varying('v_normal', vec3(), { interpolation: 'flat' })`
 */

import {
    attribute, fragColor, fragment, gl_Position, mat4, normalize, precision,
    uniform, varying, vec3, vec4, vertex,
} from '@feng3d/tsl';

// ==================== Smooth 着色器（默认插值）====================

const position = attribute('position', vec3(), 0);
const normal = attribute('normal', vec3(), 1);
const mvp = uniform('mvp', mat4());
const mvNormal = uniform('mvNormal', mat4());

// smooth varying（默认使用透视校正插值）
const v_normal_smooth = varying('v_normal', vec3());

export const smoothVertexShader = vertex('main', () =>
{
    precision('highp', 'float');
    precision('highp', 'int');
    v_normal_smooth.assign(normalize(mvNormal.multiply(vec4(normal, 0.0)).xyz));
    gl_Position.assign(mvp.multiply(vec4(position, 1.0)));
});

const color_smooth = vec4(fragColor(0, 'color'));

export const smoothFragmentShader = fragment('main', () =>
{
    precision('highp', 'float');
    precision('highp', 'int');
    color_smooth.assign(vec4(v_normal_smooth, 1.0));
});

// ==================== Flat 着色器（不插值）====================

// flat varying（不进行插值，使用 provoking 顶点的值）
const v_normal_flat = varying('v_normal', vec3(), { interpolation: 'flat' });

export const flatVertexShader = vertex('main', () =>
{
    precision('highp', 'float');
    precision('highp', 'int');
    v_normal_flat.assign(normalize(mvNormal.multiply(vec4(normal, 0.0)).xyz));
    gl_Position.assign(mvp.multiply(vec4(position, 1.0)));
});

const color_flat = vec4(fragColor(0, 'color'));

export const flatFragmentShader = fragment('main', () =>
{
    precision('highp', 'float');
    precision('highp', 'int');
    color_flat.assign(vec4(v_normal_flat, 1.0));
});
