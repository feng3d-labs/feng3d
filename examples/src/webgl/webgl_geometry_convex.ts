import { WebGPU } from '@feng3d/webgpu';
import { Vector3 } from '@feng3d/math';
import { logic, Object3D, reactive, Scene, StandardMaterial, View, PointGeometry, PointMaterial, geometryUtils } from 'feng3d';
import '@feng3d/addons';
import type { ConvexGeometry } from '@feng3d/addons';

/**
 * 移植自 three.js examples/webgl_geometry_convex.html。
 *
 * 原示例：DodecahedronGeometry 的顶点作为输入点集，ConvexGeometry 生成凸包网格（半透明白色），
 * 同时用 Points 显示输入点（蓝色）。AmbientLight + PointLight 光照，旋转动画。
 *
 * feng3d 适配：
 * - ConvexGeometry：库已实现（@feng3d/addons，QuickHull 算法），对应 three.js addons ConvexGeometry。
 * - 输入点集：用 IcosahedronGeometry(detail=2) 顶点替代 DodecahedronGeometry（feng3d 无后者）。
 * - MeshLambertMaterial{transparent,opacity:0.5} → StandardMaterial（无 blend，用 u_diffuse alpha 近似）。
 * - Points（蓝色点）→ PointGeometry + PointMaterial。
 * - AmbientLight → Scene.ambientColor；PointLight 直接用。
 */

const webgpuCanvas = document.getElementById('webgpu') as HTMLCanvasElement;
const webgpu = await new WebGPU().init();

// ---- 从 IcosahedronGeometry 提取顶点作为凸包输入点集 ----
const ico = logic({ __type__: 'IcosahedronGeometry', radius: 10, detail: 2 } as never);
const positions = ico.attributes.a_position.data as unknown as number[];
const hullPoints: Vector3[] = [];
for (let i = 0; i < positions.length; i += 3)
{
    hullPoints.push(new Vector3(positions[i], positions[i + 1], positions[i + 2]));
}

// ---- PointGeometry（蓝色点显示输入点集） ----
const pointData: PointGeometry['points'] = hullPoints.map(p => ({
    position: { x: p.x, y: p.y, z: p.z },
    color: { __type__: 'Color4', r: 0, g: 0.5, b: 1, a: 1 },
}));

let groupRotation: { readonly x: number; readonly y: number; readonly z: number };

const view: View = {
    __type__: 'View',
    canvas: webgpuCanvas,
    root: {
        __type__: 'Object3D',
        name: 'Untitled',
        components: [{
            __type__: 'Scene',
            background: { __type__: 'Color4', r: 1, g: 1, b: 1, a: 1 },
            ambientColor: { __type__: 'Color4', r: 0.4, g: 0.4, b: 0.4, a: 1 },
        }],
        children: [
            // 相机
            {
                __type__: 'Object3D',
                name: 'Main Camera',
                position: { x: 15, y: 20, z: 30 },
                components: [{
                    __type__: 'PerspectiveCamera',
                    fov: 40,
                    aspect: webgpuCanvas.width / webgpuCanvas.height,
                    near: 1,
                    far: 1000,
                }],
            },
            // 点光源（挂在场景中）
            {
                __type__: 'Object3D',
                name: 'PointLight',
                position: { x: 15, y: 20, z: 30 },
                components: [{
                    __type__: 'PointLight',
                    color: { __type__: 'Color3', r: 1, g: 1, b: 1 },
                    intensity: 3,
                    range: 100,
                }],
            },
            // 旋转 group：凸包 mesh + 点云
            {
                __type__: 'Object3D',
                name: 'group',
                rotation: groupRotation = { x: 0, y: 0, z: 0 },
                children: [
                    // 凸包 mesh（半透明白色）
                    {
                        __type__: 'Object3D',
                        name: 'hull',
                        components: [{
                            __type__: 'MeshRenderer',
                            geometry: { __type__: 'ConvexGeometry', points: hullPoints } as ConvexGeometry,
                            material: {
                                __type__: 'StandardMaterial',
                                uniforms: {
                                    u_diffuse: { __type__: 'Color4', r: 1, g: 1, b: 1, a: 0.5 },
                                    u_specular: { __type__: 'Color4', r: 0, g: 0, b: 0, a: 1 },
                                    u_glossiness: 0,
                                    u_reflectivity: 0,
                                },
                            } as StandardMaterial,
                        }],
                    },
                    // 点云（蓝色，显示输入点集）
                    {
                        __type__: 'Object3D',
                        name: 'points',
                        components: [{
                            __type__: 'MeshRenderer',
                            geometry: { __type__: 'PointGeometry', points: pointData } as PointGeometry,
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
        ],
    },
};

const viewLogic = logic(view);

// 鼠标环绕相机
let camAngle = 0;
window.addEventListener('mousemove', (e) =>
{
    camAngle = (e.clientX / window.innerWidth - 0.5) * Math.PI;
});
const cameraObj = view.root!.children![0];

void geometryUtils;

function animate(): void
{
    reactive(groupRotation).y += 0.005;

    const cur = logic(cameraObj).position;
    const r = 37;
    const curAngle = Math.atan2(cur.z, cur.x);
    const newAngle = curAngle + (camAngle - curAngle) * 0.03;
    reactive(cameraObj).position = { x: Math.cos(newAngle) * r, y: 20, z: Math.sin(newAngle) * r };
    logic(cameraObj).lookAt({ x: 0, y: 0, z: 0 } as never);

    webgpu.submit(viewLogic.submit);
    requestAnimationFrame(animate);
}

logic(cameraObj).lookAt({ x: 0, y: 0, z: 0 } as never);
requestAnimationFrame(animate);
