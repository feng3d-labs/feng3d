/**
 * glsl_centroid TSL 着色器
 *
 * 演示 centroid 插值限定符的使用
 *
 * TSL 用法：
 * - 普通 varying: `varying('v_attr', float())`
 * - centroid 插值: `varying('v_attr', float(), { sampling: 'centroid' })`
 */

import {
    attribute, fragColor, fragment, gl_Position, mat4, mix, precision,
    sampler2D, select, sqrt, texture, uniform, varying, vec2, vec4, vertex,
} from '@feng3d/tsl';
import { float } from '@feng3d/tsl';

// ==================== 渲染着色器（普通插值）====================

const position = attribute('position', vec2(), 0);
const data = attribute('data', float(), 6);
const MVP = uniform('MVP', mat4());

// 普通 varying（默认使用 center 采样）
const v_attribute = varying('v_attribute', float());

export const renderVertexShader = vertex('main', () =>
{
    precision('highp', 'float');
    precision('highp', 'int');
    gl_Position.assign(MVP.multiply(vec4(position, 0.0, 1.0)));
    v_attribute.assign(data);
});

const color = vec4(fragColor(0, 'color'));

export const renderFragmentShader = fragment('main', () =>
{
    precision('highp', 'float');
    precision('highp', 'int');

    // 定义常量颜色
    const blue = vec4(0.0, 0.0, 1.0, 1.0);
    const yellow = vec4(1.0, 1.0, 0.0, 1.0);

    // 使用 select 进行三元条件选择（对应 GLSL 的 cond ? a : b）
    // v_attribute >= 0 时使用 mix(blue, yellow, sqrt(v_attribute))，否则使用 yellow
    // 注意：当普通插值导致 v_attribute 外推为负值时，会显示黄色（表示错误）
    color.assign(select(v_attribute.greaterThanOrEqual(0.0), mix(blue, yellow, sqrt(v_attribute)), yellow));
});

// ==================== 渲染着色器（centroid 插值）====================

// centroid varying（使用 centroid 采样，避免边缘外推）
const v_attribute_centroid = varying('v_attribute', float(), { sampling: 'centroid' });

export const renderCentroidVertexShader = vertex('main', () =>
{
    precision('highp', 'float');
    precision('highp', 'int');
    gl_Position.assign(MVP.multiply(vec4(position, 0.0, 1.0)));
    v_attribute_centroid.assign(data);
});

export const renderCentroidFragmentShader = fragment('main', () =>
{
    precision('highp', 'float');
    precision('highp', 'int');

    const blue = vec4(0.0, 0.0, 1.0, 1.0);
    const yellow = vec4(1.0, 1.0, 0.0, 1.0);

    // 使用 select 进行三元条件选择（对应 GLSL 的 cond ? a : b）
    color.assign(select(v_attribute_centroid.greaterThanOrEqual(0.0), mix(blue, yellow, sqrt(v_attribute_centroid)), yellow));
});

// ==================== Splash 着色器（显示纹理）====================

const splashPosition = attribute('position', vec2(), 0);
const texcoord = attribute('texcoord', vec2(), 1);
const splashMVP = uniform('MVP', mat4());
const v_st = varying('v_st', vec2());

export const splashVertexShader = vertex('main', () =>
{
    precision('highp', 'float');
    precision('highp', 'int');
    v_st.assign(texcoord);
    gl_Position.assign(splashMVP.multiply(vec4(splashPosition, 0.0, 1.0)));
});

const diffuse = sampler2D(uniform('diffuse'));
const splashColor = vec4(fragColor(0, 'color'));

export const splashFragmentShader = fragment('main', () =>
{
    precision('highp', 'float');
    precision('highp', 'int');
    splashColor.assign(texture(diffuse, v_st));
});
