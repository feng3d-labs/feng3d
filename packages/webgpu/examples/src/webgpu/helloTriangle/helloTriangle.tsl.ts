/**
 * 最简三角形着色器（helloTriangle / RenderObjectChanges 内联 WGSL 的 TSL 版）。
 *
 * 对应原先内联在 `webgpu/helloTriangle/index.ts` 与 `webgpu/RenderObjectChanges/index.ts`
 * 里的那段代码：顶点把 vec2 位置补成 clip 坐标，片元返回一个裸 `vec4` uniform 颜色。
 *
 * 构建结果懒加载并缓存（模块顶层不执行构建，见 AGENTS.md §15 R2）。
 */
import { attribute, fragment, gl_Position, return_, uniform, vec2, vec3, vec4, vertex } from '@feng3d/tsl';

/** 懒构建缓存 */
let cachedHelloTriangle: { vertex: string; fragment: string } | null = null;

/**
 * 获取最简三角形的顶点 / 片元 WGSL。
 *
 * @returns vertex / fragment 的 WGSL 文本
 */
export function getHelloTriangleWGSL(): { vertex: string; fragment: string }
{
    if (cachedHelloTriangle === null)
    {
        cachedHelloTriangle = buildHelloTriangle();
    }

    return cachedHelloTriangle;
}

function buildHelloTriangle(): { vertex: string; fragment: string }
{
    // 裸 vec4 uniform（不是 struct）：TSL 里用 vec4(uniform(...)) 表达
    const color = vec4(uniform('color', 0, 0));

    const vertexShader = vertex('main', () =>
    {
        const position = vec2(attribute('position', 0));

        gl_Position.assign(vec4(vec3(position, 0.0), 1.0));
    });

    const fragmentShader = fragment('main', () =>
    {
        return_(color);
    });

    return { vertex: vertexShader.toWGSL(), fragment: fragmentShader.toWGSL(vertexShader) };
}
