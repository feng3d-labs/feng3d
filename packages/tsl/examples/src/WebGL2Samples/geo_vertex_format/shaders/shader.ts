/**
 * geo_vertex_format TSL 着色器
 *
 * 演示使用不同顶点格式（HALF_FLOAT）进行立方体渲染
 * 包含纹理映射和简单光照计算
 */

import {
    attribute, clamp, dot, float, fragColor, fragment, gl_Position, mat4, normalize, precision,
    sampler2D, texture, uniform, var_, varying, vec2, vec3, vec4, vertex,
} from '@feng3d/tsl';

// ==================== 顶点着色器 ====================

// 顶点属性
const a_position = attribute('a_position', vec3(), 1);
const a_texCoord = attribute('a_texCoord', vec2(), 2);
const a_normal = attribute('a_normal', vec3(), 3);

// Uniform 变量
const u_model = uniform('u_model', mat4());
const u_modelInvTrans = uniform('u_modelInvTrans', mat4()); // 用于正确变换法线到世界空间
const u_viewProj = uniform('u_viewProj', mat4());
const u_lightPosition = uniform('u_lightPosition', vec3());

// Varying 变量（顶点着色器输出到片段着色器）
const v_texCoord = varying('v_texCoord', vec2());
const v_normal = varying('v_normal', vec3());
const v_lightDirection = varying('v_lightDirection', vec3());

export const vertexShader = vertex('main', () =>
{
    precision('highp', 'float');
    precision('highp', 'int');

    // 计算世界空间位置
    const modelPosition = var_('modelPosition', u_model.multiply(vec4(a_position, 1.0)).xyz);

    // 计算光线方向（从顶点指向光源）
    v_lightDirection.assign(u_viewProj.multiply(vec4(u_lightPosition.subtract(modelPosition), 1.0)).xyz);

    // 计算最终顶点位置
    gl_Position.assign(u_viewProj.multiply(vec4(modelPosition, 1.0)));

    // 变换法线到视图空间
    v_normal.assign(u_viewProj.multiply(u_modelInvTrans).multiply(vec4(a_normal, 0.0)).xyz);

    // 传递纹理坐标
    v_texCoord.assign(a_texCoord);
});

// ==================== 片段着色器 ====================

const s_tex2D = sampler2D(uniform('s_tex2D'));
const u_ambient = uniform('u_ambient', float());

// 片段输出颜色
const color = vec4(fragColor(0, 'color'));

export const fragmentShader = fragment('main', () =>
{
    precision('highp', 'float');
    precision('highp', 'int');

    // 采样纹理颜色
    color.assign(texture(s_tex2D, v_texCoord));

    // 计算漫反射光照强度
    const lightIntensity = var_('lightIntensity', dot(normalize(v_normal), normalize(v_lightDirection)));

    // 将光照强度限制在 [0, 1] 范围内，然后加上环境光
    lightIntensity.assign(clamp(lightIntensity, 0.0, 1.0).add(u_ambient));

    // 应用光照到颜色
    color.assign(color.multiply(lightIntensity));
});

