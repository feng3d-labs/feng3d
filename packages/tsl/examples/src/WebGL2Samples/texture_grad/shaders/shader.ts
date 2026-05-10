import { attribute, cross, dFdx, dFdy, fragColor, fragment, gl_Position, let_, mat4, mix, normalize, precision, sampler2D, textureGrad, textureSize, uniform, varying, vec2, vec3, vec4, vertex } from '@feng3d/tsl';

// 顶点属性
const position = attribute('position', vec3(), 0);
const texcoord = attribute('texcoord', vec2(), 4);

// Uniform 变量
const mvMatrix = uniform('mvMatrix', mat4());
const pMatrix = uniform('pMatrix', mat4());

// Varying 变量
const v_uv = varying('v_uv', vec2());
const vPosition = varying('vPosition', vec3());

// 片段输出颜色
const color = vec4(fragColor(0, 'color'));

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
    vPosition.assign(mvMatrix.multiply(vec4(position, 1.0)).xyz);

    // 计算最终裁剪空间位置
    gl_Position.assign(pMatrix.multiply(mvMatrix).multiply(vec4(position, 1.0)));
});

// 纹理采样器
const diffuse = sampler2D(uniform('diffuse'));

/**
 * 片段着色器
 * 使用 textureGrad 进行纹理采样，并通过 dFdx 和 dFdy 计算平面法线
 * 然后将法线与纹理颜色混合
 */
export const fragmentShader = fragment('main', () =>
{
    precision('highp', 'float');
    precision('highp', 'int');
    precision('highp', 'sampler2D');

    // 获取纹理尺寸并计算梯度
    // vec2 size = vec2(textureSize(diffuse, 0));
    const size = let_('size', vec2(textureSize(diffuse, 0)));

    // vec2 dx = dFdx(v_uv * size);
    const dx = let_('dx', dFdx(v_uv.multiply(size)));

    // vec2 dy = dFdy(v_uv * size);
    const dy = let_('dy', dFdy(v_uv.multiply(size)));

    // 使用 textureGrad 采样纹理
    // color = textureGrad(diffuse, v_uv, dx, dy);
    color.assign(textureGrad(diffuse, v_uv, dx, dy));

    // 使用屏幕空间导数计算平面法线
    // vec3 fdx = vec3(dFdx(vPosition.x), dFdx(vPosition.y), dFdx(vPosition.z));
    const fdx = let_('fdx', vec3(dFdx(vPosition.x), dFdx(vPosition.y), dFdx(vPosition.z)));

    // vec3 fdy = vec3(dFdy(vPosition.x), dFdy(vPosition.y), dFdy(vPosition.z));
    const fdy = let_('fdy', vec3(dFdy(vPosition.x), dFdy(vPosition.y), dFdy(vPosition.z)));

    // 通过叉乘计算法线并归一化
    // vec3 N = normalize(cross(fdx, fdy));
    const N = let_('N', normalize(cross(fdx, fdy)));

    // 将纹理颜色与法线颜色混合（50%）
    // color = mix(color, vec4(N, 1.0), 0.5);
    color.assign(mix(color, vec4(N, 1.0), 0.5));
});

