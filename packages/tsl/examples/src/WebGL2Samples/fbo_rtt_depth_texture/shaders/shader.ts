import { attribute, depthSampler, fragment, gl_Position, precision, return_, texture, uniform, varying, vec2, vec3, vec4, vertex } from '@feng3d/tsl';

// ==================== Depth 着色器 ====================
// Pass 1: 渲染三角形到深度纹理（仅写入深度，无颜色输出）

const depthPosition = attribute('position', vec4());

export const depthVertexShader = vertex('main', () =>
{
    precision('highp', 'float');
    precision('highp', 'int');

    gl_Position.assign(depthPosition);
});

export const depthFragmentShader = fragment('main', () =>
{
    precision('highp', 'float');
    precision('highp', 'int');

    // 不输出任何颜色，仅写入深度
});

// ==================== Draw 着色器 ====================
// Pass 2: 采样深度纹理并可视化显示到屏幕

const drawPosition = attribute('position', vec2());
const drawTexcoord = attribute('textureCoordinates', vec2());

// Varying 变量独立声明
const v_st = varying('v_st', vec2());

export const drawVertexShader = vertex('main', () =>
{
    precision('highp', 'float');
    precision('highp', 'int');

    v_st.assign(drawTexcoord);
    gl_Position.assign(vec4(drawPosition, 0.0, 1.0));
});

// 使用 depthSampler 声明深度纹理
// 深度纹理在 WGSL 中使用 texture_depth_2d 类型和 textureLoad 函数
const depthMap = depthSampler(uniform('depthMap'));

export const drawFragmentShader = fragment('main', () =>
{
    precision('highp', 'float');
    precision('highp', 'int');

    // 从深度纹理采样深度值
    const depth = vec3(texture(depthMap, v_st).r);
    // 反转深度值：越近越白（1-depth），越远越黑
    return_(vec4(vec3(1.0).subtract(depth), 1.0));
});
