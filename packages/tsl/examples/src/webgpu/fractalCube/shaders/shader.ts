import { attribute, float, fragment, gl_Position, mat4, return_, sampler2D, texture2D, uniform, var_, varying, vec2, vec3, vec4, vertex } from '@feng3d/tsl';

// Vertex shader 的 attributes（location 缺省时自动分配）
const aVertexPosition = attribute('aVertexPosition', vec3());
const aTextureCoord = attribute('aTextureCoord', vec2());

// Vertex shader 的 uniforms
const uModelViewMatrix = uniform('uModelViewMatrix', mat4(), 0, 0);
const uProjectionMatrix = uniform('uProjectionMatrix', mat4(), 0, 1);

// Varying 变量
const vTextureCoord = varying('vTextureCoord', vec2());
const vFragPosition = varying('vFragPosition', vec4());

// Vertex shader 入口函数
export const vertexShader = vertex('main', () =>
{
    const position = var_('position', vec4(aVertexPosition, 1.0));

    gl_Position.assign(uProjectionMatrix.multiply(uModelViewMatrix).multiply(position));
    vTextureCoord.assign(aTextureCoord);
    const fragPos = var_('fragPos', float(0.5).multiply(vec4(aVertexPosition, 1.0).add(vec4(1.0))));
    vFragPosition.assign(fragPos);
});

// Fragment shader 入口函数
export const fragmentShader = fragment('main', () =>
{
    // sampler 的 binding 会自动分配
    const uSampler = sampler2D(uniform('uSampler'));

    const color = var_('color1', texture2D(uSampler, vTextureCoord).multiply(vFragPosition));
    return_(color);
});
