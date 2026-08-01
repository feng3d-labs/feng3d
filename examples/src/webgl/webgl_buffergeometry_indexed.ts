import { WebGPU } from '@feng3d/webgpu';
import { CustomGeometry, logic, Object3D, reactive, Scene, StandardMaterial, View } from 'feng3d';

/**
 * 移植自 three.js examples/webgl_buffergeometry_indexed.html。
 *
 * 原示例：生成一个 10×10 分段的索引网格平面（BufferGeometry + indices + vertexColors），
 * 顶点色按 XY 位置渐变（R=x/size+0.5, G=y/size+0.5, B=1）。HemisphereLight 光照。
 *
 * feng3d 适配：
 * - BufferGeometry + indices + vertexColors → CustomGeometry（positions/normals/colors/uvs/indices）。
 * - HemisphereLight → Scene.ambientColor（白色环境光）。
 * - MeshPhongMaterial{vertexColors,side:DoubleSide,shininess:0} → StandardMaterial。
 * - setAnimationLoop → requestAnimationFrame。
 */

const webgpuCanvas = document.getElementById('webgpu') as HTMLCanvasElement;
const webgpu = await new WebGPU().init();

// ---- 生成索引网格平面（对应原示例 indices + vertices + normals + colors） ----
const SIZE = 20;
const SEGMENTS = 10;
const halfSize = SIZE / 2;
const segSize = SIZE / SEGMENTS;

const positions: number[] = [];
const normals: number[] = [];
const colors: number[] = [];
const uvs: number[] = [];

for (let i = 0; i <= SEGMENTS; i++)
{
    const y = i * segSize - halfSize;
    for (let j = 0; j <= SEGMENTS; j++)
    {
        const x = j * segSize - halfSize;
        positions.push(x, -y, 0);
        normals.push(0, 0, 1);
        const r = x / SIZE + 0.5;
        const g = y / SIZE + 0.5;
        colors.push(r, g, 1, 1);
        uvs.push(j / SEGMENTS, i / SEGMENTS);
    }
}

const indices: number[] = [];
for (let i = 0; i < SEGMENTS; i++)
{
    for (let j = 0; j < SEGMENTS; j++)
    {
        const a = i * (SEGMENTS + 1) + (j + 1);
        const b = i * (SEGMENTS + 1) + j;
        const c = (i + 1) * (SEGMENTS + 1) + j;
        const d = (i + 1) * (SEGMENTS + 1) + (j + 1);
        indices.push(a, b, d, b, c, d);
    }
}

const geo: CustomGeometry = { __type__: 'CustomGeometry' };
const gl = logic(geo);
gl.positions = positions;
gl.normals = normals;
gl.colors = colors;
gl.uvs = uvs;
(gl as unknown as { indices: number[] }).indices = indices;

let meshRotation: { readonly x: number; readonly y: number; readonly z: number };

const view: View = {
    __type__: 'View',
    canvas: webgpuCanvas,
    root: {
        __type__: 'Object3D',
        name: 'Untitled',
        components: [{
            __type__: 'Scene',
            background: { __type__: 'Color4', r: 0.02, g: 0.02, b: 0.02, a: 1 },
            // HemisphereLight 近似
            ambientColor: { __type__: 'Color4', r: 1, g: 1, b: 1, a: 1 },
        }],
        children: [
            // 相机
            {
                __type__: 'Object3D',
                name: 'Main Camera',
                position: { x: 0, y: 0, z: 64 },
                components: [{
                    __type__: 'PerspectiveCamera',
                    fov: 27,
                    aspect: webgpuCanvas.width / webgpuCanvas.height,
                    near: 1,
                    far: 3500,
                }],
            },
            // 索引网格平面
            {
                __type__: 'Object3D',
                name: 'mesh',
                rotation: meshRotation = { x: 0, y: 0, z: 0 },
                components: [{
                    __type__: 'MeshRenderer',
                    geometry: geo,
                    material: {
                        __type__: 'StandardMaterial',
                        uniforms: {
                            u_diffuse: { __type__: 'Color4', r: 1, g: 1, b: 1, a: 1 },
                            u_specular: { __type__: 'Color4', r: 0, g: 0, b: 0, a: 1 },
                            u_glossiness: 0,
                            u_reflectivity: 0,
                        },
                    } as StandardMaterial,
                }],
            },
        ],
    },
};

const viewLogic = logic(view);
const meshObj = view.root!.children![1];

// 鼠标控制旋转
let targetRX = 0, targetRY = 0;
window.addEventListener('mousemove', (e) =>
{
    targetRX = (e.clientY / window.innerHeight - 0.5) * Math.PI;
    targetRY = (e.clientX / window.innerWidth - 0.5) * Math.PI * 0.5;
});

function animate(): void
{
    const cur = logic(meshObj).rotation;
    const nx = cur.x + (targetRX - cur.x) * 0.05;
    const ny = cur.y + (targetRY - cur.y) * 0.05;
    reactive(meshObj).rotation = { x: nx, y: ny, z: 0 };

    webgpu.submit(viewLogic.submit);
    requestAnimationFrame(animate);
}

requestAnimationFrame(animate);
