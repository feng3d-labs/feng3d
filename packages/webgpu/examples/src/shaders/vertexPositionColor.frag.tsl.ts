/**
 * 顶点位置作为颜色的片元着色器（原 `vertexPositionColor.frag.wgsl`）。
 *
 * 本文件是 `src/shaders/*.wgsl` 的 TSL 版本（issue #712：把 examples 的手写 WGSL 改用 TSL 编写）。
 * 生成的 WGSL 与原手写文件逐行对应（binding、location、表达式顺序都保持一致）。
 *
 * 构建结果懒加载并缓存（模块顶层不执行构建，见 AGENTS.md §15 R2）。
 */
import { fragment, let_, return_, varying, vec2, vec4 } from '@feng3d/tsl';

/** 懒构建缓存 */
let cachedVertexPositionColorFrag: string | null = null;

/**
 * 获取顶点位置作为颜色的片元着色器 WGSL。
 *
 * @returns 片元着色器 WGSL 文本
 */
export function getVertexPositionColorFragWGSL(): string
{
    if (cachedVertexPositionColorFrag === null)
    {
        // fragUV 在本着色器里并不参与计算，但**必须保留它的 varying 声明**：
        // 顶点着色器（basic.vert）按声明顺序给它 location 0、给 fragPosition location 1，
        // 若这里被优化掉，fragPosition 就会落到 location 0、与顶点侧错位。
        // TSL 只把"被引用"的 varying 纳入依赖，所以这里用一个 let 引用它（语义上无副作用）。
        const fragUV = vec2(varying('fragUV'));
        const fragPosition = vec4(varying('fragPosition'));

        cachedVertexPositionColorFrag = fragment('main', () =>
        {
            let_('_fragUV', fragUV);
            return_(fragPosition);
        }).toWGSL();
    }

    return cachedVertexPositionColorFrag;
}
