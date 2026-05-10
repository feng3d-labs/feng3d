import { attribute, float, fragColor, fragment, gl_Position, if_, mat4, precision, return_, sampler2D, texture, uniform, varying, vec2, vec4, vertex } from '@feng3d/tsl';

// 顶点属性
const position = attribute('position', vec2(), 0);
const textureCoordinates = attribute('textureCoordinates', vec2(), 4);

// Uniform 变量
const mvp = uniform('mvp', mat4());

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

    v_st.assign(textureCoordinates);
    gl_Position.assign(mvp.multiply(vec4(position, 0.0, 1.0)));
});

// 两个采样器：Nearest 和 Linear
const materialDiffuse0 = sampler2D(uniform('materialDiffuse0'));
const materialDiffuse1 = sampler2D(uniform('materialDiffuse1'));

const color = vec4(fragColor(0, 'color'));

/**
 * 片段着色器
 * 根据纹理坐标位置选择不同的采样器
 * 对角线下方使用 Linear 过滤（materialDiffuse0）
 * 对角线上方使用 Nearest 过滤（materialDiffuse1）并乘以 0.77 以便区分
 */
export const fragmentShader = fragment('main', () =>
{
    precision('highp', 'float');
    precision('highp', 'int');

    // 如果 v_st.y / v_st.x < 1.0，使用 materialDiffuse0（Linear）
    // 否则使用 materialDiffuse1（Nearest）并乘以 0.77
    if_(v_st.y.divide(v_st.x).lessThan(1.0), () =>
    {
        color.assign(texture(materialDiffuse0, v_st));
    }).else(() =>
    {
        color.assign(texture(materialDiffuse1, v_st).multiply(0.77));
    });

});
