/**
 * 双输出片元着色器（原 `red.frag.wgsl` 的 TSL 版）。
 *
 * 两个 `@location` 输出：color0 红、color1 黄。
 * 说明 TSL 的多输出写法——用 `vec4(fragColor(location, name))` 声明输出槽，
 * 生成 `struct FragmentOut { @location(N) name: vec4<f32>, }` 与 `output.name = ...`。
 *
 * 构建结果懒加载并缓存（模块顶层不执行构建，见 AGENTS.md §15 R2）。
 */
import { fragColor, fragment, vec4 } from '@feng3d/tsl';

/** 懒构建缓存 */
let cachedRedFrag: string | null = null;

/**
 * 获取双输出片元着色器的 WGSL。
 *
 * @returns 片元着色器 WGSL 文本
 */
export function getRedFragWGSL(): string
{
    if (cachedRedFrag === null)
    {
        const color0 = vec4(fragColor(0, 'color0'));
        const color1 = vec4(fragColor(1, 'color1'));

        cachedRedFrag = fragment('main', () =>
        {
            color0.assign(vec4(1.0, 0.0, 0.0, 1.0));
            color1.assign(vec4(1.0, 1.0, 0.0, 1.0));
        }).toWGSL();
    }

    return cachedRedFrag;
}
