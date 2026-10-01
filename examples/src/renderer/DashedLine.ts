import { WebGPU } from '@feng3d/webgpu';
import { buildLineGeometry, logic, reactive, ticker, type CustomGeometry, type View } from 'feng3d';

/**
 * 虚线几何构建示例：用 buildLineGeometry 按不同的 dashedLinePattern 生成 7 组虚线三角带，
 * 合并到一个 CustomGeometry（positions + colors + indices）后用 ColorMaterial 渲染。
 *
 * 对照旧版 WebGLRenderer + RenderAtomic 的等价写法：
 * - RenderAtomic.attributes/index → CustomGeometry.positions / colors / indices
 * - RenderAtomic.shader（手写 GLSL）→ ColorMaterial（引擎内置 color 着色器）
 * - WebGLRenderer.render          → WebGPU.submit（由 ticker.onframe 每帧驱动）
 *
 * dashedLinePattern 语义与 CanvasRenderingContext2D.setLineDash 一致：
 * - []            → 实线
 * - [12, 3, 3]    → 等价 [12, 3, 3, 12, 3, 3]
 */

/** 每条虚线用到的线段端点（2D，x/y 交替） */
const lineData = [-300, 0, 300, 0];

/** 7 组虚线图案（与 Canvas setLineDash 的 pattern 一致） */
const PATTERNS: readonly number[][] = [
    [],
    [1, 1],
    [10, 10],
    [20, 5],
    [15, 3, 3, 3],
    [20, 3, 3, 3, 3, 3, 3, 3],
    [12, 3, 3],
];

/** 每条虚线的颜色（顶点色 × ColorMaterial 的 u_diffuseInput） */
const LINE_COLORS: readonly (readonly [number, number, number])[] = [
    [1, 1, 1],
    [1, 0.25, 0.25],
    [1, 0.6, 0.1],
    [0.9, 0.9, 0.2],
    [0.3, 1, 0.3],
    [0.2, 0.8, 1],
    [0.6, 0.4, 1],
];

/** 顶点坐标缩放：把 ±300 的构建坐标压到 NDC 量级（±1 的正交相机视野内） */
const SCALE = 1 / 500;

// ---- 逐条构建虚线几何，累加到同一个 geometry 容器 ----
const lineGeometry: { points: number[]; indices: number[] } = { points: [], indices: [] };
// 每条虚线占用 [起始顶点, 顶点数]，用于后续按线条着色
const lineVertexRanges: Array<{ start: number; count: number }> = [];

for (const pattern of PATTERNS)
{
    const start = lineGeometry.points.length / 2;

    buildLineGeometry({
        points: lineData.slice(),
        lineStyle: { width: 2, dashedLinePatternUnit: 2, dashedLinePattern: pattern as number[] },
    }, lineGeometry);

    lineVertexRanges.push({ start, count: lineGeometry.points.length / 2 - start });

    // 下一条虚线整体下移（与 Canvas 中多行虚线对比效果一致）
    for (let i = 0; i < lineData.length; i += 2)
    {
        lineData[i + 1] -= 20;
    }
}

// ---- 组装引擎顶点数据（3D 位置 + 4D 顶点色 + 索引） ----
const positions: number[] = [];
const colors: number[] = [];

for (let i = 0; i < lineGeometry.points.length; i += 2)
{
    positions.push(lineGeometry.points[i] * SCALE, lineGeometry.points[i + 1] * SCALE, 0);
}

lineVertexRanges.forEach((range, lineIndex) =>
{
    const [r, g, b] = LINE_COLORS[lineIndex % LINE_COLORS.length];
    for (let i = 0; i < range.count; i++)
    {
        colors.push(r, g, b, 1);
    }
});

const geometry: CustomGeometry = { __type__: 'CustomGeometry' };
// 顶点数据通过响应式数据接口写入（geometry 字段只读）
const r_geometry = reactive(geometry);
r_geometry.positions = positions;
r_geometry.colors = colors;
r_geometry.indices = lineGeometry.indices;

const webgpuCanvas = document.getElementById('webgpu') as HTMLCanvasElement;
const webgpu = await new WebGPU().init();

const view: View = {
    __type__: 'View',
    canvas: webgpuCanvas,
    root: {
        __type__: 'Object3D',
        name: 'Untitled',
        components: [{
            __type__: 'Scene',
            background: { __type__: 'Color4', r: 0.067, g: 0.067, b: 0.067, a: 1 },
        }],
        children: [{
            __type__: 'Object3D',
            name: 'Main Camera',
            // 7 条虚线纵向居中（y 范围 0 ~ -0.24）
            position: { x: 0, y: -0.12, z: 1 },
            components: [{
                // 正交相机：left/right/top/bottom = ±1 时与构建坐标的 NDC 量级一一对应
                __type__: 'OrthographicCamera',
                left: -1,
                right: 1,
                top: 1,
                bottom: -1,
                near: 0.1,
                far: 10,
            }],
        }, {
            __type__: 'Object3D',
            name: 'dashedLines',
            components: [{
                __type__: 'MeshRenderer',
                geometry,
                material: {
                    __type__: 'ColorMaterial',
                    uniforms: {
                        u_diffuseInput: { __type__: 'Color4', r: 1, g: 1, b: 1, a: 1 },
                    },
                },
            }],
        }],
    },
};
const viewLogic = logic(view);

ticker.onframe(() => { webgpu.submit(viewLogic.submit); });
