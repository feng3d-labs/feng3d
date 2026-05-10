import { attribute, fragment, precision, return_, uniform, vec2, vec4, vertex } from '@feng3d/tsl';

// Vertex shader 的 attribute
const position = attribute('position', vec2());

// Fragment shader 的 uniform
const color = uniform('color', vec4());

// Vertex shader 入口函数
export const vertexShader = vertex('main', () =>
{
    return_(vec4(position, 0.0, 1.0));
});

// Fragment shader 入口函数
export const fragmentShader = fragment('main', () =>
{
    precision('mediump', 'float');

    return_(color);
});

