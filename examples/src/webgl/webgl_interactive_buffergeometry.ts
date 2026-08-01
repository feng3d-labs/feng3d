import { WebGPU } from '@feng3d/webgpu';
import { CustomGeometry, logic, Object3D, reactive, raycaster, Ray3, Scene, StandardMaterial, View, Camera } from 'feng3d';
import { windowEventProxy } from '@feng3d/shortcut';

/**
 * 移植自 three.js examples/webgl_interactive_buffergeometry.html。
 *
 * 原示例：5000 个随机三角面（非索引 BufferGeometry）分散在立方体内，按位置顶点色着色，
 * MeshPhongMaterial{vertexColors, DoubleSide}。Raycaster 从鼠标射线拾取 mesh，命中时高亮
 * 显示命中的三角面边线。AmbientLight + 两个 DirectionalLight。每帧旋转 mesh。
 *
 * feng3d 适配（简化为点击随机变色）：
 * - 随机三角面几何体：用 CustomGeometry 手动构建 positions/normals/colors/indices（顶点色按
 *   位置着色），结构与原示例一致。
 * - Raycaster 拾取 mesh：feng3d raycaster.pick(ray, objects) + camera.getRay3D(screenX, screenY)，
 *   参考 MousePickTest / webgl_interactive_voxelpainter。
 * - 命中高亮三角面：原示例用独立 line geometry 复制命中面顶点绘制。feng3d 实时改 SegmentGeometry
 *   顶点较繁琐，简化为「点击命中 mesh → 改变 mesh 漫反射色（随机色）」，保留拾取交互核心。
 * - MeshPhongMaterial{vertexColors} → StandardMaterial（顶点色默认开启）。
 * - AmbientLight → Scene.ambientColor；DirectionalLight 直接用（强度对齐 1/π 衰减）。
 * - DoubleSide：feng3d Material 暂无 cullSide 切换，默认背面剔除（背面不拾取）。
 * - setAnimationLoop → requestAnimationFrame。
 */

const webgpuCanvas = document.getElementById('webgpu') as HTMLCanvasElement;
const webgpu = await new WebGPU().init();

let scene: Scene;
let camera: Camera;

// ---- 生成随机三角面几何体（对应原示例 5000 三角面） ----
const TRIANGLES = 5000;
const N = 800, N2 = N / 2; // 三角面在边长 N 的立方体内分散
const D = 120, D2 = D / 2; // 单个三角面大小

function buildTriangleGeometry(): CustomGeometry
{
    const positions: number[] = [];
    const normals: number[] = [];
    const colors: number[] = [];
    const uvs: number[] = [];
    const indices: number[] = [];

    for (let i = 0; i < TRIANGLES; i++)
    {
        // 三角面中心在立方体内随机
        const x = Math.random() * N - N2;
        const y = Math.random() * N - N2;
        const z = Math.random() * N - N2;

        // 三个顶点在中心附近随机（单面尺寸 ~D）
        const ax = x + Math.random() * D - D2, ay = y + Math.random() * D - D2, az = z + Math.random() * D - D2;
        const bx = x + Math.random() * D - D2, by = y + Math.random() * D - D2, bz = z + Math.random() * D - D2;
        const cx = x + Math.random() * D - D2, cy = y + Math.random() * D - D2, cz = z + Math.random() * D - D2;

        // 平面法线：cb = (pC - pB) × (pA - pB)，再归一化（纯算术，避免 Vector3 API 差异）
        const cbx = cx - bx, cby = cy - by, cbz = cz - bz;
        const abx = ax - bx, aby = ay - by, abz = az - bz;
        let nx = cby * abz - cbz * aby;
        let ny = cbz * abx - cbx * abz;
        let nz = cbx * aby - cby * abx;
        const len = Math.sqrt(nx * nx + ny * ny + nz * nz) || 1;
        nx /= len; ny /= len; nz /= len;

        // 顶点色按中心位置着色（与原示例一致：vx=x/n+0.5 ...）
        const vx = x / N + 0.5, vy = y / N + 0.5, vz = z / N + 0.5;

        const base = i * 3;
        positions.push(ax, ay, az, bx, by, bz, cx, cy, cz);
        normals.push(nx, ny, nz, nx, ny, nz, nx, ny, nz);
        colors.push(vx, vy, vz, 1, vx, vy, vz, 1, vx, vy, vz, 1);
        uvs.push(0, 0, 0, 0, 0, 0);
        indices.push(base, base + 1, base + 2);
    }

    const geo: CustomGeometry = { __type__: 'CustomGeometry' };
    const gl = logic(geo);
    gl.positions = positions;
    gl.normals = normals;
    gl.colors = colors;
    gl.uvs = uvs;
    (gl as unknown as { indices: number[] }).indices = indices;

    return geo;
}

