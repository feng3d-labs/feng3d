import { attribute, fragColor, fragment, gl_Position, mix, precision, return_, sampler2D, texture, uniform, varying, vec2, vec4, vertex } from '@feng3d/tsl';

// ==================== Draw Buffer 着色器 ====================
// Pass 1: 渲染三角形到两个颜色附件

const drawBufferPosition = attribute('position', vec4());

export const drawBufferVertexShader = vertex('main', () =>
{
    precision('highp', 'float');
    precision('highp', 'int');

    gl_Position.assign(drawBufferPosition);
});

// 多输出片段着色器
const color1 = vec4(fragColor(0));
const color2 = vec4(fragColor(1));

export const drawBufferFragmentShader = fragment('main', () =>
{
    precision('highp', 'float');
    precision('highp', 'int');

    // 输出红色到第一个颜色附件
    color1.assign(vec4(1.0, 0.0, 0.0, 1.0));
    // 输出蓝色到第二个颜色附件
    color2.assign(vec4(0.0, 0.0, 1.0, 1.0));
});

// ==================== Draw 着色器 ====================
// Pass 2: 混合两个纹理并渲染到屏幕

const drawPosition = attribute('position', vec2());
const drawTexcoord = attribute('textureCoordinates', vec2());

const v_st = varying('v_st', vec2());

export const drawVertexShader = vertex('main', () =>
{
    precision('highp', 'float');
    precision('highp', 'int');

    v_st.assign(drawTexcoord);
    gl_Position.assign(vec4(drawPosition, 0.0, 1.0));
});

const color1Map = sampler2D(uniform('color1Map'));
const color2Map = sampler2D(uniform('color2Map'));

export const drawFragmentShader = fragment('main', () =>
{
    precision('highp', 'float');
    precision('highp', 'int');

    const color1 = texture(color1Map, v_st);
    const color2 = texture(color2Map, v_st);
    // 根据 x 坐标混合两个颜色
    return_(mix(color1, color2, v_st.x));
});
