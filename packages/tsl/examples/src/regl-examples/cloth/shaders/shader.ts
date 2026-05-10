import { attribute, clamp, dot, float, fragment, gl_FrontFacing, gl_Position, if_, mat4, normalize, precision, return_, sampler2D, texture2D, uniform, var_, varying, vec2, vec3, vec4, vertex } from '@feng3d/tsl';

// Vertex shader 的 attribute
const position = attribute('position', vec3()); // attribute vec3 position;
const normal = attribute('normal', vec3()); // attribute vec3 normal;
const uv = attribute('uv', vec2()); // attribute vec2 uv;

// Vertex shader 的 uniform
const projection = uniform('projection', mat4()); // uniform mat4 projection;
const view = uniform('view', mat4()); // uniform mat4 view;

// Fragment shader 的 uniform
const texture = sampler2D(uniform('texture')); // uniform sampler2D texture;

// Varying 变量
const vUv = varying('vUv', vec2()); // varying vec2 vUv;
const vNormal = varying('vNormal', vec3()); // varying vec3 vNormal;

// Vertex shader 入口函数
export const vertexShader = vertex('main', () =>
{
    precision('mediump', 'float'); // precision mediump float;
    vUv.assign(uv); // vUv = uv;
    vNormal.assign(normal); // vNormal = normal;
    gl_Position.assign(projection.multiply(view).multiply(vec4(position, 1.0))); // gl_Position = projection * view * vec4(position, 1);
});

// Fragment shader 入口函数
export const fragmentShader = fragment('main', () =>
{
    precision('mediump', 'float'); // precision mediump float;

    const tex = var_('tex', texture2D(texture, vUv).xyz); // vec3 tex = texture2D(texture, vUv*1.0).xyz;
    const lightDir = var_('lightDir', normalize(vec3(0.4, 0.9, 0.3))); // vec3 lightDir = normalize(vec3(0.4, 0.9, 0.3));

    const n = var_('n', vNormal); // vec3 n = vNormal;

    // for the back faces we need to use the opposite normals.
    // if(gl_FrontFacing == false) {
    //     n = -n;
    // }
    if_(gl_FrontFacing.equals(false), () =>
    {
        n.assign(float(-1.0).multiply(n));
    });

    const dotProduct = var_('dotProduct', dot(n, lightDir)); // float dotProduct = dot(n, lightDir);
    const absDotProduct = var_('absDotProduct', clamp(dotProduct, 0.0, 1.0)); // float absDotProduct = clamp(dotProduct, 0.0, 1.0);

    const ambient = var_('ambient', vec3(0.3).multiply(tex)); // vec3 ambient = 0.3 * tex;
    const diffuse = var_('diffuse', vec3(0.7).multiply(tex).multiply(absDotProduct)); // vec3 diffuse = 0.7 * tex * absDotProduct;

    return_(vec4(ambient.add(diffuse), 1.0)); // gl_FragColor = vec4(ambient + diffuse, 1.0);
});
