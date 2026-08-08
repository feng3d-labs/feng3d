import { WebGPU } from '@feng3d/webgpu';
import { CustomGeometry, createTextureFromCanvas, logic, MeshRenderer, Object3D, reactive, Scene, StandardMaterial, View, ticker } from 'feng3d';

/**
 * 随机 UV 贴图（checker 纹理在随机 UV 坐标上的效果）。
 *
 * 对照 three.js：examples/webgl_random_uv.html
 * 每次按键随机化几何体 UV，观察棋盘格纹理变化。
 */

const webgpuCanvas = document.getElementById('webgpu') as HTMLCanvasElement;
const webgpu = await new WebGPU().init();

// 棋盘格纹理
const checkerCanvas = document.createElement('canvas');
checkerCanvas.width = checkerCanvas.height = 32;
const cctx = checkerCanvas.getContext('2d')!;
cctx.fillStyle = '#444'; cctx.fillRect(0, 0, 32, 32);
cctx.fillStyle = '#ddd'; cctx.fillRect(0, 0, 16, 16); cctx.fillRect(16, 16, 16, 16);
const checkerTex = createTextureFromCanvas(checkerCanvas);

// 用 CustomGeometry 建一个平面，UV 随机
function makeGeo(): CustomGeometry
{
    const positions = [-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0];
    // 随机 UV（0~3 范围）
    const uvs = [
        Math.random() * 3, Math.random() * 3,
        Math.random() * 3, Math.random() * 3,
        Math.random() * 3, Math.random() * 3,
        Math.random() * 3, Math.random() * 3,
    ];
    const indices = [0, 1, 2, 0, 2, 3];
    const normals = [0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1];
    const colors = [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1];
    const geo: CustomGeometry = { __type__: 'CustomGeometry' };
    // 顶点数据通过响应式数据接口写入（logic 字段只读）
    const r = reactive(geo);
    r.positions = positions;
    r.uvs = uvs;
    r.normals = normals;
    r.colors = colors;
    r.indices = indices;

    return geo;
}

let currentGeo = makeGeo();
const view: View = {
    __type__: 'View', canvas: webgpuCanvas,
    root: {
        __type__: 'Object3D', name: 'Untitled',
        components: [{ __type__: 'Scene', background: { __type__: 'Color4', r: 0.1, g: 0.1, b: 0.1, a: 1 }, ambientColor: { __type__: 'Color4', r: 1, g: 1, b: 1, a: 1 } }],
        children: [
            { __type__: 'Object3D', name: 'Main Camera', position: { x: 0, y: 0, z: 3 }, rotation: { x: 0, y: 0, z: 0 },
              components: [{ __type__: 'PerspectiveCamera', fov: 45, aspect: webgpuCanvas.width / webgpuCanvas.height, near: 0.1, far: 100 }, { __type__: 'OrbitControls', target: { x: 0, y: 0, z: 0 } }] },
            { __type__: 'Object3D', name: 'plane', rotation: { x: 0, y: 0, z: 0 },
              components: [{ __type__: 'MeshRenderer', geometry: currentGeo,
                material: { __type__: 'StandardMaterial', uniforms: { u_diffuse: { __type__: 'Color4', r: 1, g: 1, b: 1, a: 1 }, u_specular: { __type__: 'Color4', r: 0, g: 0, b: 0, a: 1 }, u_glossiness: 0, u_reflectivity: 0 },
                    s_diffuse: checkerTex as unknown as StandardMaterial['s_diffuse'] } }] },
        ],
    },
};

const viewLogic = logic(view);
const planeNode = view.root!.children![1];

// 按键随机化 UV
window.addEventListener('keydown', () =>
{
    currentGeo = makeGeo();
    reactive(planeNode.components![0] as MeshRenderer).geometry = currentGeo;
});
// 定期自动随机化
setInterval(() =>
{
    currentGeo = makeGeo();
    reactive(planeNode.components![0] as MeshRenderer).geometry = currentGeo;
}, 2000);

ticker.onframe(() => { webgpu.submit(viewLogic.submit); });
