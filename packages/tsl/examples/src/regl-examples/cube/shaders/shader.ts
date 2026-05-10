import { attribute, fragment, gl_Position, mat4, return_, sampler2D, texture2D, uniform, varying, vec2, vec3, vec4, vertex } from '@feng3d/tsl';

// Vertex shader 的 attributes
const position = attribute('position', vec3());
const uv = attribute('uv', vec2());

// Vertex shader 的 uniforms
const projection = uniform('projection', mat4());
const view = uniform('view', mat4());

// Varying 变量
const vUv = varying('vUv', vec2());

// Vertex shader 入口函数
export const vertexShader = vertex('main', () =>
{
    vUv.assign(uv);
    gl_Position.assign(projection.multiply(view).multiply(vec4(position, 1.0)));
});

// Fragment shader 的 sampler
const tex = sampler2D(uniform('tex'));

// Fragment shader 入口函数
export const fragmentShader = fragment('main', () =>
{
    return_(texture2D(tex, vUv));
});
