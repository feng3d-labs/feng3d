import { attribute, cross, dFdx, dFdy, fragment, gl_Position, mat4, mix, normalize, precision, return_, sampler2D, texture, uniform, varying, vec2, vec3, vec4, vertex } from '@feng3d/tsl';

// 顶点属性
const position = attribute('position', vec3(), 0);
const texcoord = attribute('texcoord', vec2(), 4);

// Uniform 变量
const mvMatrix = uniform('mvMatrix', mat4());
const pMatrix = uniform('pMatrix', mat4());

// Varying 变量
const v_uv = varying('v_uv', vec2());
const v_position = varying('v_position', vec3());

/**
 * 顶点着色器
 * 将顶点位置变换到裁剪空间，同时传递纹理坐标和视图空间位置
 */
export const vertexShader = vertex('main', () =>
{
    precision('highp', 'float');
    precision('highp', 'int');

    // 传递纹理坐标
    v_uv.assign(texcoord);

    // 计算视图空间位置并传递
    v_position.assign(mvMatrix.multiply(vec4(position, 1.0)).xyz);

    // 计算最终裁剪空间位置
    gl_Position.assign(pMatrix.multiply(mvMatrix).multiply(vec4(position, 1.0)));
});

// 纹理采样器
const diffuse = sampler2D(uniform('diffuse'));

/**
 * 片段着色器
 * 使用 dFdx 和 dFdy 计算屏幕空间的导数，从而得到平面法线
 * 然后将法线与纹理颜色混合
 */
export const fragmentShader = fragment('main', () =>
{
    precision('highp', 'float');
    precision('highp', 'int');
    precision('highp', 'sampler2D');

    // 采样纹理颜色
    const color = texture(diffuse, v_uv);

    // 使用屏幕空间导数计算平面法线
    // dFdx 和 dFdy 分别计算 x 和 y 方向上的变化率
    const fdx = vec3(dFdx(v_position.x), dFdx(v_position.y), dFdx(v_position.z));
    const fdy = vec3(dFdy(v_position.x), dFdy(v_position.y), dFdy(v_position.z));

    // 通过叉乘计算法线并归一化
    const N = normalize(cross(fdx, fdy));

    // 将纹理颜色与法线颜色混合（50%）
    return_(mix(color, vec4(N, 1.0), 0.5));
});

