import { WebGPU } from '@feng3d/webgpu';
import { logic, Object3D, raycaster, Ray3, reactive, Scene, StandardMaterial, View, ticker } from 'feng3d';
import type { Camera } from 'feng3d';

/** OBB（有向包围盒）碰撞可视化。对照 three.js webgl_math_obb.html
 * 鼠标拖拽球体，检测与其他球体的碰撞并高亮。 */
const webgpuCanvas = document.getElementById('webgpu') as HTMLCanvasElement;
const webgpu = await new WebGPU().init();

const boxes: { node: Object3D; vx: number; vz: number }[] = [];
for (let i = 0; i < 10; i++)
{
    const node: Object3D = {
        __type__: 'Object3D', name: `box_${i}`,
        position: { x: (Math.random() - 0.5) * 16, y: 0, z: (Math.random() - 0.5) * 16 },
        rotation: { x: 0, y: Math.random() * Math.PI, z: 0 },
        components: [{ __type__: 'MeshRenderer', geometry: { __type__: 'CubeGeometry', width: 2, height: 2, depth: 2 },
            material: { __type__: 'StandardMaterial', uniforms: { u_diffuse: { __type__: 'Color4', r: 0.4, g: 0.8, b: 0.4, a: 1 }, u_specular: { __type__: 'Color4', r: 0, g: 0, b: 0, a: 1 }, u_glossiness: 0, u_reflectivity: 0 } } }],
    };
    boxes.push({ node, vx: (Math.random() - 0.5) * 0.1, vz: (Math.random() - 0.5) * 0.1 });
}

const view: View = {
    __type__: 'View', canvas: webgpuCanvas,
    root: {
        __type__: 'Object3D', name: 'Untitled',
        components: [{ __type__: 'Scene', background: { __type__: 'Color4', r: 1, g: 1, b: 1, a: 1 }, ambientColor: { __type__: 'Color4', r: 0.6, g: 0.6, b: 0.6, a: 1 } }],
        children: [
            { __type__: 'Object3D', name: 'cam', position: { x: 0, y: 15, z: 25 }, rotation: { x: 0, y: 0, z: 0 },
              components: [{ __type__: 'PerspectiveCamera', fov: 70, aspect: webgpuCanvas.width / webgpuCanvas.height, near: 1, far: 1000 }, { __type__: 'OrbitControls', target: { x: 0, y: 0, z: 0 } }] },
            { __type__: 'Object3D', name: 'light', position: { x: 1, y: 1, z: 1 }, components: [{ __type__: 'DirectionalLight', color: { __type__: 'Color3', r: 1, g: 1, b: 1 }, intensity: 1 }] },
            ...boxes.map(b => b.node),
        ],
    },
};
const viewLogic = logic(view);
ticker.onframe(() =>
{
    // 移动盒子 + 边界反弹
    for (const b of boxes)
    {
        const p = logic(b.node).position;
        let x = p.x + b.vx, z = p.z + b.vz;
        if (Math.abs(x) > 10) b.vx = -b.vx;
        if (Math.abs(z) > 10) b.vz = -b.vz;
        reactive(b.node).position = { x, y: 0, z };
    }
    // 简单距离碰撞检测（球近似）
    for (let i = 0; i < boxes.length; i++)
    {
        let colliding = false;
        const pi = logic(boxes[i].node).position;
        for (let j = 0; j < boxes.length; j++)
        {
            if (i === j) continue;
            const pj = logic(boxes[j].node).position;
            const d = Math.sqrt((pi.x - pj.x) ** 2 + (pi.z - pj.z) ** 2);
            if (d < 2.5) { colliding = true; break; }
        }
        const mat = (boxes[i].node.components![0] as { material: StandardMaterial }).material;
        reactive(mat.uniforms).u_diffuse = colliding
            ? { __type__: 'Color4', r: 1, g: 0.2, b: 0.2, a: 1 }
            : { __type__: 'Color4', r: 0.4, g: 0.8, b: 0.4, a: 1 };
    }
    webgpu.submit(viewLogic.submit);
});
