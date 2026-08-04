import { WebGPU } from '@feng3d/webgpu';
import { createTextureFromUrl, logic, Object3D, reactive, Scene, TextureMaterial, View, ticker } from 'feng3d';
import '@feng3d/addons';

/**
 * 200 个旋转四面体（UBO 透明演示）。
 *
 * 对照 three.js：examples/webgl_ubo.html
 *
 * 原示例用 Uniform Buffer Object 演示光照 shader，视觉是 200 个 TetrahedronGeometry
 * 贴 crate.gif 纹理，各自旋转，相机 lookAt 场景中心。UBO 在 feng3d 对用户透明。
 *
 * feng3d 适配：声明式数组展开 200 个 Object3D + TetrahedronGeometry + TextureMaterial。
 */

const webgpuCanvas = document.getElementById('webgpu') as HTMLCanvasElement;
const webgpu = await new WebGPU().init();

const crateTexture = await createTextureFromUrl('/crate.gif');

const COUNT = 200;
const rotStates: { x: number; y: number; z: number }[] = [];
const nodes: Object3D[] = [];

for (let i = 0; i < COUNT; i++)
{
    const rot = {
        x: Math.random() * Math.PI * 2,
        y: Math.random() * Math.PI * 2,
        z: Math.random() * Math.PI * 2,
    };
    rotStates.push(rot);
    nodes.push({
        __type__: 'Object3D',
        name: `tetra_${i}`,
        position: {
            x: (Math.random() - 0.5) * 20,
            y: (Math.random() - 0.5) * 20,
            z: (Math.random() - 0.5) * 20,
        },
        rotation: rot,
        components: [{
            __type__: 'MeshRenderer',
            geometry: { __type__: 'TetrahedronGeometry', radius: 0.5, detail: 0 },
            material: {
                __type__: 'TextureMaterial',
                uniforms: { u_color: { __type__: 'Color4', r: 1, g: 1, b: 1, a: 1 } },
                s_texture: crateTexture as unknown as TextureMaterial['s_texture'],
            },
        }],
    });
}

const view: View = {
    __type__: 'View',
    canvas: webgpuCanvas,
    root: {
        __type__: 'Object3D',
        name: 'Untitled',
        components: [{
            __type__: 'Scene',
            background: { __type__: 'Color4', r: 0, g: 0, b: 0, a: 1 },
            ambientColor: { __type__: 'Color4', r: 1, g: 1, b: 1, a: 1 },
        }],
        children: [
            {
                __type__: 'Object3D', name: 'Main Camera', position: { x: 0, y: 0, z: 25 },
                rotation: { x: 0, y: 0, z: 0 },
                components: [{
                    __type__: 'PerspectiveCamera', fov: 70,
                    aspect: webgpuCanvas.width / webgpuCanvas.height, near: 1, far: 100,
                }],
            },
            ...nodes,
        ],
    },
};

const viewLogic = logic(view);

ticker.onframe(() =>
{
    for (let i = 0; i < rotStates.length; i++)
    {
        const r = rotStates[i];
        reactive(r).x += 0.005 + i * 0.0001;
        reactive(r).y += 0.01;
    }
    webgpu.submit(viewLogic.submit);
});
