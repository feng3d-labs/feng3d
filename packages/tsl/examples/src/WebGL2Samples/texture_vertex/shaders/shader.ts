import {
    attribute, clamp, cross, dFdx, dFdy, dot, float, Float, fract, fragment, func,
    gl_Position, let_, log2, mat4, max, mix, normalize, pow, precision,
    return_, sampler2D, texture, textureLod, textureSize, uniform, var_, varying,
    vec2, Vec2, vec3, vec4, vertex,
} from '@feng3d/tsl';

// 顶点属性
const position = attribute('position', vec3(), 0);
const normal = attribute('normal', vec3(), 1);
const texcoord = attribute('texcoord', vec2(), 4);

// Uniform 变量
const mvMatrix = uniform('mvMatrix', mat4());
const pMatrix = uniform('pMatrix', mat4());
const displacementMap = sampler2D(uniform('displacementMap'));

// Varying 变量
const v_st = varying('v_st', vec2());
const v_position = varying('v_position', vec3());

/**
 * 顶点着色器
 * 在顶点着色器中采样位移贴图，根据法线方向位移顶点位置
 */
export const vertexShader = vertex('main', () =>
{
    precision('highp', 'float');
    precision('highp', 'int');

    // 传递纹理坐标
    v_st.assign(texcoord);

    // 在顶点着色器中采样位移贴图（使用 LOD 0，因为顶点着色器中没有导数信息）
    const height = let_('height', texture(displacementMap, texcoord).b);

    // 计算位移后的位置
    const displacedPosition = let_('displacedPosition', vec4(position, 1.0).add(vec4(normal.multiply(height), 0.0)));

    // 计算视图空间位置并传递
    v_position.assign(mvMatrix.multiply(displacedPosition).xyz);

    // 计算最终裁剪空间位置
    gl_Position.assign(pMatrix.multiply(mvMatrix).multiply(displacedPosition));
});

// 片段着色器使用的纹理
const diffuse = sampler2D(uniform('diffuse'));

/**
 * textureLevel 函数，计算适当的 LOD 级别
 * 使用 dFdx 和 dFdy 计算屏幕空间的变化率
 */
const textureLevel: (v_st: Vec2) => Float = func(
    'textureLevel',
    [['v_st', vec2]],
    float,
    (v_st) =>
    {
        // 获取纹理尺寸
        const size = let_('size', vec2(textureSize(diffuse, 0)));

        // 计算 mipmap 级别数（log2 返回 Float）
        const levelCount = let_('levelCount', max(log2(size.x) as Float, log2(size.y) as Float));

        // 计算屏幕空间导数
        const dx = let_('dx', dFdx(v_st.multiply(size)));
        const dy = let_('dy', dFdy(v_st.multiply(size)));

        // 计算各向异性值
        const d = var_('d', max(dot(dx, dx), dot(dy, dy)));

        // 钳制值（需要类型断言以确保 pow 和 clamp 的类型正确）
        const powResult = pow(2.0, (levelCount.subtract(1.0) as Float).multiply(2.0) as Float) as Float;
        d.assign(clamp(d, 1.0, powResult));

        // 返回 LOD 级别
        return_((log2(d) as Float).multiply(0.5));
    },
);

/**
 * 片段着色器
 * 使用 textureLod 进行显式 LOD 采样，并计算平面法线
 */
export const fragmentShader = fragment('main', () =>
{
    precision('highp', 'float');
    precision('highp', 'int');
    precision('highp', 'sampler2D');

    // 计算采样坐标（取小数部分）
    const sampleCoord = let_('sampleCoord', fract(v_st));

    // 计算 LOD 级别
    const level = let_('level', textureLevel(v_st));

    // 使用显式 LOD 采样纹理
    const texColor = let_('texColor', textureLod(diffuse, v_st, level));

    // 使用屏幕空间导数计算平面法线
    const fdx = let_('fdx', dFdx(v_position));
    const fdy = let_('fdy', dFdy(v_position));

    // 通过叉乘计算法线并归一化
    const N = let_('N', normalize(cross(fdx, fdy)));

    // 将纹理颜色与法线颜色混合（50%）
    const finalColor = let_('finalColor', mix(texColor, vec4(N, 1.0), 0.5));

    return_(finalColor);
});
