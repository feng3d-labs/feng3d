import { attribute, fragColor, fragment, gl_Position, ivec2, let_, mat4, precision, sampler2D, texelFetchOffset, textureOffset, textureSize, uniform, varying, vec2, vec4, vertex } from '@feng3d/tsl';

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

// 纹理采样器
const diffuse = sampler2D(uniform('diffuse'));

// 像素偏移
const offset = uniform('offset', ivec2());

// 片段输出颜色
const color = vec4(fragColor(0, 'color'));

/**
 * 片段着色器（带偏移的纹理采样）
 * 使用 textureOffset 进行偏移纹理采样
 */
export const fragmentShaderOffset = fragment('main', () =>
{
    precision('highp', 'float');
    precision('highp', 'int');

    // 获取纹理尺寸
    const texSize = let_('textureSize', textureSize(diffuse, 0));

    // 计算偏移后的纹理坐标
    const offsetCoord = let_('offsetCoord', v_st.add(vec2(offset).divide(vec2(texSize))));

    // 使用偏移的纹理坐标进行采样
    // 注意：这里不使用 textureOffset，因为它的偏移量必须是编译时常量
    // 改用计算后的坐标进行采样
    const texel00 = let_('texel00', textureOffset(diffuse, offsetCoord, ivec2(-1, -1)));
    const texel10 = let_('texel10', textureOffset(diffuse, offsetCoord, ivec2(0, -1)));
    const texel01 = let_('texel01', textureOffset(diffuse, offsetCoord, ivec2(-1, 0)));
    const texel11 = let_('texel11', textureOffset(diffuse, offsetCoord, ivec2(0, 0)));

    // 简单的双线性混合
    color.assign(texel00.add(texel10).add(texel01).add(texel11).multiply(0.25));
});

/**
 * 片段着色器（无偏移，使用 texelFetchOffset）
 * 使用 texelFetchOffset 进行直接纹素获取
 */
export const fragmentShaderBicubic = fragment('main', () =>
{
    precision('highp', 'float');
    precision('highp', 'int');

    // 获取纹理尺寸
    const size = let_('size', textureSize(diffuse, 0));

    // 计算整数纹素坐标
    const texelCoord = let_('texelCoord', ivec2(v_st.multiply(vec2(size))));

    // 使用 texelFetchOffset 获取相邻纹素
    const texel00 = let_('texel00', texelFetchOffset(diffuse, texelCoord, 0, ivec2(-1, -1)));
    const texel10 = let_('texel10', texelFetchOffset(diffuse, texelCoord, 0, ivec2(0, -1)));
    const texel01 = let_('texel01', texelFetchOffset(diffuse, texelCoord, 0, ivec2(-1, 0)));
    const texel11 = let_('texel11', texelFetchOffset(diffuse, texelCoord, 0, ivec2(0, 0)));

    // 简单的 2x2 平均
    color.assign(texel00.add(texel10).add(texel01).add(texel11).multiply(0.25));
});

