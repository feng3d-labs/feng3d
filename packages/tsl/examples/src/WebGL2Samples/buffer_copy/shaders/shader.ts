import { attribute, fragment, precision, return_, vec2, vec4, vertex } from '@feng3d/tsl';

// Vertex shader 的 attribute
const apos = attribute('pos', vec2());

// Vertex shader 入口函数
export const vertexShader = vertex('main', () =>
{
    return_(vec4(apos, 0.0, 1.0));
});

// Fragment shader 入口函数
export const fragmentShader = fragment('main', () =>
{
    precision('highp');

    return_(vec4(1.0, 0.5, 0.0, 1.0));
});