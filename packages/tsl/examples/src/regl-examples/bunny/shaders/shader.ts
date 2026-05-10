import { attribute, fragment, gl_Position, mat4, return_, uniform, vec3, vec4, vertex } from '@feng3d/tsl';

// Vertex shader 的 attributes
const position = attribute('position', vec3());

// Vertex shader 的 uniforms
const model = uniform('model', mat4());
const view = uniform('view', mat4());
const projection = uniform('projection', mat4());

// Vertex shader 入口函数
export const vertexShader = vertex('main', () =>
{
    gl_Position.assign(projection.multiply(view).multiply(model).multiply(vec4(position, 1.0)));
});

// Fragment shader 入口函数
export const fragmentShader = fragment('main', () =>
{
    return_(vec4(1.0, 1.0, 1.0, 1.0));
});
