/**
 * RenderObjectChanges 的「运行时替换着色器」变体（内联 WGSL 的 TSL 版）。
 *
 * 该示例点击画布后会把 pipeline 里的着色器代码换成另一段：顶点把 x 平移 0.5，
 * 片元把颜色前三个分量改成固定值。这里用 TSL 生成同样的两段。
 *
 * 语义等价说明：原手写用 `var pos = position; pos.x = pos.x + 0.5;`，
 * 而 WGSL 不支持 swizzle 赋值（这正是它要开 var 的原因），
 * TSL 里改为整体重新赋值 `pos = vec2(position.x + 0.5, position.y)`，结果相同。
 *
 * 构建结果懒加载并缓存（模块顶层不执行构建，见 AGENTS.md §15 R2）。
 */
import { attribute, fragment, gl_Position, return_, uniform, var_, vec2, vec3, vec4, vertex } from '@feng3d/tsl';

/** 懒构建缓存 */
let cachedVariant: { vertex: string; fragment: string } | null = null;

/**
 * 获取「运行时替换」变体的顶点 / 片元 WGSL。
 *
 * @returns vertex / fragment 的 WGSL 文本
 */
export function getRenderObjectChangesVariantWGSL(): { vertex: string; fragment: string }
{
    if (cachedVariant === null)
    {
        cachedVariant = buildVariant();
    }

    return cachedVariant;
}

function buildVariant(): { vertex: string; fragment: string }
{
    const color = vec4(uniform('color', 0, 0));

    const vertexShader = vertex('main', () =>
    {
        const position = vec2(attribute('position', 0));
        const pos = var_('pos', position);

        pos.assign(vec2(position.x.add(0.5), position.y));
        gl_Position.assign(vec4(vec3(pos, 0.0), 1.0));
    });

    const fragmentShader = fragment('main', () =>
    {
        const col = var_('col', color);

        col.assign(vec4(0.5, 0.6, 0.7, color.w));
        return_(col);
    });

    return { vertex: vertexShader.toWGSL(), fragment: fragmentShader.toWGSL(vertexShader) };
}
