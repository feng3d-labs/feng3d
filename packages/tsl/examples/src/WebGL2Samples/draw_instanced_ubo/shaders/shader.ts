import { array, attribute, fragment, gl_FragColor, gl_InstanceID, gl_Position, int, mat4, precision, struct, uniform, varying, vec2, vec4, vertex } from '@feng3d/tsl';

// 输入属性
const pos = attribute('pos', vec2(), 0);

// 定义 Transform UBO（包含 MVP 矩阵数组）
const Transform = struct('Transform', {
    MVP: array(mat4(), 2),
});

const transform = uniform('transform', Transform);

// 定义 Material UBO（包含颜色数组）
const Material = struct('Material', {
    Diffuse: array(vec4(), 2),
});

const material = uniform('material', Material);

// varying 变量 - flat 插值（与原示例一致使用 instance 命名）
const instance = varying('instance', int(), { interpolation: 'flat' });

// 顶点着色器
export const vertexShader = vertex('main', () =>
{
    precision('highp', 'float');
    precision('highp', 'int');

    // 传递实例 ID 到片段着色器
    instance.assign(int(gl_InstanceID));

    // 计算位置
    gl_Position.assign(transform.MVP.index(gl_InstanceID).multiply(vec4(pos, 0.0, 1.0)));
});

// 片段着色器
export const fragmentShader = fragment('main', () =>
{
    precision('highp', 'float');
    precision('highp', 'int');

    // 根据实例 ID 索引对应的颜色（使用类型断言）
    gl_FragColor.assign(material.Diffuse.index(instance.mod(2)));
});
