import { attribute, fragColor, fragment, gl_Position, int, mat4, precision, return_, sampler2DArray, texture, uniform, varying, vec2, vec4, vertex } from '@feng3d/tsl';

const position = attribute('position', vec2());
const textureCoordinates = attribute('textureCoordinates', vec2());

const mvp = uniform('mvp', mat4());

const v_st = varying('v_st', vec2());

export const layerVertexShader = vertex('main', () =>
{
    v_st.assign(textureCoordinates);
    gl_Position.assign(mvp.multiply(vec4(position, 0.0, 1.0)));
});

const diffuse = sampler2DArray(uniform('diffuse'));
const layer = uniform('layer', int());

export const layerFragmentShader = fragment('main', () =>
{
    precision('highp', 'float');
    precision('highp', 'int');
    precision('lowp', 'sampler2DArray');

    return_(texture(diffuse, v_st, layer));
});

export const multipleOutputVertexShader = vertex('main', () =>
{
    gl_Position.assign(mvp.multiply(vec4(position, 0.0, 1.0)));
});

// 声明多个 fragment 输出
const red = vec4(fragColor(0, 'red'));
const green = vec4(fragColor(1, 'green'));
const blue = vec4(fragColor(2, 'blue'));

export const multipleOutputFragmentShader = fragment('main', () =>
{
    red.assign(vec4(0.5, 0.0, 0.0, 1.0));
    green.assign(vec4(0.0, 0.3, 0.0, 1.0));
    blue.assign(vec4(0.0, 0.0, 0.8, 1.0));
});
