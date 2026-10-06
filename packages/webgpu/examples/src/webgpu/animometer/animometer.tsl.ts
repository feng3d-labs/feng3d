/**
 * animometer 示例的动画着色器（原 `animometer.wgsl` 的 TSL 版，含两个入口）。
 *
 * 对照手写：顶点按时间做一个"来回"的淡入淡出 + 绕原点旋转 + 平移；片元直接把颜色传出。
 *
 * 三处说明：
 * 1. 手写的浮点取模 `x % 1.0` 用本批新增的 `Float.modulo`；
 * 2. 手写用 `var fade = ...` 后再在 if/else 里重新赋值——TSL 用 var_ + assign
 *    （容器会自动落到 if/else 体内）；
 * 3. `1.0 - fade` 写成 `float(1.0).subtract(fade)`（避免内联改写结合顺序）。
 */
import { assign, attribute, cos, float, fragment, gl_Position, if_, let_, return_, sin, struct, uniform, var_, varying, vec4, vertex } from '@feng3d/tsl';

type FloatValue = ReturnType<typeof float>;
type Vec4Value = ReturnType<typeof vec4>;

/** 懒构建缓存 */
let cached: { vertex: string; fragment: string } | null = null;

/**
 * 获取 animometer 的 vertex / fragment WGSL。
 *
 * @returns vertex / fragment 的 WGSL 文本
 */
export function getAnimometerWGSL(): { vertex: string; fragment: string }
{
    if (cached === null)
    {
        // time 与 uniforms 在两个不同的 group，binding 都是 0
        const Time = struct('Time', { value: float });
        const time = Time(uniform('time', 0, 0)) as unknown as { value: FloatValue };

        const Uniforms = struct('Uniforms', {
            scale: float,
            offsetX: float,
            offsetY: float,
            scalar: float,
            scalarOffset: float,
        });
        const uniforms = Uniforms(uniform('uniforms', 1, 0)) as unknown as {
            scale: FloatValue;
            offsetX: FloatValue;
            offsetY: FloatValue;
            scalar: FloatValue;
            scalarOffset: FloatValue;
        };

        const a_position = vec4(attribute('position', 0));
        const a_color = vec4(attribute('color', 1));

        const vertexShader = vertex('vert_main', () =>
        {
            const vout_color = vec4(varying('v_color', 0));

            // fade = (scalarOffset + time * scalar / 10.0) % 1.0
            const fade = var_('fade', uniforms.scalarOffset
                .add(time.value.multiply(uniforms.scalar).divide(float(10.0)) as FloatValue)
                .modulo(float(1.0)) as FloatValue) as FloatValue;

            if_(fade.lessThan(0.5), () =>
            {
                assign(fade, fade.multiply(float(2.0)) as FloatValue);
            }).else(() =>
            {
                assign(fade, (float(1.0).subtract(fade) as FloatValue).multiply(float(2.0)) as FloatValue);
            });

            const xpos = var_('xpos', (a_position.x as FloatValue).multiply(uniforms.scale) as FloatValue) as FloatValue;
            const ypos = var_('ypos', (a_position.y as FloatValue).multiply(uniforms.scale) as FloatValue) as FloatValue;
            const angle = let_('angle', float(3.14159 * 2.0).multiply(fade) as FloatValue) as FloatValue;

            const xrot = let_('xrot', xpos.multiply(cos(angle)).subtract(ypos.multiply(sin(angle))) as FloatValue) as FloatValue;
            const yrot = let_('yrot', xpos.multiply(sin(angle)).add(ypos.multiply(cos(angle))) as FloatValue) as FloatValue;

            assign(xpos, xrot.add(uniforms.offsetX) as FloatValue);
            assign(ypos, yrot.add(uniforms.offsetY) as FloatValue);

            vout_color.assign(vec4(
                fade,
                float(1.0).subtract(fade),
                0.0,
                1.0,
            ).add(a_color) as Vec4Value);
            gl_Position.assign(vec4(xpos, ypos, 0.0, 1.0) as Vec4Value);
        });

        const fragmentShader = fragment('frag_main', () =>
        {
            const vin_color = vec4(varying('v_color', 0));

            return_(vin_color);
        });

        cached = { vertex: vertexShader.toWGSL(), fragment: fragmentShader.toWGSL(vertexShader) };
    }

    return cached;
}
