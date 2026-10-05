/**
 * gameOfLife 的渲染着色器（原 `vert.wgsl` + `frag.wgsl` 的 TSL 版）。
 *
 * 逐句对照手写：
 * ```wgsl
 * @binding(0) @group(0) var<uniform> size: vec2<u32>;
 * @vertex
 * fn main(@builtin(instance_index) i: u32, @location(0) cell: u32, @location(1) pos: vec2<u32>) -> Out {
 *     let w = size.x;
 *     let h = size.y;
 *     let x = (f32(i % w + pos.x) / f32(w) - 0.5) * 2. * f32(w) / f32(max(w, h));
 *     let y = (f32((i - (i % w)) / w + pos.y) / f32(h) - 0.5) * 2. * f32(h) / f32(max(w, h));
 *     return Out(vec4<f32>(x, y, 0., 1.), f32(cell));
 * }
 * @fragment
 * fn main(@location(0) cell: f32) -> @location(0) vec4<f32> { return vec4<f32>(cell, cell, cell, 1.); }
 * ```
 *
 * 一份代码含两个入口（示例把它们分别给 `vertex.code` 与 `fragment.code`）。
 */
import { attribute, builtin, float, fragment, gl_Position, let_, max, return_, struct, uint, uniform, uvec2, varying, vec4, vertex } from '@feng3d/tsl';

type UIntValue = ReturnType<typeof uint>;
type Uvec2Value = ReturnType<typeof uvec2>;

/** 懒构建缓存 */
let cachedGameOfLifeRender: string | null = null;

/**
 * 获取 gameOfLife 的渲染着色器 WGSL（含 vertex 与 fragment 两个入口）。
 *
 * @returns WGSL 文本
 */
export function getGameOfLifeRenderWGSL(): string
{
    if (cachedGameOfLifeRender === null)
    {
        cachedGameOfLifeRender = buildGameOfLifeRender();
    }

    return cachedGameOfLifeRender;
}

function buildGameOfLifeRender(): string
{
    // size 是 vec2<u32> 的 uniform：用 struct 包装（与手写 `var<uniform> size: vec2<u32>` 布局一致）
    const SizeUniform = struct('Size', { size: uvec2 });
    const size = SizeUniform(uniform('size', 0, 0)) as unknown as { size: Uvec2Value };

    const instanceIndex = uint(builtin('gl_InstanceID')) as UIntValue;
    const a_cell = uint(attribute('cell', 0)) as UIntValue;
    const a_pos = uvec2(attribute('pos', 1)) as Uvec2Value;

    // vertex → fragment：cell 以 f32 传递（@location(0)）
    const v_cell = float(varying('cell', 0));

    const vertexShader = vertex('main', () =>
    {
        const w = let_('w', size.size.x) as UIntValue;
        const h = let_('h', size.size.y) as UIntValue;
        const wh = let_('wh', max(w, h)) as UIntValue;

        // x = (f32(i % w + pos.x) / f32(w) - 0.5) * 2.0 * f32(w) / f32(max(w, h))
        const x = let_('x', float(instanceIndex.modulo(w).add(a_pos.x)).divide(float(w)).subtract(float(0.5))
            .multiply(float(2.0)).multiply(float(w)).divide(float(wh)));
        // y = (f32((i - (i % w)) / w + pos.y) / f32(h) - 0.5) * 2.0 * f32(h) / f32(max(w, h))
        const y = let_('y', float(instanceIndex.subtract(instanceIndex.modulo(w)).divide(w).add(a_pos.y))
            .divide(float(h)).subtract(float(0.5)).multiply(float(2.0)).multiply(float(h)).divide(float(wh)));

        gl_Position.assign(vec4(x, y, float(0.0), float(1.0)));
        v_cell.assign(float(a_cell));
    });

    const fragShader = fragment('main', () =>
    {
        return_(vec4(v_cell, v_cell, v_cell, float(1.0)));
    });

    return [vertexShader.toWGSL(), fragShader.toWGSL(vertexShader)].join('\n\n');
}
