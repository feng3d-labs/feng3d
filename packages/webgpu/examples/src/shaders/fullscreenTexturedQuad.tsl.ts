/**
 * 全屏纹理四边形（原 `fullscreenTexturedQuad.wgsl`，含 vertex 与 fragment 两个入口）。
 *
 * 本文件是 `src/shaders/*.wgsl` 的 TSL 版本（issue #712：把 examples 的手写 WGSL 改用 TSL 编写）。
 * 生成的 WGSL 与原手写文件逐行对应（binding、location、表达式顺序都保持一致）。
 *
 * 构建结果懒加载并缓存（模块顶层不执行构建，见 AGENTS.md §15 R2）。
 */
import { arrayWithValues, gl_Position, gl_VertexID, fragment, int, let_, return_, sampler2D, texture, uniform, var_, varying, vec2, vec3, vec4, vertex } from '@feng3d/tsl';

/** 懒构建缓存 */
let cachedFullscreenTexturedQuad: string | null = null;

/**
 * 获取全屏纹理四边形的 WGSL（同时含 vertex 与 fragment 入口）。
 *
 * @returns 着色器 WGSL 文本
 */
export function getFullscreenTexturedQuadWGSL(): string
{
    if (cachedFullscreenTexturedQuad === null)
    {
        cachedFullscreenTexturedQuad = buildFullscreenTexturedQuad();
    }

    return cachedFullscreenTexturedQuad;
}

function buildFullscreenTexturedQuad(): string
{
    const myTexture = sampler2D(uniform('myTexture', 0, 1));
    const v_fragUV = vec2(varying('fragUV'));

    const vertexShader = vertex('vert_main', () =>
    {
        const pos = var_('pos', arrayWithValues(vec2, [
            vec2(1.0, 1.0), vec2(1.0, -1.0), vec2(-1.0, -1.0),
            vec2(1.0, 1.0), vec2(-1.0, -1.0), vec2(-1.0, 1.0),
        ]));
        const uv = var_('uv', arrayWithValues(vec2, [
            vec2(1.0, 0.0), vec2(1.0, 1.0), vec2(0.0, 1.0),
            vec2(1.0, 0.0), vec2(0.0, 1.0), vec2(0.0, 0.0),
        ]));

        const index = int(gl_VertexID);
        const p = let_('p', pos.index(index));

        gl_Position.assign(vec4(vec3(p, 0.0), 1.0));
        v_fragUV.assign(uv.index(index));
    });

    const fragmentShader = fragment('frag_main', () =>
    {
        return_(texture(myTexture, v_fragUV));
    });

    return `${vertexShader.toWGSL()}
${fragmentShader.toWGSL(vertexShader)}`;
}
