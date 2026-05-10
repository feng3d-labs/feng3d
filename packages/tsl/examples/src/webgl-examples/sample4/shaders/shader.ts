import { attribute, fragment, gl_Position, mat4, return_, uniform, var_, varying, vec2, vec4, vertex } from '@feng3d/tsl';

// Vertex shader 的 attributes（location 缺省时自动分配）
const aVertexPosition = attribute('aVertexPosition', vec2());
const aVertexColor = attribute('aVertexColor', vec4());

// Vertex shader 的 uniforms（group 缺省时使用默认值 0）
const uModelViewMatrix = uniform('uModelViewMatrix', mat4());
const uProjectionMatrix = uniform('uProjectionMatrix', mat4());

// Varying 变量
const vColor = varying('vColor', vec4());

// Vertex shader 入口函数
export const vertexShader = vertex('main', () =>
{
    const position = var_('position', vec4(aVertexPosition, 0.0, 1.0));

    gl_Position.assign(uProjectionMatrix.multiply(uModelViewMatrix).multiply(position));
    vColor.assign(aVertexColor);
});

// Fragment shader 入口函数
export const fragmentShader = fragment('main', () =>
{
    return_(vColor);
});
