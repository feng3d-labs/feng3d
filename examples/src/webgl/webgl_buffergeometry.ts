import { WebGPU } from '@feng3d/webgpu';
import { CustomGeometry, logic, Object3D, reactive, Scene, StandardMaterial, View } from 'feng3d';

/**
 * 移植自 three.js examples/webgl_buffergeometry.html。
 *
 * 原示例：生成一个高细分 BufferGeometry 网格平面（三角带 + 顶点色 + Fog），
 * 每帧自旋。展示 BufferGeometry 基础用法。
 *
 * feng3d 适配：BufferGeometry → CustomGeometry；MeshPhongMaterial → StandardMaterial。
 */

const webgpuCanvas = document.getElementById('webgpu') as HTMLCanvasElement;
const webgpu = await new WebGPU().init();

// 生成 200×200 细分的彩色网格平面
const SX = 200, SY = 200;
const SIZE = 80;
const positions: number[] = [];
const colors: number[] = [];
const uvs: number[] = [];
const normals: number[] = [];
const indices: number[] = [];

for (let iy = 0; iy <= SY; iy++)
{
    for (let ix = 0; ix <= SX; ix++)
    {
        const x = (ix / SX - 0.5) * SIZE;
        const y = (iy / SY - 0.5) * SIZE;
        positions.push(x, y, 0);
        normals.push(0, 0, 1);
        uvs.push(ix / SX, iy / SY);
        // 顶点色：按位置渐变
        colors.push(x / SIZE + 0.5, y / SIZE + 0.5, (x + y) / (SIZE * 2) + 0.5, 1);
    }
}
for (let iy = 0; iy < SY; iy++)
{
    for (let ix = 0; ix < SX; ix++)
    {
        const a = iy * (SX + 1) + ix;
        const b = a + SX + 1;
        indices.push(a, b, a + 1, b, b + 1, a + 1);
    }
}

const geo: CustomGeometry = { __type__: 'CustomGeometry' };
const gl = logic(geo);
gl.positions = positions;
gl.normals = normals;
gl.colors = colors;
gl.uvs = uvs;
(gl as unknown as { indices: number[] }).indices = indices;

let meshRot: { readonly x: number; readonly y: number; readonly z: number };

const view: View = {
    __type__: 'View',
    canvas: webgpuCanvas,
    root: {
        __type__: 'Object3D',
        name: 'Untitled',
        components: [{
            __type__: 'Scene',
            background: { __type__: 'Color4', r: 0, g: 0, b: 0, a: 1 },
            ambientColor: { __type__: 'Color4', r: 0.6, g: 0.6, b: 0.6, a: 1 },
        }],
        children: [
            {
                __type__: 'Object3D',
                name: 'Main Camera',
                position: { x: 0, y: 0, z: 2750 },
                components: [{
                    __type__: 'PerspectiveCamera',
                    fov: 27,
                    aspect: webgpuCanvas.width / webgpuCanvas.height,
                    near: 1, far: 3500,
                }],
            },
            {
                __type__: 'Object3D',
                name: 'mesh',
                rotation: meshRot = { x: 0, y: 0, z: 0 },
                components: [{
                    __type__: 'MeshRenderer',
                    geometry: geo,
                    material: {
                        __type__: 'StandardMaterial',
                        uniforms: {
                            u_diffuse: { __type__: 'Color4', r: 1, g: 1, b: 1, a: 1 },
                            u_specular: { __type__: 'Color4', r: 0, g: 0, b: 0, a: 1 },
                            u_glossiness: 0, u_reflectivity: 0,
                        },
                    } as StandardMaterial,
                }],
            },
            {
                __type__: 'Object3D',
                name: 'dirLight',
                position: { x: 1, y: 1, z: 1 },
                components: [{
                    __type__: 'DirectionalLight',
                    color: { __type__: 'Color3', r: 1, g: 1, b: 1 },
                    intensity: 3,
                }],
            },
        ],
    },
};

const viewLogic = logic(view);

function animate(): void
{
    const t = Date.now() * 0.001;
    reactive(meshRot).x = t * 0.2;
    reactive(meshRot).y = t * 0.4;

    webgpu.submit(viewLogic.submit);
    requestAnimationFrame(animate);
}

requestAnimationFrame(animate);
