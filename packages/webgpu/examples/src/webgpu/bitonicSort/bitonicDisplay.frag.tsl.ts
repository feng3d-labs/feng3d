/**
 * bitonicSort 示例的排序结果可视化片元着色器（原 `bitonicDisplay.frag.wgsl` 的 TSL 版）。
 *
 * 对照手写：把像素坐标换算成元素下标，读到排序后的值后转成灰度；
 * `highlight` 打开时按"是否落在块的前半"染绿/染红。
 *
 * 三处说明：
 * 1. `data: array<u32>` 是 storage 数组（TSL 的 storageBuffer 用 { elementType: uint }）；
 * 2. 手写的 `u32(uniforms.width)`（f32→u32）在 TSL 里是 uint(...)；
 * 3. 最后那个三元选择用 select（注意 TSL 的 select(cond, true, false) 与 WGSL 的
 *    select(false, true, cond) 参数顺序相反，生成时会转过来）。
 */
import { builtin, float, floor, fragment, if_, let_, return_, select, storageBuffer, struct, uint, uniform, uvec2, var_, varying, vec2, vec3, vec4 } from '@feng3d/tsl';

type Vec2Value = ReturnType<typeof vec2>;
type FloatValue = ReturnType<typeof float>;
type Vec4Value = ReturnType<typeof vec4>;

/** 懒构建缓存 */
let cached: string | null = null;

/**
 * 获取可视化片元的 WGSL。
 *
 * @returns WGSL 文本
 */
export function getBitonicDisplayFragWGSL(): string
{
    if (cached === null)
    {
        const ComputeUniforms = struct('ComputeUniforms', {
            width: float,
            height: float,
            algo: uint,
            blockHeight: uint,
        });
        const FragmentUniforms = struct('FragmentUniforms', { highlight: uint });

        // 注意：storage 在 group 0 binding 0，compute uniform 在 group 0 binding 2（binding 1 由 compute 侧占用）
        const data = storageBuffer('data', { elementType: uint, access: 'read', group: 0, binding: 0 });
        const uniforms = ComputeUniforms(uniform('uniforms', 0, 2)) as unknown as {
            width: FloatValue;
            height: FloatValue;
            blockHeight: ReturnType<typeof uint>;
        };
        const fragmentUniforms = FragmentUniforms(uniform('fragment_uniforms', 1, 0)) as unknown as {
            highlight: ReturnType<typeof uint>;
        };

        const coord = vec4(builtin('gl_FragCoord'));
        const v_fragUV = vec2(varying('fragUV', 0));

        cached = fragment('frag_main', () =>
        {
            const uv = var_('uv', vec2(
                v_fragUV.x.multiply(uniforms.width),
                v_fragUV.y.multiply(uniforms.height),
            ) as Vec2Value) as Vec2Value;

            const pixel = let_('pixel', uvec2(
                uint(floor(uv.x)),
                uint(floor(uv.y)),
            ));

            const elementIndex = let_('elementIndex', uint(uniforms.width)
                .multiply(pixel.y)
                .add(pixel.x) as ReturnType<typeof uint>);
            const colorChanger = let_('colorChanger', data.index(elementIndex) as ReturnType<typeof uint>);
            const subtracter = let_('subtracter', float(colorChanger)
                .divide(uniforms.width.multiply(uniforms.height) as FloatValue) as FloatValue);
            // Float.subtract 的返回类型是联合，这里收成具名 Float 再喂给 vec3（否则 vec3 选不中重载）
            const oneMinus = let_('oneMinus', float(1.0).subtract(subtracter) as FloatValue) as FloatValue;

            if_(fragmentUniforms.highlight.equals(uint(1)), () =>
            {
                // elementIndex % blockHeight < blockHeight / 2
                const inFirstHalf = let_('inFirstHalf', elementIndex.modulo(uniforms.blockHeight)
                    .lessThan(uniforms.blockHeight.divide(uint(2))));

                // 手写：select(绿, 红, cond)——WGSL 的 select(f,t,c) 在 c 为真时取 t，
                // 所以 TSL 侧要写成 select(cond, t=红, f=绿) 才等价。
                return_(select(
                    inFirstHalf,
                    vec4(vec3(oneMinus, float(0.0), float(0.0)), 1.0) as Vec4Value, // cond 为真 → 红
                    vec4(vec3(float(0.0), oneMinus, float(0.0)), 1.0) as Vec4Value, // cond 为假 → 绿
                ) as Vec4Value);
            });

            const color = let_('color', vec3(oneMinus, oneMinus, oneMinus));

            void coord;

            return_(vec4(color, 1.0) as Vec4Value);
        }).toWGSL();
    }

    return cached;
}
