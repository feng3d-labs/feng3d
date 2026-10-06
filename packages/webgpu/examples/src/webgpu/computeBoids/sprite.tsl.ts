/**
 * computeBoids 的 sprite 着色器（原 `sprite.wgsl` 的 TSL 版）。
 *
 * 它一份文件里**同时含 vertex 与 fragment 两个入口**（示例把同一份代码同时给
 * `vertex.code` 与 `fragment.code`），所以这里也生成拼接后的两份入口。
 *
 * 逐句对照手写：
 * ```wgsl
 * fn vert_main(@location(0) a_particlePos: vec2<f32>, @location(1) a_particleVel: vec2<f32>,
 *              @location(2) a_pos: vec2<f32>) -> VertexOutput {
 *     let angle = -atan2(a_particleVel.x, a_particleVel.y);
 *     let pos = vec2((a_pos.x * cos(angle)) - (a_pos.y * sin(angle)),
 *                    (a_pos.x * sin(angle)) + (a_pos.y * cos(angle)));
 *     output.position = vec4(pos + a_particlePos, 0.0, 1.0);
 *     output.color = vec4(1.0 - sin(angle + 1.0) - a_particleVel.y,
 *                         pos.x * 100.0 - a_particleVel.y + 0.1,
 *                         a_particleVel.x + cos(angle + 0.5), 1.0);
 * }
 * fn frag_main(@location(4) color: vec4<f32>) -> @location(0) vec4<f32> { return color; }
 * ```
 *
 * 注意两点：
 * - `atan2(y, x)` 在 TSL 里是 `atan(y, x)`；
 * - 手写的 vertex 输出用的是 `@location(4) color`，所以这里用 **varying('''color''', 4)** 让两个入口对齐。
 */
import { Float, atan, attribute, cos, float, fragment, gl_Position, let_, return_, sin, varying, vec2, vec4, vertex } from '@feng3d/tsl';

type Vec2Value = ReturnType<typeof vec2>;

/** 懒构建缓存 */
let cachedComputeBoidsSprite: string | null = null;

/**
 * 获取 computeBoids 的 sprite 着色器 WGSL（含 vertex 与 fragment 两个入口）。
 *
 * @returns WGSL 文本
 */
export function getComputeBoidsSpriteWGSL(): string
{
    if (cachedComputeBoidsSprite === null)
    {
        cachedComputeBoidsSprite = buildComputeBoidsSprite();
    }

    return cachedComputeBoidsSprite;
}

function buildComputeBoidsSprite(): string
{
    // 顶点输入（@location 与手写一致）
    const a_particlePos = vec2(attribute('a_particlePos', 0));
    const a_particleVel = vec2(attribute('a_particleVel', 1));
    const a_pos = vec2(attribute('a_pos', 2));

    // vertex → fragment 传递颜色（手写是 @location(4)）
    const v_color = vec4(varying('color', 4));

    const vertexShader = vertex('vert_main', () =>
    {
        // 手写：-atan2(a_particleVel.x, a_particleVel.y)
        const angle = let_('angle', atan(a_particleVel.x as Float, a_particleVel.y as Float).multiply(-1.0));
        const pos: Vec2Value = let_('pos', vec2(
            a_pos.x.multiply(cos(angle)).subtract(a_pos.y.multiply(sin(angle))),
            a_pos.x.multiply(sin(angle)).add(a_pos.y.multiply(cos(angle))),
        ));

        gl_Position.assign(vec4(pos.add(a_particlePos), 0.0, 1.0));
        v_color.assign(vec4(
            float(1.0).subtract(sin(angle.add(float(1.0)))).subtract(a_particleVel.y),
            pos.x.multiply(float(100.0)).subtract(a_particleVel.y).add(float(0.1)),
            a_particleVel.x.add(cos(angle.add(float(0.5)))),
            1.0,
        ));
    });

    const fragShader = fragment('frag_main', () =>
    {
        return_(v_color);
    });

    // 两份入口拼在一起（示例把同一份代码同时用于 vertex 与 fragment）；
    // fragment 侧传顶点着色器以便对齐 varying 的 location。
    return [vertexShader.toWGSL(), fragShader.toWGSL(vertexShader)].join('\n\n');
}
