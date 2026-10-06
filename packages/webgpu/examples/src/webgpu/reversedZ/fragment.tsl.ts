/**
 * reversedZ 示例的片元着色器（原 `fragment.wgsl` 的 TSL 版）。
 *
 * 手写就三行：把 `@location(0) fragColor` 原样返回。
 */
import { fragment, return_, varying, vec4 } from '@feng3d/tsl';

/** 懒构建缓存 */
let cached: string | null = null;

/**
 * 获取片元着色器的 WGSL。
 *
 * @returns WGSL 文本
 */
export function getReversedZFragmentWGSL(): string
{
    if (cached === null)
    {
        const v_fragColor = vec4(varying('fragColor', 0));

        cached = fragment('main', () =>
        {
            return_(v_fragColor);
        }).toWGSL();
    }

    return cached;
}
