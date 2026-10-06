/**
 * 黑色片元着色器（原 `black.frag.wgsl`）。
 *
 * 本文件是 `src/shaders/*.wgsl` 的 TSL 版本（issue #712：把 examples 的手写 WGSL 改用 TSL 编写）。
 * 生成的 WGSL 与原手写文件逐行对应（binding、location、表达式顺序都保持一致）。
 *
 * 构建结果懒加载并缓存（模块顶层不执行构建，见 AGENTS.md §15 R2）。
 */
import { fragment, return_, vec4 } from '@feng3d/tsl';

/** 懒构建缓存 */
let cachedBlackFrag: string | null = null;

/**
 * 获取黑色片元着色器的 WGSL。
 *
 * @returns 片元着色器 WGSL 文本
 */
export function getBlackFragWGSL(): string
{
    if (cachedBlackFrag === null)
    {
        cachedBlackFrag = fragment('main', () =>
        {
            return_(vec4(0.0, 0.0, 0.0, 1.0));
        }).toWGSL();
    }

    return cachedBlackFrag;
}
