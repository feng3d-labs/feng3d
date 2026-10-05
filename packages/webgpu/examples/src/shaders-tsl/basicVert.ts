/**
 * 基础顶点着色器（原 `basic.vert.wgsl`）。
 *
 * 本文件是 `src/shaders/*.wgsl` 的 TSL 版本（issue #712：把 examples 的手写 WGSL 改用 TSL 编写）。
 * 生成的 WGSL 与原手写文件逐行对应（binding、location、表达式顺序都保持一致）。
 *
 * 构建结果懒加载并缓存（模块顶层不执行构建，见 AGENTS.md §15 R2）。
 */
import { attribute, gl_Position, mat4, struct, uniform, varying, vec2, vec4, vertex } from '@feng3d/tsl';

/** 懒构建缓存 */
let cachedBasicVert: string | null = null;

/**
 * 获取基础顶点着色器的 WGSL。
 *
 * @returns 顶点着色器 WGSL 文本
 */
export function getBasicVertWGSL(): string
{
    if (cachedBasicVert === null)
    {
        cachedBasicVert = buildBasicVert();
    }

    return cachedBasicVert;
}

function buildBasicVert(): string
{
    const Uniforms = struct('Uniforms', { modelViewProjectionMatrix: mat4 });
    const uniforms = Uniforms(uniform('uniforms', 0, 0));

    const position = vec4(attribute('position', 0));
    const uv = vec2(attribute('uv', 1));
    const v_fragUV = vec2(varying('fragUV'));
    const v_fragPosition = vec4(varying('fragPosition'));

    const vertexShader = vertex('main', () =>
    {
        gl_Position.assign(uniforms.modelViewProjectionMatrix.multiply(position));
        v_fragUV.assign(uv);
        // 0.5 * (position + vec4(1.0))：与手写一致（标量乘法位置不同但语义等价）
        v_fragPosition.assign(position.add(vec4(1.0)).multiply(0.5));
    });

    return vertexShader.toWGSL();
}
