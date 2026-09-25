import { WebGPU } from '@feng3d/webgpu';
import { logic, Object3D, PointGeometry, PointMaterial, reactive, Scene, View } from 'feng3d';

/**
 * 移植自 three.js examples/webgl_buffergeometry_points.html。
 *
 * 原示例：500000 个粒子点立方体分布（边长 1000），顶点色按位置 (x/n+0.5, ...)，
 * PointsMaterial{size:15, vertexColors:true}，Scene 背景 0x050505 + Fog(0x050505, 2000, 3500)，
 * PerspectiveCamera(27, aspect, 5, 3500) position.z=2750，每帧旋转 points（x +time*0.25, y +time*0.5）。
 *
 * feng3d 适配：
 * - Points + PointsMaterial → PointGeometry（points: PointInfo[] 声明式）+ PointMaterial。
 * - 顶点色：PointInfo.color 按位置着色（与原示例 setRGB 一致）。
 * - 点尺寸：PointsMaterial{size:15} → PointMaterial uniforms.u_PointSize:15。PointGeometry 已把每点
 *   扩展成 billboard 四边形（4 顶点），PointMaterial 顶点着色器按 u_PointSize 在屏幕空间展开
 *   成方形点（透视修正），对齐原示例 size:15 的方形点。
 * - 数量：原示例 500000 点；feng3d PointGeometry 用 computed 逐点生成 attribute，50 万点会卡顿，
 *   这里降到 50000（视觉上仍是密集点云，性能可接受）。性能优化（直接喂 Float32Array 而非 PointInfo[]）
 *   需库层面支持，后续再做。
 * - Fog(0x050505, 2000, 3500)：PointMaterial 独立着色器暂不支持雾，省略（点云远处不会淡入背景）。
 * - setAnimationLoop → requestAnimationFrame。
 */

const webgpuCanvas = document.getElementById('webgpu') as HTMLCanvasElement;
const webgpu = await new WebGPU().init();

// ---- 生成粒子点（对应原示例，数量降到 50000） ----
const PARTICLES = 50000;
const N = 1000, N2 = N / 2; // 立方体分布边长
const points: PointGeometry['points'] = [];
for (let i = 0; i < PARTICLES; i++)
{
    const x = Math.random() * N - N2;
    const y = Math.random() * N - N2;
    const z = Math.random() * N - N2;
    points.push({
        position: { x, y, z },
        color: { __type__: 'Color4', r: x / N + 0.5, g: y / N + 0.5, b: z / N + 0.5, a: 1 },
    });
}

let pointsRotation: { readonly x: number; readonly y: number; readonly z: number };

const view: View = {
    __type__: 'View',
    canvas: webgpuCanvas,
    root: {
        __type__: 'Object3D',
        name: 'Untitled',
        components: [{
            __type__: 'Scene',
            // Scene.background = 0x050505（深灰黑）。原示例还有 Fog(0x050505, 2000, 3500)，
            // PointMaterial 独立着色器不支持雾，此处省略（点云远处不会淡入背景，视觉略密）。
            background: { __type__: 'Color4', r: 0.02, g: 0.02, b: 0.02, a: 1 },
        }],
        children: [
            // 相机：PerspectiveCamera(27, aspect, 5, 3500)，position.z=2750
            {
                __type__: 'Object3D',
                name: 'Main Camera',
                position: { x: 0, y: 0, z: 2750 },
                components: [{
                    __type__: 'PerspectiveCamera',
                    fov: 27,
                    aspect: webgpuCanvas.width / webgpuCanvas.height,
                    near: 5,
                    far: 3500,
                }],
            },
            // 粒子点云：旋转动画（rotation.x = time*0.25, rotation.y = time*0.5）
            {
                __type__: 'Object3D',
                name: 'points',
                rotation: pointsRotation = { x: 0, y: 0, z: 0 },
                components: [{
                    __type__: 'MeshRenderer',
                    geometry: { __type__: 'PointGeometry', points } as PointGeometry,
                    // u_PointSize:15 对应原示例 PointsMaterial{size:15}（屏幕空间像素）
                    material: {
                        __type__: 'PointMaterial',
                        uniforms: {
                            u_color: { __type__: 'Color4', r: 1, g: 1, b: 1, a: 1 },
                            u_PointSize: 15,
                        },
                    } as PointMaterial,
                }],
            },
        ],
    },
};

const viewLogic = logic(view);

// ---- animate（对应原示例 setAnimationLoop + 每帧旋转） ----
const startTime = Date.now();

function animate(): void
{
    const time = (Date.now() - startTime) / 1000;
    reactive(pointsRotation).x = time * 0.25;
    reactive(pointsRotation).y = time * 0.5;

    webgpu.submit(viewLogic.submit);
    requestAnimationFrame(animate);
}

requestAnimationFrame(animate);
