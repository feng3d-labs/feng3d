import { WebGPU } from '@feng3d/webgpu';
import { CustomGeometry, logic, Object3D, reactive, Scene, StandardMaterial, View } from 'feng3d';

/**
 * 移植自 three.js examples/webgl_buffergeometry.html。
 *
 * 原示例：160000 个随机三角面散布在立方体内，每个三角面有 flat face normal
 * 和按位置着色的顶点色 + 随机半透明 alpha。MeshPhongMaterial{DoubleSide, transparent}
 * + AmbientLight + 2 方向光。深色背景 + Fog。鼠标跟随视差。
 *
 * feng3d 适配：
 * - BufferGeometry(非索引) → CustomGeometry（positions/normals/colors 无 indices）
 * - MeshPhong{specular 白, shininess 250, DoubleSide, transparent} → StandardMaterial
 *   （u_specular 白, u_glossiness 250, u_reflectivity 0；cullFace none = DoubleSide）
 * - AmbientLight(0xcccccc) → Scene.ambientColor(0.8)
 * - 2 方向光(intensity 1.5+4.5) → 2 DirectionalLight
 * - Fog → 省略（feng3d 暂无雾支持）
 */

const webgpuCanvas = document.getElementById('webgpu') as HTMLCanvasElement;
const webgpu = await new WebGPU().init();

// ---- 生成 160000 个随机三角面（非索引，每三角面 3 独立顶点） ----
const TRIANGLES = 160000;
const positions: number[] = [];
const normals: number[] = [];
const colors: number[] = [];
const uvs: number[] = [];

const n = 800; const n2 = n / 2;  // 三角面散布范围
const d = 12; const d2 = d / 2;   // 单个三角面大小

for (let i = 0; i < TRIANGLES; i++)
{
    // 三角面中心
    const x = Math.random() * n - n2;
    const y = Math.random() * n - n2;
    const z = Math.random() * n - n2;

    // 3 个顶点（围绕中心随机偏移）
    const ax = x + Math.random() * d - d2;
    const ay = y + Math.random() * d - d2;
    const az = z + Math.random() * d - d2;
    const bx = x + Math.random() * d - d2;
    const by = y + Math.random() * d - d2;
    const bz = z + Math.random() * d - d2;
    const cx = x + Math.random() * d - d2;
    const cy = y + Math.random() * d - d2;
    const cz = z + Math.random() * d - d2;

    positions.push(ax, ay, az, bx, by, bz, cx, cy, cz);

    // flat face normal（cb × ab）
    const cbx = cx - bx, cby = cy - by, cbz = cz - bz;
    const abx = ax - bx, aby = ay - by, abz = az - bz;
    let nx = cby * abz - cbz * aby;
    let ny = cbz * abx - cbx * abz;
    let nz = cbx * aby - cby * abx;
    const len = Math.sqrt(nx * nx + ny * ny + nz * nz) || 1;
    nx /= len; ny /= len; nz /= len;

    normals.push(nx, ny, nz, nx, ny, nz, nx, ny, nz);

    // 顶点色：按三角面中心位置归一化 RGB + 随机 alpha
    const vx = (x / n) + 0.5;
    const vy = (y / n) + 0.5;
    const vz = (z / n) + 0.5;
    const alpha = Math.random();

    colors.push(vx, vy, vz, alpha, vx, vy, vz, alpha, vx, vy, vz, alpha);
    uvs.push(0, 0, 0, 0, 0, 0); // 占位
}

const geo: CustomGeometry = { __type__: 'CustomGeometry' };
// 顶点数据通过响应式数据接口写入（logic 字段只读）
const r = reactive(geo);
r.positions = positions;
r.normals = normals;
r.colors = colors;
r.uvs = uvs;
// 非索引几何体（不设 indices → DrawVertex 模式）

let meshRot: { readonly x: number; readonly y: number; readonly z: number };

const view: View = {
    __type__: 'View',
    canvas: webgpuCanvas,
    root: {
        __type__: 'Object3D',
        name: 'Untitled',
        components: [{
            __type__: 'Scene',
            // Scene.background = 0x050505
            background: { __type__: 'Color4', r: 0.02, g: 0.02, b: 0.02, a: 1 },
            // AmbientLight(0xcccccc) → ambientColor(0.8)
            ambientColor: { __type__: 'Color4', r: 0.8, g: 0.8, b: 0.8, a: 1 },
        }],
        children: [
            {
                __type__: 'Object3D',
                name: 'Main Camera',
                position: { x: 0, y: 0, z: 2750 },
                rotation: { x: 0, y: 0, z: 0 },
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
                    // DoubleSide：cullFace 为材质数据字段（'none' 双面）
                    material: {
                        __type__: 'StandardMaterial',
                        cullFace: 'none',
                        uniforms: {
                            // color: 0xd5d5d5（淡灰，和顶点色相乘）
                            u_diffuse: { __type__: 'Color4', r: 0.835, g: 0.835, b: 0.835, a: 1 },
                            // specular: 0xffffff, shininess: 250
                            u_specular: { __type__: 'Color4', r: 1, g: 1, b: 1, a: 1 },
                            u_glossiness: 250,
                            u_reflectivity: 0,
                            // Fog(0x050505, 2000, 3500)：线性雾，near=2000, far=3500
                            u_fogColor: { __type__: 'Color4', r: 0.02, g: 0.02, b: 0.02, a: 1 },
                            u_fogMinDistance: 1500,
                            u_fogMaxDistance: 3000,
                            u_fogDensity: 0.001,
                            u_fogMode: 3, // FogMode.LINEAR
                        },
                    } as StandardMaterial,
                }],
            },
            // 方向光 1: (1,1,1) intensity=1.5
            {
                __type__: 'Object3D', name: 'light1', position: { x: 1, y: 1, z: 1 },
                components: [{ __type__: 'DirectionalLight', color: { __type__: 'Color3', r: 1, g: 1, b: 1 }, intensity: 1.5 }],
            },
            // 方向光 2: (0,-1,0) intensity=4.5
            {
                __type__: 'Object3D', name: 'light2', position: { x: 0, y: -1, z: 0 },
                components: [{ __type__: 'DirectionalLight', color: { __type__: 'Color3', r: 1, g: 1, b: 1 }, intensity: 4.5 }],
            },
        ],
    },
};

const viewLogic = logic(view);

// ---- 鼠标跟随相机视差（对应 three.js onDocumentMouseMove） ----
const cameraObj = view.root!.children![0];
let targetX = 0; let targetY = 0;

window.addEventListener('mousemove', (event) =>
{
    targetX = event.clientX - window.innerWidth / 2;
    targetY = event.clientY - window.innerHeight / 2;
});

function animate(): void
{
    // 鼠标跟随缓动（three.js: camera.position.x += (mouseX - camera.position.x) * 0.05）
    const curPos = logic(cameraObj).position;
    const newX = curPos.x + (targetX - curPos.x) * 0.05;
    const newY = curPos.y + (-targetY - curPos.y) * 0.05;
    reactive(cameraObj).position = { x: newX, y: newY, z: 2750 };

    webgpu.submit(viewLogic.submit);
    requestAnimationFrame(animate);
}

requestAnimationFrame(animate);
