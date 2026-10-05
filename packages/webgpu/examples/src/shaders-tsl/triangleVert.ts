/**
 * 三角形顶点着色器（原 `triangle.vert.wgsl`）。
 *
 * 本文件是 `src/shaders/*.wgsl` 的 TSL 版本（issue #712：把 examples 的手写 WGSL 改用 TSL 编写）。
 * 生成的 WGSL 与原手写文件逐行对应（binding、location、表达式顺序都保持一致）。
 *
 * 构建结果懒加载并缓存（模块顶层不执行构建，见 AGENTS.md §15 R2）。
 */
import { arrayWithValues, gl_Position, gl_VertexID, int, let_, var_, vec2, vec3, vec4, vertex } from '@feng3d/tsl';

/** 懒构建缓存 */
let cachedTriangleVert: string | null = null;

/**
 * 获取三角形顶点着色器的 WGSL。
 *
 * @returns 顶点着色器 WGSL 文本
 */
export function getTriangleVertWGSL(): string
{
    if (cachedTriangleVert === null)
    {
        cachedTriangleVert = buildTriangleVert();
    }

    return cachedTriangleVert;
}

function buildTriangleVert(): string
{
    const vertexShader = vertex('main', () =>
    {
        const pos = var_('pos', arrayWithValues(vec2, [vec2(0.0, 0.5), vec2(-0.5, -0.5), vec2(0.5, -0.5)]));
        const p = let_('p', pos.index(int(gl_VertexID)));

        gl_Position.assign(vec4(vec3(p, 0.0), 1.0));
    });

    return vertexShader.toWGSL();
}
