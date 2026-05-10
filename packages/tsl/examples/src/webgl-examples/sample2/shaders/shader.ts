import { attribute, fragment, gl_FragColor, gl_Position, let_, mat4, uniform, vec2, vec4, vertex } from '@feng3d/tsl';

// Vertex shader 的 attribute（location 缺省时自动分配）
const aVertexPosition = attribute('aVertexPosition', vec2());

// Vertex shader 的 uniforms（group 缺省时使用默认值 0）
const uModelViewMatrix = uniform('uModelViewMatrix', mat4());
const uProjectionMatrix = uniform('uProjectionMatrix', mat4());

// Vertex shader 入口函数
export const vertexShader = vertex('main', () =>
{
    const position = let_('position', vec4(aVertexPosition, 0.0, 1.0));

    gl_Position.assign(uProjectionMatrix.multiply(uModelViewMatrix).multiply(position));
});

// Fragment shader 入口函数
export const fragmentShader = fragment('main', () =>
{
    gl_FragColor.assign(vec4(1.0, 0.0, 1.0, 1.0));
});

