/**
 * cornell 示例的色调映射计算着色器（原 `tonemapper.wgsl` 的 TSL 版）。
 *
 * 对照手写：把线性光 framebuffer 做 Reinhard 色调映射 + gamma 校正后写进存储纹理。
 *
 * 四处说明：
 * 1. 输出的存储纹理格式由**调用方**给出（手写用字符串替换 `{OUTPUT_FORMAT}`），
 *    这里直接作为参数传入；
 * 2. `override WorkgroupSizeX / Y : u32;`（无默认值）用 compute 的 overrides 的 { type } 形式，
 *    并在 `@workgroup_size` 里用变量名（WorkgroupSize 的 string 分量）；
 * 3. 输入是**裸纹理**（textureOnly）；输出是 storageTexture2D；
 * 4. 辅助函数用 func()——它在生成时会被提到入口函数**之外**。
 */
import { builtin, compute, float, func, ivec2, int, pow, return_, sampler2D, storageTexture2D, texelFetch, textureStore, uniform, uvec3, vec3, vec4 } from '@feng3d/tsl';

type Vec3Value = ReturnType<typeof vec3>;
type Vec4Value = ReturnType<typeof vec4>;
type FloatValue = ReturnType<typeof float>;

/** 手写的顶层常量 */
const TONEMAP_EXPOSURE = 0.5;
const GAMMA = 2.2;

/** 懒构建缓存（按输出格式分别缓存）。**必须 lazy-init**——模块级 new Map() 违反 R2 门禁。 */
let cache: Map<string, string> | null = null;

/**
 * 获取色调映射 compute 的 WGSL。
 *
 * @param outputFormat 输出存储纹理的格式（如 'rgba16float' / 'bgra8unorm'）
 * @returns WGSL 文本
 */
export function getTonemapperWGSL(outputFormat: string): string
{
    if (cache === null) cache = new Map<string, string>();

    const cached = cache.get(outputFormat);

    if (cached !== undefined) return cached;

    const input = sampler2D(uniform('input', 0, 0), { textureOnly: true });
    const output = storageTexture2D(uniform('output', 0, 1), outputFormat);

    // reinhard_tonemap：color * Exposure → color / (1 + color) → pow(., 1/Gamma)
    const reinhardTonemap = func('reinhard_tonemap', [['linearColor', vec3]], vec3, (linearColor) =>
    {
        // linearColor * TonemapExposure（走向量侧的乘法，避免 Float.multiply 的联合返回类型）
        const exposure = float(TONEMAP_EXPOSURE);
        const color = (linearColor as Vec3Value).multiply(vec3(exposure, exposure, exposure)) as Vec3Value;
        // color / (1 + color)——两侧都走向量运算
        const mapped = color.divide(vec3(1.0, 1.0, 1.0).add(color) as Vec3Value) as Vec3Value;
        const g = float(1.0 / GAMMA);

        return_(pow(mapped, vec3(g, g, g)) as Vec3Value);
    });

    const wgsl = compute('main', ['WorkgroupSizeX', 'WorkgroupSizeY'], () =>
    {
        const invocationId = uvec3(builtin('global_invocation_id'));
        const coord = ivec2(int(invocationId.x), int(invocationId.y));
        // let color = textureLoad(input, vec2<i32>(invocation_id.xy), 0).rgb
        const color = (texelFetch(input, coord) as Vec4Value).rgb as Vec3Value;
        const tonemapped = reinhardTonemap(color);

        textureStore(output, coord, vec4(tonemapped, float(1.0)) as Vec4Value);
    }, {
        overrides: {
            WorkgroupSizeX: { type: 'u32' },
            WorkgroupSizeY: { type: 'u32' },
        },
    }).toWGSL();

    cache.set(outputFormat, wgsl);

    return wgsl;
}
