import { attribute, dot, fragment, gl_Position, mat4, max, normalize, return_, sampler2D, texture2D, uniform, var_, varying, vec2, vec3, vec4, vertex } from '@feng3d/tsl';

// Vertex shader 的 attributes（location 缺省时自动分配）
const aVertexPosition = attribute('aVertexPosition', vec4());
const aVertexNormal = attribute('aVertexNormal', vec3());
const aTextureCoord = attribute('aTextureCoord', vec2());

// Vertex shader 的 uniforms
const uModelViewMatrix = uniform('uModelViewMatrix', mat4(), 0, 0);
const uProjectionMatrix = uniform('uProjectionMatrix', mat4(), 0, 1);
const uNormalMatrix = uniform('uNormalMatrix', mat4(), 0, 2);

// Varying 变量
const vTextureCoord = varying('vTextureCoord', vec2());
const vLighting = varying('vLighting', vec3());

// Vertex shader 入口函数
export const vertexShader = vertex('main', () =>
{
    gl_Position.assign(uProjectionMatrix.multiply(uModelViewMatrix).multiply(aVertexPosition));
    vTextureCoord.assign(aTextureCoord);

    // 应用光照效果
    const ambientLight = var_('ambientLight', vec3(0.3));
    const directionalLightColor = var_('directionalLightColor', vec3(1.0));
    const directionalVector = var_('directionalVector', normalize(vec3(0.85, 0.8, 0.75)));
    const transformedNormal = var_('transformedNormal', uNormalMatrix.multiply(vec4(aVertexNormal, 1.0)));
    const directional = var_('directional', max(dot(transformedNormal.xyz, directionalVector), 0.0));
    const lighting = var_('lighting', ambientLight.add(directionalLightColor.multiply(directional)));
    vLighting.assign(lighting);
});

// sampler 的 binding 会自动分配，因为 vertex shader 的 uniform 已经占用了 0, 1, 2（group 缺省时使用默认值 0）
const uSampler = sampler2D(uniform('uSampler'));

// Fragment shader 入口函数
export const fragmentShader = fragment('main', () =>
{
    const texelColor = var_('texelColor', texture2D(uSampler, vTextureCoord));
    // 应用光照效果
    return_(vec4(texelColor.rgb.multiply(vLighting), texelColor.a));
});
