import { attribute, cos, float, fragment, precision, return_, sin, uniform, vec2, vec4, vertex } from '@feng3d/tsl';

// Vertex shader 的 attributes
const position = attribute('position', vec2());

// Vertex shader 的 uniforms
const angle = uniform('angle', float());
const offset = uniform('offset', vec2());

// Fragment shader 的 uniform
const color = uniform('color', vec4());

// Vertex shader 入口函数
export const vertexShader = vertex('main', () =>
{
    const cosAngle = cos(angle);
    const sinAngle = sin(angle);
    // 旋转矩阵计算: [cos  sin] [x]   [cos*x + sin*y]
    //                [-sin cos] [y] = [-sin*x + cos*y]
    const rotatedX = cosAngle.multiply(position.x).add(sinAngle.multiply(position.y));
    const rotatedY = float(-1.0).multiply(sinAngle).multiply(position.x).add(cosAngle.multiply(position.y));
    const finalPos = vec2(rotatedX.add(offset.x), rotatedY.add(offset.y));

    return_(vec4(finalPos, 0.0, 1.0));
});

// Fragment shader 入口函数
export const fragmentShader = fragment('main', () =>
{
    precision('mediump', 'float');

    return_(color);
});

