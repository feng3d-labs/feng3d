/**
 * multipleCanvases 示例的着色器（内联 WGSL 的 TSL 版）。
 *
 * 对应原先内联在 `webgpu/multipleCanvases/index.ts` 里的那段：顶点做世界/投影变换并把法线
 * 变换到世界空间，片元用一个固定方向光做简单兰伯特着色。
 *
 * 与原手写的差异（语义等价）：原手写把顶点输入写成 `struct Vertex { @location(0) position,
 * @location(1) normal }` 并用它当入口参数，这里按 TSL 的习惯直接声明两个 attribute
 * （生成的 `@location` 一致，WGSL 语义等价）。
 *
 * 构建结果懒加载并缓存（模块顶层不执行构建，见 AGENTS.md §15 R2）。
 */
import { attribute, dot, fragment, gl_Position, let_, mat4, normalize, return_, struct, uniform, varying, vec3, vec4, vertex } from '@feng3d/tsl';

/** 懒构建缓存 */
let cachedMultipleCanvases: { vertex: string; fragment: string } | null = null;

/**
 * 获取 multipleCanvases 的顶点 / 片元 WGSL。
 *
 * @returns vertex / fragment 的 WGSL 文本
 */
export function getMultipleCanvasesWGSL(): { vertex: string; fragment: string }
{
    if (cachedMultipleCanvases === null)
    {
        cachedMultipleCanvases = buildMultipleCanvases();
    }

    return cachedMultipleCanvases;
}

function buildMultipleCanvases(): { vertex: string; fragment: string }
{
    const Uniforms = struct('Uniforms', {
        worldViewProjectionMatrix: mat4,
        worldMatrix: mat4,
        color: vec4,
    });
    const uni = Uniforms(uniform('uni', 0, 0));

    const position = vec4(attribute('position', 0));
    const normal = vec3(attribute('normal', 1));
    const v_normal = vec3(varying('normal'));

    const vertexShader = vertex('vs', () =>
    {
        gl_Position.assign(uni.worldViewProjectionMatrix.multiply(position));
        v_normal.assign(uni.worldMatrix.multiply(vec4(normal, 0.0)).xyz);
    });

    const fragmentShader = fragment('fs', () =>
    {
        const lightDirection = let_('lightDirection', normalize(vec3(4.0, 10.0, 6.0)));
        const light = let_('light', dot(normalize(v_normal), lightDirection).multiply(0.5).add(0.5));

        return_(vec4(uni.color.xyz.multiply(light), uni.color.a));
    });

    return { vertex: vertexShader.toWGSL(), fragment: fragmentShader.toWGSL(vertexShader) };
}
