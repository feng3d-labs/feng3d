/**
 * points 示例的顶点着色器（原 \`distance-sized-points.vert.wgsl\` 的 TSL 版）。
 *
 * 按「屏幕分辨率下的固定像素大小」开点（不受透视影响）。
 *
 * 对照手写：六个顶点的偏移量是**数组字面量**，用 \`vertex_index\` 取。
 */
import { arrayWithValues, attribute, builtin, float, gl_Position, let_, mat4, return_, struct, uint, uniform, var_, varying, vec2, vec4, vertex } from '@feng3d/tsl';

type Vec2Value = ReturnType<typeof vec2>;
type FloatValue = ReturnType<typeof float>;

/** 懒构建缓存 */
let cached: string | null = null;

/**
 * 获取顶点着色器的 WGSL。
 *
 * @returns WGSL 文本
 */
export function getPointsDistanceSizedVertWGSL(): string
{
    if (cached === null)
    {
        cached = build();
    }

    return cached;
}

function build(): string
{
    const Uniforms = struct('Uniforms', {
        matrix: mat4,
        resolution: vec2,
        size: float,
    });
    const uni = Uniforms(uniform('uni', 0, 0)) as unknown as {
        matrix: ReturnType<typeof mat4>;
        resolution: Vec2Value;
        size: FloatValue;
    };

    const vertPosition = vec4(attribute('position', 0));
    const vNdx = uint(builtin('gl_VertexID'));
    const v_texcoord = vec2(varying('texcoord', 0));

    // 六个顶点的偏移（与手写的数组字面量一致）
    const points = arrayWithValues(vec2, [
        vec2(-1.0, -1.0), vec2(1.0, -1.0), vec2(-1.0, 1.0),
        vec2(-1.0, 1.0), vec2(1.0, -1.0), vec2(1.0, 1.0),
    ]);

    const vertexShader = vertex('vs', () =>
    {
        const pos = let_('pos', points.index(vNdx));
        const clipPos = let_('clipPos', uni.matrix.multiply(vertPosition));
        // 标量 size 要显式广播成 vec2（TSL 的 vec2 * Float 不支持）
        const sizeVec = let_('sizeVec', vec2(uni.size, uni.size));
        const pointPos = let_('pointPos', vec4(pos.multiply(sizeVec).divide(uni.resolution), 0.0, 0.0));

        gl_Position.assign(clipPos.add(pointPos));
        // TSL 的 Vec2.multiply 只接受 Vec2（不支持标量），所以把 0.5 显式广播
        v_texcoord.assign(pos.multiply(vec2(0.5, 0.5)).add(vec2(0.5, 0.5)));
    });

    return vertexShader.toWGSL();
}
