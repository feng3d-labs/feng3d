/**
 * 纹理采样并与顶点位置相乘的片元着色器（原 `sampleTextureMixColor.frag.wgsl`）。
 *
 * 本文件是 `src/shaders/*.wgsl` 的 TSL 版本（issue #712：把 examples 的手写 WGSL 改用 TSL 编写）。
 * 生成的 WGSL 与原手写文件逐行对应（binding、location、表达式顺序都保持一致）。
 *
 * 构建结果懒加载并缓存（模块顶层不执行构建，见 AGENTS.md §15 R2）。
 */
import { fragment, return_, sampler2D, texture, uniform, varying, vec2, vec4 } from '@feng3d/tsl';

/** 懒构建缓存 */
let cachedSampleTextureMixColorFrag: string | null = null;

/**
 * 获取纹理采样并与顶点位置相乘的片元着色器 WGSL。
 *
 * @returns 片元着色器 WGSL 文本
 */
export function getSampleTextureMixColorFragWGSL(): string
{
    if (cachedSampleTextureMixColorFrag === null)
    {
        const myTexture = sampler2D(uniform('myTexture', 0, 2));
        const fragUV = vec2(varying('fragUV'));
        const fragPosition = vec4(varying('fragPosition'));

        cachedSampleTextureMixColorFrag = fragment('main', () =>
        {
            return_(texture(myTexture, fragUV).multiply(fragPosition));
        }).toWGSL();
    }

    return cachedSampleTextureMixColorFrag;
}
