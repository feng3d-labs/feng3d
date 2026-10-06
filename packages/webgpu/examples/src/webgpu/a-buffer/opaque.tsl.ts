/**
 * a-buffer 示例的不透明几何着色器（原 \`opaque.wgsl\` 的 TSL 版，含两个入口）。
 *
 * 对照手写：把实例分布到错开的 4x4 网格上（顶点），片元按 \`instance % 6\` 取调色板颜色。
 *
 * 三处说明：
 * 1. \`@interpolate(flat)\` 的 u32 varying——TSL 用 \`varying('instance', { interpolation: 'flat', location: 0 })\`；
 * 2. 手写的 \`f32(row % 2u != 0u)\` 写成 \`float(row.modulo(2))\`：\`row % 2\` 只有 0/1 两种取值，
 *    与"是否非零"等价；
 * 3. 手写的顶层 \`const gridWidth = 125.0\` / \`cellSize\` 是编译期常量，这里直接内联数值。
 */
import { arrayWithValues, assign, attribute, builtin, float, fragment, gl_Position, let_, mat4, return_, struct, uint, uniform, varying, vec3, vec4, vertex } from '@feng3d/tsl';

type Vec3Value = ReturnType<typeof vec3>;
type Vec4Value = ReturnType<typeof vec4>;
type UIntValue = ReturnType<typeof uint>;

/** 手写的顶层常量 */
const GRID_WIDTH = 125.0;
const CELL_SIZE = GRID_WIDTH / 4.0;

/** 懒构建缓存 */
let cached: { vertex: string; fragment: string } | null = null;

/**
 * 获取不透明几何的 vertex / fragment WGSL。
 *
 * @returns vertex / fragment 的 WGSL 文本
 */
export function getABufferOpaqueWGSL(): { vertex: string; fragment: string }
{
    if (cached === null)
    {
        const Uniforms = struct('Uniforms', {
            modelViewProjectionMatrix: mat4,
            maxStorableFragments: uint,
            targetWidth: uint,
        });
        const uniforms = Uniforms(uniform('uniforms', 0, 0)) as unknown as {
            modelViewProjectionMatrix: ReturnType<typeof mat4>;
        };

        const a_position = vec4(attribute('position', 0));
        const instanceIndex = uint(builtin('gl_InstanceID')) as UIntValue;
        // flat 插值的 u32 varying（显式 location 0）
        const vout_instance = uint(varying('instance', { interpolation: 'flat', location: 0 })) as UIntValue;

        const vertexShader = vertex('main_vs', () =>
        {
            const row = let_('row', instanceIndex.divide(uint(2))) as UIntValue;
            const col = let_('col', instanceIndex.modulo(uint(2))) as UIntValue;

            void col;

            // xOffset = -gridWidth/2 + cellSize/2 + 2*cellSize*f32(col) + f32(row%2 != 0)*cellSize
            const rowOdd = let_('rowOdd', float(row.modulo(uint(2))));
            const xOffset = let_('xOffset',
                float(-GRID_WIDTH / 2.0)
                    .add(float(CELL_SIZE / 2.0))
                    .add(float(2.0 * CELL_SIZE).multiply(float(col)))
                    .add(rowOdd.multiply(float(CELL_SIZE))));
            // zOffset = -gridWidth/2 + cellSize/2 + 2.0 + f32(row)*cellSize
            const zOffset = let_('zOffset',
                float(-GRID_WIDTH / 2.0)
                    .add(float(CELL_SIZE / 2.0))
                    .add(float(2.0))
                    .add(float(row).multiply(float(CELL_SIZE))));

            const offsetPos = let_('offsetPos', vec4(
                a_position.x.add(xOffset),
                a_position.y,
                a_position.z.add(zOffset),
                a_position.w,
            ) as Vec4Value);

            gl_Position.assign(uniforms.modelViewProjectionMatrix.multiply(offsetPos) as Vec4Value);
            assign(vout_instance, instanceIndex);
        });

        // 调色板（手写的顶层 const 数组）
        const colors = arrayWithValues(vec3, [
            vec3(1.0, 0.0, 0.0), vec3(0.0, 1.0, 0.0), vec3(0.0, 0.0, 1.0),
            vec3(1.0, 0.0, 1.0), vec3(1.0, 1.0, 0.0), vec3(0.0, 1.0, 1.0),
        ]);

        const fragmentShader = fragment('main_fs', () =>
        {
            // varying 要在使用它的着色器里单独创建
            const vin_instance = uint(varying('instance', { interpolation: 'flat', location: 0 })) as UIntValue;
            const color = let_('color', colors.index(vin_instance.modulo(uint(6))) as Vec3Value);

            return_(vec4(color, 1.0) as Vec4Value);
        });

        cached = { vertex: vertexShader.toWGSL(), fragment: fragmentShader.toWGSL(vertexShader) };
    }

    return cached;
}
