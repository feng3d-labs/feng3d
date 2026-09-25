import { WebGPU } from '@feng3d/webgpu';
import { createTextureFromCanvas, logic, Object3D, reactive, Scene, TextureMaterial, View, ticker } from 'feng3d';

/**
 * 光晕效果（LensFlare，用 billboard 平面模拟）。
 *
 * 对照 three.js：examples/webgl_lensflares.html
 * 原示例用 LensFlare 在 3D 空间放置光晕精灵，feng3d 用 billboard Plane + 径向渐变纹理近似。
 */

const webgpuCanvas = document.getElementById('webgpu') as HTMLCanvasElement;
const webgpu = await new WebGPU().init();

// 程序化光晕纹理
function makeFlareTexture(r: number, g: number, b: number)
{
    const c = document.createElement('canvas');
    c.width = c.height = 128;
    const ctx = c.getContext('2d')!;
    // 中心亮点
    const g1 = ctx.createRadialGradient(64, 64, 0, 64, 64, 20);
    g1.addColorStop(0, `rgba(255,255,255,1)`);
    g1.addColorStop(1, `rgba(${r*255|0},${g*255|0},${b*255|0},0)`);
    ctx.fillStyle = g1;
    ctx.fillRect(0, 0, 128, 128);
    // 外圈光环
    const g2 = ctx.createRadialGradient(64, 64, 20, 64, 64, 60);
    g2.addColorStop(0, `rgba(${r*255|0},${g*255|0},${b*255|0},0)`);
    g2.addColorStop(0.5, `rgba(${r*255|0},${g*255|0},${b*255|0},0.3)`);
    g2.addColorStop(1, `rgba(${r*255|0},${g*255|0},${b*255|0},0)`);
    ctx.fillStyle = g2;
    ctx.fillRect(0, 0, 128, 128);

    return createTextureFromCanvas(c);
}

const tex1 = await makeFlareTexture(1, 0.8, 0.4);
const tex2 = await makeFlareTexture(0.4, 0.6, 1);

// 几个散布的小盒子做背景参照
const bgCubes: Object3D[] = [];
for (let i = 0; i < 20; i++)
{
    bgCubes.push({
        __type__: 'Object3D', name: `bg_${i}`,
        position: { x: (Math.random() - 0.5) * 4000, y: (Math.random() - 0.5) * 4000, z: (Math.random() - 0.5) * 4000 },
        rotation: { x: 0, y: 0, z: 0 },
        components: [{ __type__: 'MeshRenderer', geometry: { __type__: 'CubeGeometry', width: 200, height: 200, depth: 200 },
            material: { __type__: 'TextureMaterial', uniforms: { u_color: { __type__: 'Color4', r: 0.8, g: 0.8, b: 0.8, a: 1 } }, s_texture: tex1 as unknown as TextureMaterial['s_texture'] } }],
    });
}

// 光晕精灵（billboard 平面）
let flare1Rot: { x: number; y: number; z: number };
let flare2Rot: { x: number; y: number; z: number };

const view: View = {
    __type__: 'View', canvas: webgpuCanvas,
    root: {
        __type__: 'Object3D', name: 'Untitled',
        components: [{ __type__: 'Scene', background: { __type__: 'Color4', r: 0.01, g: 0.02, b: 0.04, a: 1 }, ambientColor: { __type__: 'Color4', r: 1, g: 1, b: 1, a: 1 } }],
        children: [
            { __type__: 'Object3D', name: 'Main Camera', position: { x: 0, y: 0, z: 3000 }, rotation: { x: 0, y: 0, z: 0 },
              components: [{ __type__: 'PerspectiveCamera', fov: 40, aspect: webgpuCanvas.width / webgpuCanvas.height, near: 1, far: 15000 }, { __type__: 'OrbitControls', target: { x: 0, y: 0, z: 0 } }] },
            ...bgCubes,
            { __type__: 'Object3D', name: 'flare1', position: { x: -500, y: 500, z: -1000 }, rotation: flare1Rot = { x: 0, y: 0, z: 0 },
              components: [{ __type__: 'MeshRenderer', geometry: { __type__: 'PlaneGeometry', width: 600, height: 600 }, material: { __type__: 'TextureMaterial', uniforms: { u_color: { __type__: 'Color4', r: 1, g: 1, b: 1, a: 1 } }, s_texture: tex1 as unknown as TextureMaterial['s_texture'] } }] },
            { __type__: 'Object3D', name: 'flare2', position: { x: 800, y: -200, z: -1500 }, rotation: flare2Rot = { x: 0, y: 0, z: 0 },
              components: [{ __type__: 'MeshRenderer', geometry: { __type__: 'PlaneGeometry', width: 400, height: 400 }, material: { __type__: 'TextureMaterial', uniforms: { u_color: { __type__: 'Color4', r: 1, g: 1, b: 1, a: 1 } }, s_texture: tex2 as unknown as TextureMaterial['s_texture'] } }] },
        ],
    },
};

const viewLogic = logic(view);
const camNode = view.root!.children![0];
const flare1Node = view.root!.children!.find(c => c.name === 'flare1')!;
const flare2Node = view.root!.children!.find(c => c.name === 'flare2')!;

ticker.onframe(() =>
{
    // billboard：光晕朝向相机
    for (const fn of [flare1Node, flare2Node])
    {
        const cp = logic(camNode).position;
        const fp = logic(fn).position;
        const yaw = Math.atan2(cp.x - fp.x, cp.z - fp.z);
        const pitch = Math.atan2(cp.y - fp.y, Math.sqrt((cp.x - fp.x) ** 2 + (cp.z - fp.z) ** 2));
        reactive(fn.rotation as { x: number; y: number; z: number }).x = pitch;
        reactive(fn.rotation as { x: number; y: number; z: number }).y = yaw;
    }
    webgpu.submit(viewLogic.submit);
});
