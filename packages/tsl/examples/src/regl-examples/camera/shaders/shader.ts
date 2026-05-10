import { attribute, float, fragment, gl_Position, max, mat4, return_, uniform, var_, varying, vec3, vec4, vertex } from '@feng3d/tsl';

// Vertex shader 的 attributes
const position = attribute('position', vec3());
const normal = attribute('normal', vec3());

// Vertex shader 的 uniforms
const projection = uniform('projection', mat4());
const view = uniform('view', mat4());

// Varying 变量
const vnormal = varying('vnormal', vec3());

// Vertex shader 入口函数
export const vertexShader = vertex('main', () =>
{
    vnormal.assign(normal);
    gl_Position.assign(projection.multiply(view).multiply(vec4(position, 1.0)));
});

// Fragment shader 入口函数
export const fragmentShader = fragment('main', () =>
{
    // 使用 max(vnormal, -vnormal) 来实现 abs(vec3)
    // 注意：在 GLSL 中可以直接使用 abs()，但 TSL 中需要手动实现
    const negNormal = float(-1.0).multiply(vnormal);
    const absX = max(vnormal.x, negNormal.x);
    const absY = max(vnormal.y, negNormal.y);
    const absZ = max(vnormal.z, negNormal.z);
    // 使用 var_ 创建 vec3，因为 vec3 构造函数不支持 (Float, Float, Float)
    const absNormal = var_('absNormal', vec3(0, 0, 0));
    absNormal.x.assign(absX);
    absNormal.y.assign(absY);
    absNormal.z.assign(absZ);

    return_(vec4(absNormal, 1.0));
});
