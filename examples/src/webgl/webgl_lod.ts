import { WebGPU } from '@feng3d/webgpu';
import { logic, Object3D, reactive, Scene, StandardMaterial, View, ticker } from 'feng3d';

/**
 * 手动 LOD（Level of Detail）切换。
 *
 * 对照 three.js：examples/webgl_lod.html
 * 原示例用 THREE.LOD 按 distance 自动切换几何体细节。
 * feng3d 无 LOD 组件，手动根据相机距离切换 segmentsW/H。
 */

const webgpuCanvas = document.getElementById('webgpu') as HTMLCanvasElement;
const webgpu = await new WebGPU().init();

// 多个球体，每个根据到相机的距离动态切换细节
interface LodSphere { node: Object3D; baseX: number; baseZ: number; }
const spheres: LodSphere[] = [];
for (let i = 0; i < 20; i++)
{
    const angle = (i / 20) * Math.PI * 2;
    const x = Math.cos(angle) * 500;
    const z = Math.sin(angle) * 500;
    const hue = i / 20;
    const node: Object3D = {
        __type__: 'Object3D', name: `lod_${i}`,
        position: { x, y: 0, z }, rotation: { x: 0, y: 0, z: 0 },
        components: [{
            __type__: 'MeshRenderer',
            geometry: { __type__: 'SphereGeometry', radius: 100, segmentsW: 4, segmentsH: 2 },
            material: {
                __type__: 'StandardMaterial',
                uniforms: {
                    u_diffuse: { __type__: 'Color4', r: Math.sin(hue * 6.28) * 0.3 + 0.5, g: Math.sin(hue * 6.28 + 2.1) * 0.3 + 0.5, b: Math.sin(hue * 6.28 + 4.2) * 0.3 + 0.5, a: 1 },
                    u_specular: { __type__: 'Color4', r: 0.3, g: 0.3, b: 0.3, a: 1 },
                    u_glossiness: 20, u_reflectivity: 0,
                },
            },
        }],
    };
    spheres.push({ node, baseX: x, baseZ: z });
}

let groupRot: { x: number; y: number; z: number };
const view: View = {
    __type__: 'View', canvas: webgpuCanvas,
    root: {
        __type__: 'Object3D', name: 'Untitled',
        components: [{ __type__: 'Scene', background: { __type__: 'Color4', r: 0, g: 0, b: 0, a: 1 }, ambientColor: { __type__: 'Color4', r: 0.4, g: 0.4, b: 0.4, a: 1 } }],
        children: [
            { __type__: 'Object3D', name: 'Main Camera', position: { x: 0, y: 300, z: 800 }, rotation: { x: 0, y: 0, z: 0 },
              components: [{ __type__: 'PerspectiveCamera', fov: 45, aspect: webgpuCanvas.width / webgpuCanvas.height, near: 1, far: 15000 }, { __type__: 'OrbitControls', target: { x: 0, y: 0, z: 0 } }] },
            { __type__: 'Object3D', name: 'dirLight', position: { x: 1, y: 1, z: 1 }, components: [{ __type__: 'DirectionalLight', color: { __type__: 'Color3', r: 1, g: 1, b: 1 }, intensity: 1 }] },
            { __type__: 'Object3D', name: 'group', rotation: groupRot = { x: 0, y: 0, z: 0 }, children: spheres.map(s => s.node) },
        ],
    },
};

const viewLogic = logic(view);
const camNode = view.root!.children![0];

ticker.onframe(() =>
{
    reactive(groupRot).y += 0.001;
    // 手动 LOD：根据相机距离切换球体细分
    const camPos = logic(camNode).position;
    for (const s of spheres)
    {
        const sp = logic(s.node).position;
        const dist = Math.sqrt((sp.x - camPos.x) ** 2 + (sp.z - camPos.z) ** 2);
        // 近(0-500): 高细分，中(500-1000): 中，远(>1000): 低
        let segW: number, segH: number;
        if (dist < 500) { segW = 32; segH = 16; }
        else if (dist < 1000) { segW = 12; segH = 6; }
        else { segW = 4; segH = 2; }
        const geo = (s.node.components![0] as { geometry: { segmentsW: number; segmentsH: number; radius: number } }).geometry;
        if (geo.segmentsW !== segW)
        {
            reactive(geo).segmentsW = segW;
            reactive(geo).segmentsH = segH;
        }
    }
    webgpu.submit(viewLogic.submit);
});
