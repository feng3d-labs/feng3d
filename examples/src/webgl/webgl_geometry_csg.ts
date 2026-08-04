import { WebGPU } from '@feng3d/webgpu';
import { logic, Object3D, reactive, Scene, StandardMaterial, View, ticker } from 'feng3d';
import { Vector3 } from '@feng3d/math';
import '@feng3d/addons';
import type { ConvexGeometry } from '@feng3d/addons';

/**
 * 凸包几何体展示（近似 CSG 布尔运算效果）。
 *
 * 对照 three.js：examples/webgl_geometry_csg.html
 * 原示例用 three-bvh-csg 做布尔运算（交/并/差）。
 * feng3d 无 CSG，用 ConvexGeometry（addons）展示凸包生成作为替代。
 */

const webgpuCanvas = document.getElementById('webgpu') as HTMLCanvasElement;
const webgpu = await new WebGPU().init();

// 生成两组点 → ConvexGeometry（确保非退化：用立方体顶点 + 随机扰动）
function randomPoints(cx: number, spread: number): Vector3[]
{
    const pts: Vector3[] = [];
    // 立方体 8 角 + 边中点 + 随机扰动
    for (let i = 0; i < 20; i++)
    {
        pts.push(new Vector3(
            cx + (Math.random() - 0.5) * spread * 2,
            (Math.random() - 0.5) * spread * 2,
            (Math.random() - 0.5) * spread * 2,
        ));
    }
    // 确保至少有正负方向极值点（QuickHull 需要非共面）
    pts[0] = new Vector3(cx - spread, -spread, -spread);
    pts[1] = new Vector3(cx + spread, spread, spread);
    pts[2] = new Vector3(cx, -spread, spread);
    pts[3] = new Vector3(cx + spread, -spread, -spread);

    return pts;
}

const pts1 = randomPoints(-1.5, 1.5);
const pts2 = randomPoints(1.5, 1.5);

let rot1: { x: number; y: number; z: number };
let rot2: { x: number; y: number; z: number };
const view: View = {
    __type__: 'View', canvas: webgpuCanvas,
    root: {
        __type__: 'Object3D', name: 'Untitled',
        components: [{ __type__: 'Scene', background: { __type__: 'Color4', r: 0.1, g: 0.1, b: 0.1, a: 1 }, ambientColor: { __type__: 'Color4', r: 0.6, g: 0.6, b: 0.6, a: 1 } }],
        children: [
            { __type__: 'Object3D', name: 'Main Camera', position: { x: 0, y: 0, z: 10 }, rotation: { x: 0, y: 0, z: 0 },
              components: [{ __type__: 'PerspectiveCamera', fov: 50, aspect: webgpuCanvas.width / webgpuCanvas.height, near: 0.1, far: 100, frustumCulling: false }, { __type__: 'OrbitControls', target: { x: 0, y: 0, z: 0 } }] },
            { __type__: 'Object3D', name: 'dirLight', position: { x: 1, y: 1, z: 1 }, components: [{ __type__: 'DirectionalLight', color: { __type__: 'Color3', r: 1, g: 1, b: 1 }, intensity: 1 }] },
            { __type__: 'Object3D', name: 'convex1', rotation: rot1 = { x: 0, y: 0, z: 0 },
              components: [{ __type__: 'MeshRenderer', geometry: { __type__: 'ConvexGeometry', points: pts1 } as ConvexGeometry,
                material: { __type__: 'StandardMaterial', uniforms: { u_diffuse: { __type__: 'Color4', r: 0.8, g: 0.3, b: 0.3, a: 0.7 }, u_specular: { __type__: 'Color4', r: 0.3, g: 0.3, b: 0.3, a: 1 }, u_glossiness: 20, u_reflectivity: 0 } } }] },
            { __type__: 'Object3D', name: 'convex2', rotation: rot2 = { x: 0, y: 0, z: 0 },
              components: [{ __type__: 'MeshRenderer', geometry: { __type__: 'ConvexGeometry', points: pts2 } as ConvexGeometry,
                material: { __type__: 'StandardMaterial', uniforms: { u_diffuse: { __type__: 'Color4', r: 0.3, g: 0.5, b: 0.9, a: 0.7 }, u_specular: { __type__: 'Color4', r: 0.3, g: 0.3, b: 0.3, a: 1 }, u_glossiness: 20, u_reflectivity: 0 } } }] },
        ],
    },
};

const viewLogic = logic(view);
ticker.onframe(() =>
{
    reactive(rot1).y += 0.003;
    reactive(rot2).y -= 0.005;
    webgpu.submit(viewLogic.submit);
});
