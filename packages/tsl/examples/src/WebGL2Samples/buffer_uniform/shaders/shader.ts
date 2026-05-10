import { attribute, dot, float, fragment, gl_FragColor, gl_Position, mat4, max, normalize, pow, precision, reflect, struct, uniform, varying, vec3, vec4, vertex } from '@feng3d/tsl';

// 输入属性
const position = attribute('position', vec3(), 0);
const normal = attribute('normal', vec3(), 1);
const color = attribute('color', vec4(), 2);

// 定义 Transform 结构体
const Transform = struct('Transform', {
    P: mat4(),
    MV: mat4(),
    Mnormal: mat4(),
});

// 定义 PerDraw UBO
const PerDraw = struct('PerDraw', {
    transform: Transform,
});

const perDraw = uniform('perDraw', PerDraw);

// Varying 变量
const v_normal = varying('v_normal', vec3());
const v_view = varying('v_view', vec3());
const v_color = varying('v_color', vec4());

// 顶点着色器
export const vertexShader = vertex('main', () =>
{
    precision('highp', 'float');
    precision('highp', 'int');

    // 计算眼空间位置
    const pEC = perDraw.transform.MV.multiply(vec4(position, 1.0));

    // 变换法线到眼空间
    v_normal.assign(perDraw.transform.Mnormal.multiply(vec4(normal, 0.0)).xyz);

    // 计算视线方向（从顶点到眼睛）：-pEC.xyz
    v_view.assign(pEC.xyz.negate());

    // 传递颜色
    v_color.assign(color);

    // 最终位置
    gl_Position.assign(perDraw.transform.P.multiply(pEC));
});

// 定义 Material 结构体
const Material = struct('Material', {
    ambient: vec3(),
    diffuse: vec3(),
    specular: vec3(),
    shininess: float(),
});

// 定义 PerScene UBO
const PerScene = struct('PerScene', {
    material: Material,
});

const perScene = uniform('perScene', PerScene);

// 定义 Light 结构体
const Light = struct('Light', {
    position: vec3(),
});

// 定义 PerPass UBO
const PerPass = struct('PerPass', {
    light: Light,
});

const perPass = uniform('perPass', PerPass);

// 片段着色器
export const fragmentShader = fragment('main', () =>
{
    precision('highp', 'float');
    precision('highp', 'int');

    // 标准化法线
    const n = normalize(v_normal);

    // 计算光线方向（光源位置在相机空间）
    const l = normalize(perPass.light.position.add(v_view));

    // 标准化视线方向
    const v = normalize(v_view);

    // 计算漫反射
    const diffuse = perScene.material.diffuse.multiply(max(dot(n, l), 0.0));

    // 计算反射向量: r = -reflect(l, n)
    const r = reflect(l, n).negate();

    // 计算镜面反射
    const specular = perScene.material.specular.multiply(
        pow(max(dot(r, v), 0.0), perScene.material.shininess),
    );

    // 最终颜色 = 环境光 + 漫反射 + 镜面反射
    gl_FragColor.assign(vec4(perScene.material.ambient.add(diffuse).add(specular), 1.0));
});
