/**
 * resizeObserverHDDPI 示例的棋盘格着色器（原 `checker.wgsl` 的 TSL 版）。
 *
 * 对照手写：
 * ```wgsl
 * struct Uniforms { color0: vec4f, color1: vec4f, size: u32 }
 * @group(0) @binding(0) var<uniform> uni: Uniforms;
 * @vertex fn vs(@builtin(vertex_index) vertexIndex : u32) -> @builtin(position) vec4f {
 *     const pos = array(vec2f(-1,-1), vec2f(3,-1), vec2f(-1,3));
 *     return vec4f(pos[vertexIndex], 0.0, 1.0);
 * }
 * @fragment fn fs(@builtin(position) position: vec4f) -> @location(0) vec4f {
 *     let grid = vec2u(position.xy) / uni.size;
 *     let checker = (grid.x + grid.y) % 2 == 1;
 *     return select(uni.color0, uni.color1, checker);
 * }
 * ```
 */
import { arrayWithValues, builtin, float, fragment, gl_Position, let_, return_, select, struct, uint, uniform, uvec2, var_, vec2, vec4, vertex } from '@feng3d/tsl';

type Vec2Value = ReturnType<typeof vec2>;
type Vec4Value = ReturnType<typeof vec4>;
type UIntValue = ReturnType<typeof uint>;

/** 懒构建缓存 */
let cached: { vertex: string; fragment: string } | null = null;

/**
 * 获取棋盘格着色器的 vertex / fragment WGSL。
 *
 * @returns vertex / fragment 的 WGSL 文本
 */
export function getCheckerShaderWGSL(): { vertex: string; fragment: string }
{
    if (cached === null)
    {
        cached = build();
    }

    return cached;
}

function build(): { vertex: string; fragment: string }
{
    const Uniforms = struct('Uniforms', { color0: vec4, color1: vec4, size: uint });
    const uni = Uniforms(uniform('uni', 0, 0)) as unknown as {
        color0: Vec4Value;
        color1: Vec4Value;
        size: UIntValue;
    };

    const vertexIndex = uint(builtin('gl_VertexID'));
    // 三个顶点覆盖整个屏幕（比全屏四边形省一个顶点）
    const positions = arrayWithValues(vec2, [
        vec2(-1.0, -1.0), vec2(3.0, -1.0), vec2(-1.0, 3.0),
    ]);

    const vertexShader = vertex('vs', () =>
    {
        const pos = let_('pos', positions.index(vertexIndex));

        gl_Position.assign(vec4(pos, 0.0, 1.0));
    });

    const v_position = vec4(builtin('gl_FragCoord'));

    const fragmentShader = fragment('fs', () =>
    {
        // vec2u(position.xy) → uvec2(position.xy)
        const grid = let_('grid', uvec2(v_position.xy as Vec2Value).divide(uni.size));
        // (grid.x + grid.y) % 2 == 1
        const checker = let_('checker', grid.x.add(grid.y).modulo(2).equals(uint(1)));

        return_(select(checker, uni.color1, uni.color0) as Vec4Value);
    });

    return { vertex: vertexShader.toWGSL(), fragment: fragmentShader.toWGSL(vertexShader) };
}
