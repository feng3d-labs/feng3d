import { WebGPU } from '@feng3d/webgpu';
import { logic, reactive, ticker, type CustomGeometry, type View } from 'feng3d';

/**
 * 渲染基础示例：不经任何几何体工厂，直接用顶点数据（CustomGeometry）画一个顶点色三角形。
 *
 * 对照旧版 WebGLRenderer + RenderAtomic 的等价写法：
 * - RenderAtomic.attributes   → CustomGeometry.positions / colors（纯数据字段，经 reactive 写入）
 * - RenderAtomic.shader（手写 GLSL）→ ColorMaterial（引擎内置 color 着色器）
 * - RenderAtomic.renderParams → 材质字段（depthWrite/cullFace 等）
 * - WebGLRenderer.render      → WebGPU.submit（由 ticker.onframe 每帧驱动）
 */

const webgpuCanvas = document.getElementById('webgpu') as HTMLCanvasElement;
const webgpu = await new WebGPU().init();

// 顶点数据（NDC 坐标，z=0 平面上的一个三角形）
const positions = [
    -0.8, -0.6, 0,
    0.8, -0.6, 0,
    0, 0.8, 0,
];

// 顶点色：ColorMaterial 的最终片元色 = 顶点色 × u_diffuseInput（alpha 取顶点色）
const colors = [
    1, 0, 0, 1,
    0, 1, 0, 1,
    0, 0, 1, 1,
];

const geometry: CustomGeometry = { __type__: 'CustomGeometry' };
// 顶点数据通过响应式数据接口写入（geometry 字段只读）
const r_geometry = reactive(geometry);
r_geometry.positions = positions;
r_geometry.colors = colors;

const view: View = {
    __type__: 'View',
    canvas: webgpuCanvas,
    root: {
        __type__: 'Object3D',
        name: 'Untitled',
        components: [{
            __type__: 'Scene',
            background: { __type__: 'Color4', r: 0.05, g: 0.05, b: 0.08, a: 1 },
        }],
        children: [{
            __type__: 'Object3D',
            name: 'Main Camera',
            position: { x: 0, y: 0, z: 1 },
            components: [{
                // 正交相机：left/right/top/bottom = ±1 时与 NDC 坐标一一对应
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
            name: 'triangle',
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
