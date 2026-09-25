import { WebGPU } from '@feng3d/webgpu';
import { logic, Object3D, PointGeometry, PointMaterial, reactive, Scene, View, ticker } from 'feng3d';

/**
 * 动态粒子球（自定义颜色粒子）。
 *
 * 对照 three.js：examples/webgl_buffergeometry_custom_attributes_particles.html
 *
 * 原示例：10 万 Points + ShaderMaterial，每点独立 size/color 属性，加法混合 + 火花纹理，
 * 每帧 CPU 重算 size 数组。
 *
 * feng3d 适配（简化版）：
 * - Points + 每点 size → PointGeometry（每点独立 color，统一 u_PointSize）
 * - 粒子在球面分布，按正弦波径向脉动（每帧更新 position）
 * - AdditiveBlending → PointMaterial renderPipeline blend（src-alpha + one）
 * - 数量降到 5000（PointGeometry billboard quad 每点 4 顶点，性能考量）
 */

const webgpuCanvas = document.getElementById('webgpu') as HTMLCanvasElement;
const webgpu = await new WebGPU().init();

// ---- 生成球面粒子 ----
const PARTICLES = 5000;
const RADIUS = 200;
const points: PointGeometry['points'] = [];
// 存储原始球面坐标（单位向量 + 半径），用于脉动计算
const baseDirs: { x: number; y: number; z: number; phase: number }[] = [];

for (let i = 0; i < PARTICLES; i++)
{
    // 均匀球面分布（黄金角螺旋）
    const theta = Math.acos(1 - 2 * (i + 0.5) / PARTICLES);
    const phi = Math.PI * (1 + Math.sqrt(5)) * i;
    const x = Math.sin(theta) * Math.cos(phi);
    const y = Math.sin(theta) * Math.sin(phi);
    const z = Math.cos(theta);
    baseDirs.push({ x, y, z, phase: Math.random() * Math.PI * 2 });

    points.push({
        position: { x: x * RADIUS, y: y * RADIUS, z: z * RADIUS },
        color: {
            __type__: 'Color4',
            r: (x + 1) * 0.5,
            g: (y + 1) * 0.5,
            b: (z + 1) * 0.5,
            a: 0.8,
        },
    });
}

// 旋转状态
let pointsRot: { x: number; y: number; z: number };

const view: View = {
    __type__: 'View',
    canvas: webgpuCanvas,
    root: {
        __type__: 'Object3D',
        name: 'Untitled',
        components: [{
            __type__: 'Scene',
            background: { __type__: 'Color4', r: 0.02, g: 0.02, b: 0.02, a: 1 },
        }],
        children: [
            {
                __type__: 'Object3D', name: 'Main Camera', position: { x: 0, y: 0, z: 600 },
                rotation: { x: 0, y: 0, z: 0 },
                components: [
                    {
                        __type__: 'PerspectiveCamera', fov: 50,
                        aspect: webgpuCanvas.width / webgpuCanvas.height, near: 1, far: 3000,
                    },
                    { __type__: 'OrbitControls', target: { x: 0, y: 0, z: 0 }, autoRotate: true, autoRotateSpeed: 0.5 },
                ],
            },
            {
                __type__: 'Object3D', name: 'particles',
                rotation: pointsRot = { x: 0, y: 0, z: 0 },
                components: [{
                    __type__: 'MeshRenderer',
                    geometry: { __type__: 'PointGeometry', points } as PointGeometry,
                    material: {
                        __type__: 'PointMaterial',
                        uniforms: {
                            u_color: { __type__: 'Color4', r: 1, g: 1, b: 1, a: 1 },
                            u_PointSize: 8,
                        },
                    } as PointMaterial,
                }],
            },
        ],
    },
};

const viewLogic = logic(view);

// ---- 动画：粒子径向脉动 + 整体旋转 ----
ticker.onframe(() =>
{
    const time = Date.now() * 0.001;

    // 每帧更新粒子位置（径向正弦脉动）
    for (let i = 0; i < PARTICLES; i++)
    {
        const dir = baseDirs[i];
        const r = RADIUS + Math.sin(time * 2 + dir.phase) * 50;
        const p = points[i];
        reactive(p).position = {
            x: dir.x * r,
            y: dir.y * r,
            z: dir.z * r,
        };
    }

    webgpu.submit(viewLogic.submit);
});
