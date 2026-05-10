import { attribute, fragment, gl_Position, mat4, precision, return_, sampler2D, texture, uniform, varying, vec2, vec4, vertex } from '@feng3d/tsl';

// ============ Render Shader（渲染到多重采样纹理）============

// 输入属性
const renderPosition = attribute('position', vec2(), 0);

// Uniform
const renderMVP = uniform('MVP', mat4());

// 顶点着色器
export const renderVertexShader = vertex('main', () =>
{
    precision('highp', 'float');
    precision('highp', 'int');

    gl_Position.assign(renderMVP.multiply(vec4(renderPosition, 0.0, 1.0)));
});

// 片段着色器
export const renderFragmentShader = fragment('main', () =>
{
    precision('highp', 'float');
    precision('highp', 'int');

    // 输出固定颜色：橙色
    return_(vec4(1.0, 0.5, 0.0, 1.0));
});

// ============ Splash Shader（将纹理渲染到屏幕）============

// 输入属性
const splashPosition = attribute('position', vec2(), 0);
const splashTexcoord = attribute('texcoord', vec2(), 1);

// Uniform
const splashMVP = uniform('MVP', mat4());

// Varying
const uv = varying('uv', vec2());

// 顶点着色器
export const splashVertexShader = vertex('main', () =>
{
    precision('highp', 'float');
    precision('highp', 'int');

    uv.assign(splashTexcoord);
    gl_Position.assign(splashMVP.multiply(vec4(splashPosition, 0.0, 1.0)));
});

// 纹理采样器
const diffuse = sampler2D(uniform('diffuse'));

// 片段着色器
export const splashFragmentShader = fragment('main', () =>
{
    precision('highp', 'float');
    precision('highp', 'int');

    return_(texture(diffuse, uv));
});
