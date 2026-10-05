/**
 * points 示例的橙色片元着色器（原 `orange.frag.wgsl` 的 TSL 版）。
 *
 * 手写就三行：返回常量橙色。
 */
import { fragment, return_, vec4 } from '@feng3d/tsl';

/** 懒构建缓存 */
let cached: string | null = null;

/**
 * 获取橙色片元着色器的 WGSL。
 *
 * @returns WGSL 文本
 */
export function getPointsOrangeFragWGSL(): string
{
    if (cached === null)
    {
        cached = fragment('fs', () =>
        {
            return_(vec4(1.0, 0.5, 0.2, 1.0));
        }).toWGSL();
    }

    return cached;
}
