import { attribute, float, fragment, gl_InstanceID, gl_Position, precision, return_, varying, vec2, vec4, vertex } from '@feng3d/tsl';

// 输入属性
const pos = attribute('pos', vec2(), 0);
const color = attribute('color', vec4(), 1);

// varying 变量
const v_color = varying('v_color', vec4());

// 顶点着色器
export const vertexShader = vertex('main', () =>
{
    precision('highp', 'float');
    precision('highp', 'int');

    // 计算
    v_color.assign(color);
    gl_Position.assign(vec4(pos.add(vec2(float(gl_InstanceID).subtract(0.5), 0.0)), 0.0, 1.0));
});

// 片段着色器
export const fragmentShader = fragment('main', () =>
{
    precision('highp', 'float');
    precision('highp', 'int');

    // 计算
    return_(v_color);
});
