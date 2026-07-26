import { WebGPU } from '@feng3d/webgpu';
import { Vector2, Vector3 } from '@feng3d/math';
import { createTextureFromUrl, logic, reactive, View } from 'feng3d';
// 显式 import @feng3d/addons：触发 ParametricGeometry 等 registerLogic 副作用，
// 同时复用已移植的 klein/mobius 参数曲面函数库（替代文件底部内联实现）。
import { klein, mobius } from '@feng3d/addons';

/**
 * 移植自 three.js examples/webgl_geometries.html。
 *
 * 14 个几何体按 4×4 网格排列，共享一张 uv_grid 纹理 + 双面 StandardMaterial，
 * 相机俯视 + 绕 Y 轴环绕，所有 mesh 每帧自旋。
 *
 * 与 three.js 完全对齐：
 * - 相机 PerspectiveCamera(45, aspect, 1, 2000)，position.y=500，绕原点 800 半径环绕
 * - AmbientLight(0xcccccc, 1.5) → Scene.ambientColor
 * - PointLight(0xffffff, 2.5) 挂在相机上（随相机移动）
 * - uv_grid_opengl.jpg 纹理（repeat wrap）
 * - 所有几何体 doubleSide（cullFace:'none'）
 * - 每帧 rotation.x = timer*5, rotation.y = timer*2.5（弧度）
 */

// 收集所有需要每帧旋转的 Object3D（与 three.js scene.traverse isMesh 等价）
const rotatingMeshes: { rotation: { x: number; y: number; z: number } }[] = [];

const webgpuCanvas = document.getElementById('webgpu') as HTMLCanvasElement;
const webgpu = await new WebGPU().init();

// 共享纹理（uv_grid_opengl.jpg，repeat wrap，对应 three.js map.wrapS/T = RepeatWrapping）
const map = await createTextureFromUrl('/uv_grid_opengl.jpg');

// 共享材质：doubleSide（cullFace:'none'）对应 three.js side: THREE.DoubleSide
const material = {
    __type__: 'StandardMaterial' as const,
    s_diffuse: map,
    cullFace: 'none' as const,
};

/** 工厂：创建一个网格 Object3D，记录到 rotatingMeshes 供每帧旋转 */
function makeMesh(geometry: Record<string, unknown>, x: number, y: number, z: number, scale = 1)
{
    const mesh = {
        __type__: 'Object3D' as const,
        position: { x, y, z },
        scale: { x: scale, y: scale, z: scale },
        rotation: { x: 0, y: 0, z: 0 },
        components: [{
            __type__: 'MeshRenderer' as const,
            geometry,
            material,
        }],
    };
    rotatingMeshes.push(mesh);

    return mesh;
}

