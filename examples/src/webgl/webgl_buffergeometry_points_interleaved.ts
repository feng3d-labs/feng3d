import { WebGPU } from '@feng3d/webgpu';
import { logic, Object3D, reactive, Scene, PointGeometry, PointMaterial, View } from 'feng3d';

/**
 * 移植自 three.js examples/webgl_buffergeometry_points_interleaved.html。
 *
 * 原示例：50000 个粒子点用 InterleavedBuffer（交错缓冲区：position+color 连续存储），
 * 按位置着色，旋转动画。Fog 雾效。
 *
 * feng3d 适配：
 * - InterleavedBuffer → PointGeometry（points: PointInfo[]，position+color 分别存储）。
 *   feng3d 暂不支持交错缓冲区，用分离的 PointInfo 替代（功能等价）。
 * - PointsMaterial{size} → PointMaterial{u_PointSize}（库已实现可变点尺寸）。
 * - Fog：PointMaterial 独立着色器不支持雾，省略。
 */

const webgpuCanvas = document.getElementById('webgpu') as HTMLCanvasElement;
const webgpu = await new WebGPU().init();

const PARTICLES = 50000;
const points: PointGeometry['points'] = [];
const N = 1000, N2 = N / 2;
for (let i = 0; i < PARTICLES; i++)
{
    const x = Math.random() * N - N2;
    const y = Math.random() * N - N2;
    const z = Math.random() * N - N2;
    points.push({
        position: { x, y, z },
        color: {
            __type__: 'Color4',
            r: x / N + 0.5,
            g: y / N + 0.5,
            b: z / N + 0.5,
            a: 1,
        },
    });
}

let pointsRot: { readonly x: number; readonly y: number; readonly z: number };

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
            {
                __type__: 'Object3D',
                name: 'points',
                rotation: pointsRot = { x: 0, y: 0, z: 0 },
                components: [{
                    __type__: 'MeshRenderer',
                    geometry: { __type__: 'PointGeometry', points } as PointGeometry,
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

function animate(): void
{
    const t = Date.now() * 0.001;
    reactive(pointsRot).x = t * 0.25;
    reactive(pointsRot).y = t * 0.5;

    webgpu.submit(viewLogic.submit);
    requestAnimationFrame(animate);
}

requestAnimationFrame(animate);
