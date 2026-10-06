/**
 * `test_web/depth-attachment-canvas-readpixels` 页面所用的着色器（原内联手写 WGSL 的 TSL 版）。
 *
 * 页面里两个三角形用的着色器**完全相同**（只有 `bindingResources.color` 的值不同——红 / 绿），
 * 所以这里只需要一对生成函数。
 *
 * 对照手写：
 * - vertex：`@vertex fn main(@location(0) position: vec3<f32>) -> @builtin(position) vec4<f32>`；
 * - fragment：`@binding(0) @group(0) var<uniform> color: vec4<f32>`。
 *
 * ⚠️ 该页面本身依赖主仓**不存在**的 `@feng3d/render-api`（见 #715），因此**当前无法运行**；
 * 本文件只做"内联手写 WGSL → TSL"的一致性迁移，验证方式是**生成文本比对**（页面无法自动跑）。
 */
import { attribute, fragment, gl_Position, return_, uniform, vec3, vec4, vertex } from '@feng3d/tsl';

type Vec3Value = ReturnType<typeof vec3>;
type Vec4Value = ReturnType<typeof vec4>;

/** 懒构建缓存（模块顶层不执行构建，见 AGENTS.md §15 R2） */
let cachedVertex: string | null = null;
let cachedFragment: string | null = null;

/**
 * 获取实心色三角形的顶点着色器 WGSL。
 *
 * @returns 顶点着色器 WGSL 文本
 */
export function getSolidColorVertexWGSL(): string
{
    if (cachedVertex === null)
    {
        const position = vec3(attribute('position', 0)) as Vec3Value;

        cachedVertex = vertex('main', () =>
        {
            gl_Position.assign(vec4(position, 1.0) as Vec4Value);
        }).toWGSL();
    }

    return cachedVertex;
}

/**
 * 获取实心色三角形的片元着色器 WGSL（颜色取自 uniform）。
 *
 * @returns 片元着色器 WGSL 文本
 */
export function getSolidColorFragmentWGSL(): string
{
    if (cachedFragment === null)
    {
        const color = vec4(uniform('color', 0, 0)) as Vec4Value;

        cachedFragment = fragment('main', () =>
        {
            return_(color);
        }).toWGSL();
    }

    return cachedFragment;
}
