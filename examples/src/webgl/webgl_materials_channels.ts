import { WebGPU } from '@feng3d/webgpu';
import { logic, Object3D, reactive, Scene, StandardMaterial, NormalMaterial, View, ticker } from 'feng3d';

/** 多材质通道切换（Standard/Normal 近似）。对照 three.js webgl_materials_channels.html */

const webgpuCanvas = document.getElementById('webgpu') as HTMLCanvasElement;
const webgpu = await new WebGPU().init();

// 球体 + 可切换材质
const sphereNode: Object3D = {
    __type__: 'Object3D', name: 'sphere', rotation: { x: 0, y: 0, z: 0 },
    components: [{
        __type__: 'MeshRenderer',
        geometry: { __type__: 'SphereGeometry', radius: 1.5, segmentsW: 64, segmentsH: 32 },
        material: {
            __type__: 'StandardMaterial',
            uniforms: { u_diffuse: { __type__: 'Color4', r: 0.8, g: 0.6, b: 0.3, a: 1 }, u_specular: { __type__: 'Color4', r: 0.5, g: 0.5, b: 0.5, a: 1 }, u_glossiness: 50, u_reflectivity: 0 },
        },
    }],
};

const view: View = {
    __type__: 'View', canvas: webgpuCanvas,
    root: {
        __type__: 'Object3D', name: 'Untitled',
        components: [{ __type__: 'Scene', background: { __type__: 'Color4', r: 0.15, g: 0.15, b: 0.15, a: 1 }, ambientColor: { __type__: 'Color4', r: 0.5, g: 0.5, b: 0.5, a: 1 } }],
        children: [
            { __type__: 'Object3D', name: 'cam', position: { x: 0, y: 0, z: 5 }, rotation: { x: 0, y: 0, z: 0 },
              components: [{ __type__: 'PerspectiveCamera', fov: 45, aspect: webgpuCanvas.width / webgpuCanvas.height, near: 0.1, far: 100 }, { __type__: 'OrbitControls', target: { x: 0, y: 0, z: 0 } }] },
            { __type__: 'Object3D', name: 'light', position: { x: 1, y: 1, z: 1 }, components: [{ __type__: 'DirectionalLight', color: { __type__: 'Color3', r: 1, g: 1, b: 1 }, intensity: 1 }] },
            sphereNode,
        ],
    },
};
const viewLogic = logic(view);

// 按钮切换材质类型
const infoEl = document.getElementById('info');
let matIdx = 0;
const matNames = ['Standard（光照）', 'Normal（法线色）'];
function setMaterial()
{
    const renderer = sphereNode.components![0] as { material: unknown };
    if (matIdx === 0)
    {
        renderer.material = { __type__: 'StandardMaterial', uniforms: { u_diffuse: { __type__: 'Color4', r: 0.8, g: 0.6, b: 0.3, a: 1 }, u_specular: { __type__: 'Color4', r: 0.5, g: 0.5, b: 0.5, a: 1 }, u_glossiness: 50, u_reflectivity: 0 } } as StandardMaterial;
    }
    else
    {
        renderer.material = { __type__: 'NormalMaterial' } as NormalMaterial;
    }
    if (infoEl) infoEl.textContent = `材质通道: ${matNames[matIdx]}（点击切换）| OrbitControls`;
}
setMaterial();

const btn = document.getElementById('info');
btn?.addEventListener('click', () => { matIdx = (matIdx + 1) % matNames.length; setMaterial(); });

const startTime = Date.now();
ticker.onframe(() =>
{
    const t = (Date.now() - startTime) * 0.001;
    reactive(sphereNode.rotation as { x: number; y: number; z: number }).y = t * 0.3;
    webgpu.submit(viewLogic.submit);
});