const triangleGeometry = buildTriangleGeometry();

let meshRotation: { readonly x: number; readonly y: number; readonly z: number };

// mesh 材质（点击会改变 u_diffuse）
const meshMaterial: StandardMaterial = {
    __type__: 'StandardMaterial',
    uniforms: {
        u_diffuse: { __type__: 'Color4', r: 0.667, g: 0.667, b: 0.667, a: 1 },
        u_specular: { __type__: 'Color4', r: 1, g: 1, b: 1, a: 1 },
        u_glossiness: 0.5,
        // 无环境贴图，置 0 关闭环境反射避免全黑
        u_reflectivity: 0,
    },
};

const view: View = {
    __type__: 'View',
    canvas: webgpuCanvas,
    root: {
        __type__: 'Object3D',
        name: 'Untitled',
        components: [scene = {
            __type__: 'Scene',
            // Scene.background = 0x050505
            background: { __type__: 'Color4', r: 0.02, g: 0.02, b: 0.02, a: 1 },
            // AmbientLight(0x444444, 3) 近似
            ambientColor: { __type__: 'Color4', r: 0.267, g: 0.267, b: 0.267, a: 1 },
        }],
        children: [
            // 相机：PerspectiveCamera(27, aspect, 1, 3500)，position.z=2750
            {
                __type__: 'Object3D',
                name: 'Main Camera',
                position: { x: 0, y: 0, z: 2750 },
                components: [camera = {
                    __type__: 'PerspectiveCamera',
                    fov: 27,
                    aspect: webgpuCanvas.width / webgpuCanvas.height,
                    near: 1,
                    far: 3500,
                }],
            },
            // 三角面 mesh：拾取目标 + 旋转动画（rotation.x=time*0.15, y=time*0.25）
            {
                __type__: 'Object3D',
                name: 'mesh',
                rotation: meshRotation = { x: 0, y: 0, z: 0 },
                mouseEnabled: true,
                components: [{
                    __type__: 'MeshRenderer',
                    geometry: triangleGeometry,
                    material: meshMaterial,
                }],
            },
            // 方向光 1：position(1,1,1)，intensity 1.5
            {
                __type__: 'Object3D',
                name: 'DirLight1',
                position: { x: 1, y: 1, z: 1 },
                components: [{
                    __type__: 'DirectionalLight',
                    color: { __type__: 'Color3', r: 1, g: 1, b: 1 },
                    intensity: 1.5 / Math.PI,
                }],
            },
            // 方向光 2：position(0,-1,0)，intensity 4.5
            {
                __type__: 'Object3D',
                name: 'DirLight2',
                position: { x: 0, y: -1, z: 0 },
                components: [{
                    __type__: 'DirectionalLight',
                    color: { __type__: 'Color3', r: 1, g: 1, b: 1 },
                    intensity: 4.5 / Math.PI,
                }],
            },
        ],
    },
};

const viewLogic = logic(view);
const meshObj = view.root!.children![1];

// ---- 射线拾取（参考 MousePickTest / webgl_interactive_voxelpainter） ----
function getMouseRay(): Ray3 | null
{
    const rect = webgpuCanvas.getBoundingClientRect();
    const sx = windowEventProxy.clientX - rect.left;
    const sy = windowEventProxy.clientY - rect.top;
    const gx = (sx * 2 - rect.width) / rect.width;
    const gy = -(sy * 2 - rect.height) / rect.height;

    return logic(camera).getRay3D(gx, gy);
}

// 点击：拾取 mesh → 随机改变 u_diffuse（简化原示例的命中面高亮）
windowEventProxy.on('mousedown', () =>
{
    const ray = getMouseRay();
    if (!ray) return;
    const hit = raycaster.pick(ray, [meshObj]);
    if (hit && hit.object3D)
    {
        // 随机变色（点击命中 mesh）
        reactive(meshMaterial.uniforms.u_diffuse).r = Math.random();
        reactive(meshMaterial.uniforms.u_diffuse).g = Math.random();
        reactive(meshMaterial.uniforms.u_diffuse).b = Math.random();
    }
});

// ---- animate（对应原示例 setAnimationLoop + 每帧旋转） ----
const startTime = Date.now();

function animate(): void
{
    const time = (Date.now() - startTime) / 1000;
    reactive(meshRotation).x = time * 0.15;
    reactive(meshRotation).y = time * 0.25;

    webgpu.submit(viewLogic.submit);
    requestAnimationFrame(animate);
}

requestAnimationFrame(animate);