// Lathe 轮廓点（对应 three.js 示例的 points）
const lathePoints: Vector2[] = [];
for (let i = 0; i < 50; i++)
{
    lathePoints.push(new Vector2(Math.sin(i * 0.2) * Math.sin(i * 0.1) * 15 + 50, (i - 5) * 2));
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
            // AmbientLight(0xcccccc, 1.5) → 环境光颜色
            ambientColor: { __type__: 'Color4', r: 0.8, g: 0.8, b: 0.8, a: 1 },
        }],
        children: [
            // 相机：PerspectiveCamera(45, aspect, 1, 2000)，position.y=500
            {
                __type__: 'Object3D',
                name: 'Main Camera',
                position: { x: 0, y: 500, z: 0 },
                components: [{
                    __type__: 'PerspectiveCamera',
                    fov: 45,
                    aspect: webgpuCanvas.width / webgpuCanvas.height,
                    near: 1,
                    far: 2000,
                },
                // PointLight(0xffffff, 2.5) 挂在相机上
                {
                    __type__: 'PointLight',
                    color: { __type__: 'Color3', r: 1, g: 1, b: 1 },
                    intensity: 2.5,
                    range: 0,
                }],
            },
            // 第 1 行 (z=+300)：Sphere / Icosahedron / Octahedron / Tetrahedron
            makeMesh({ __type__: 'SphereGeometry', radius: 75, segmentsW: 20, segmentsH: 10, yUp: false }, -300, 0, 300),
            makeMesh({ __type__: 'IcosahedronGeometry', radius: 75 }, -100, 0, 300),
            makeMesh({ __type__: 'OctahedronGeometry', radius: 75 }, 100, 0, 300),
            makeMesh({ __type__: 'TetrahedronGeometry', radius: 75 }, 300, 0, 300),
            // 第 2 行 (z=+100)：Plane / Box / Circle / Ring
            makeMesh({ __type__: 'PlaneGeometry', width: 100, height: 100, segmentsW: 4, segmentsH: 4, yUp: false }, -300, 0, 100),
            makeMesh({ __type__: 'CubeGeometry', width: 100, height: 100, depth: 100, segmentsW: 4, segmentsH: 4, segmentsD: 4 }, -100, 0, 100),
            makeMesh({ __type__: 'CircleGeometry', radius: 50, segments: 20 }, 100, 0, 100),
            makeMesh({ __type__: 'RingGeometry', innerRadius: 10, outerRadius: 50, thetaSegments: 20, phiSegments: 5 }, 300, 0, 100),
            // 第 3 行 (z=-100)：Cylinder / Lathe / Torus / TorusKnot
            makeMesh({ __type__: 'CylinderGeometry', topRadius: 25, bottomRadius: 75, height: 100, segmentsW: 40, segmentsH: 5, yUp: false }, -300, 0, -100),
            makeMesh({ __type__: 'LatheGeometry', segments: 20, __points: lathePoints } as unknown as Record<string, unknown>, -100, 0, -100),
            makeMesh({ __type__: 'TorusGeometry', radius: 50, tubeRadius: 20, segmentsR: 20, segmentsT: 20, yUp: false }, 100, 0, -100),
            makeMesh({ __type__: 'TorusKnotGeometry', radius: 50, tube: 10, tubularSegments: 50, radialSegments: 20 }, 300, 0, -100),
            // 第 4 行 (z=-300)：Capsule / Parametric plane / Parametric klein / Parametric mobius
            makeMesh({ __type__: 'CapsuleGeometry', radius: 20, height: 50, yUp: false }, -300, 0, -300),
            // plane(u,v) = (u,0,v)，scale 100，center
            makeMesh({ __type__: 'ParametricGeometry', slices: 10, stacks: 10, func: (u: number, v: number) => new Vector3(u * 100, 0, v * 100), doubleside: true }, -100, 0, -300),
            // klein，scale 5
            makeMesh({ __type__: 'ParametricGeometry', slices: 20, stacks: 20, func: klein, doubleside: true }, 100, 0, -300, 5),
            // mobius，scale 30
            makeMesh({ __type__: 'ParametricGeometry', slices: 20, stacks: 20, func: mobius, doubleside: true }, 300, 0, -300, 30),
        ],
    },
};

const viewLogic = logic(view);

const cameraEntity = view.root!.children![0];
const sceneOrigin = new Vector3(0, 0, 0);

// 注：相机 aspect 由 ViewLogic 自动同步到画布宽高比，无需手动 resize 监听。

// animate：对应原示例 timer = Date.now()*0.0001；相机绕 Y 轴 800 半径环绕，所有 mesh 自旋
function render(): void
{
    const timer = Date.now() * 0.0001;

    // 相机绕 Y 轴环绕（与 three.js 一致：cos*x, sin*z，y 不变）
    reactive(cameraEntity).position = {
        x: Math.cos(timer) * 800,
        y: 500,
        z: Math.sin(timer) * 800,
    };
    logic(cameraEntity).lookAt(sceneOrigin);

    // 所有 mesh 每帧自旋（弧度，与 three.js 一致）
    for (const mesh of rotatingMeshes)
    {
        reactive(mesh).rotation = { x: timer * 5, y: timer * 2.5, z: 0 };
    }

    webgpu.submit(viewLogic.submit);

    requestAnimationFrame(render);
}
requestAnimationFrame(render);

// klein/mobius 函数已迁出到 @feng3d/addons（文件顶部 import），不再内联实现。

