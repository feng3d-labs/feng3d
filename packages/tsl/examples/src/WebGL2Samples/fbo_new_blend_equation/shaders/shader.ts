import { attribute, fragment, gl_Position, mat4, precision, return_, sampler2D, texture, uniform, varying, vec2, vec4, vertex } from '@feng3d/tsl';

// 输入属性
const position = attribute('position', vec2(), 0);
const textureCoordinates = attribute('textureCoordinates', vec2(), 1);

// Uniform
const mvp = uniform('mvp', mat4());

// Varying
const v_st = varying('v_st', vec2());

// 顶点着色器
export const vertexShader = vertex('main', () =>
{
    precision('highp', 'float');
    precision('highp', 'int');

    v_st.assign(textureCoordinates);
    gl_Position.assign(mvp.multiply(vec4(position, 0.0, 1.0)));
});

// 纹理采样器
const diffuse = sampler2D(uniform('diffuse'));

// 片段着色器
export const fragmentShader = fragment('main', () =>
{
    precision('highp', 'float');
    precision('highp', 'int');

    return_(texture(diffuse, v_st));
});
