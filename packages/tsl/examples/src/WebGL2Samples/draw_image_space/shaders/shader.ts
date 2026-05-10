import { float, fragment, gl_FragCoord, gl_VertexID, precision, return_, sampler2D, texture, uniform, vec2, vec4, vertex } from '@feng3d/tsl';

export const vertexShader = vertex('main', () =>
{
    precision('highp', 'float');
    precision('highp', 'int');

    return_(vec4(float(2.0).multiply(float(gl_VertexID.mod(2))).subtract(1.0), float(2.0).multiply(float(gl_VertexID.divide(2))).subtract(1.0), 0.0, 1.0));
});

const diffuse = sampler2D(uniform('diffuse'));
const u_imageSize = uniform('u_imageSize', vec2());

export const fragmentShader = fragment('main', () =>
{
    precision('highp', 'float');
    precision('highp', 'int');

    return_(texture(diffuse, vec2(gl_FragCoord.x, u_imageSize.y.subtract(gl_FragCoord.y)).divide(u_imageSize)));
});
