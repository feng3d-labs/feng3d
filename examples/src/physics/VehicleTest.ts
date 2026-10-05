import { WebGPU } from '@feng3d/webgpu';
import { logic, reactive, ticker } from 'feng3d';
import type { View } from 'feng3d';
import '@feng3d/cannon-plugin';
import type { Vehicle } from '@feng3d/cannon-plugin';

const webgpuCanvas = document.getElementById('webgpu') as HTMLCanvasElement;
const webgpu = await new WebGPU().init(); // 初始化 WebGPU

/**
 * 射线车辆示例（对应 cannon-es 的 `raycast_vehicle.html`）。
 *
 * 一辆四轮车在平地上跑：每 4 秒在「直行 → 右转 → 左转」之间切换，
 * 引擎力与转向角都是**运行时改数据**（经 reactive）作用到车上的。
 *
 * cannon-es 的 `RaycastVehicle` 用**射线**探地面，而不是真的做车轮碰撞——
 * 所以只需要一个底盘刚体 + 若干车轮配置，比用铰链拼一辆车稳得多、也便宜得多。
 *
 * 车轮在这里只有**视觉**（底盘下的四个圆柱），物理侧的车轮是射线虚拟的；
 * 车轮视觉挂在底盘下，因此会跟着底盘一起走。
 */
const WHEELS = [
    { position: { x: -0.9, y: -0.3, z: 1.4 }, steering: true, driving: true },
    { position: { x: 0.9, y: -0.3, z: 1.4 }, steering: true, driving: true },
    { position: { x: -0.9, y: -0.3, z: -1.4 } },
    { position: { x: 0.9, y: -0.3, z: -1.4 } },
];

const vehicle: Vehicle = {
    __type__: 'Vehicle',
    wheels: WHEELS,
    engineForce: 900,
    steering: 0,
};

const wheelMeshes = WHEELS.map((wheel, i) => ({
    __type__: 'Object3D',
    name: 'Wheel-' + (i + 1),
    position: wheel.position,
    // 圆柱默认沿 Y 轴，绕 Z 转 90° 让轮轴朝 X（与 cannon-es 默认的 axleLocal (-1,0,0) 一致）
    rotation: { x: 0, y: 0, z: Math.PI / 2 },
    components: [{
        __type__: 'MeshRenderer',
        geometry: { __type__: 'CylinderGeometry', radiusTop: 0.4, radiusBottom: 0.4, height: 0.25, radialSegments: 16, yUp: true },
        material: {
            __type__: 'ColorMaterial',
            uniforms: { u_diffuseInput: { __type__: 'Color4', r: 0.16, g: 0.17, b: 0.20, a: 1 } },
        },
    }],
}));

const view: View = {
    __type__: 'View',
    canvas: webgpuCanvas,
    root: {
        __type__: 'Object3D',
        name: 'PhysicsVehicle',
        components: [{
            __type__: 'Scene',
            background: { __type__: 'Color4', r: 0.09, g: 0.10, b: 0.13, a: 1 },
        }, {
            __type__: 'PhysicsWorld',
            gravity: { x: 0, y: -9.82, z: 0 },
        }],
        children: [{
            __type__: 'Object3D',
            name: 'Main Camera',
            position: { x: 0, y: 7, z: 16 },
            rotation: { x: -0.28, y: 0, z: 0 },
            components: [{ __type__: 'PerspectiveCamera' }],
        }, {
            __type__: 'Object3D',
            name: 'Ground',
            components: [{
                __type__: 'MeshRenderer',
                geometry: { __type__: 'CubeGeometry' },
                material: {
                    __type__: 'ColorMaterial',
                    uniforms: { u_diffuseInput: { __type__: 'Color4', r: 0.24, g: 0.27, b: 0.32, a: 1 } },
                },
            }, { __type__: 'BoxCollider', width: 200, height: 1, depth: 200 }, { __type__: 'Rigidbody', mass: 0 }],
            scale: { x: 200, y: 1, z: 200 },
        }, {
            // 底盘：车辆组件挂在它上面（它自己有 Rigidbody）
            __type__: 'Object3D',
            name: 'Chassis',
            position: { x: 0, y: 2, z: 0 },
            components: [{
                __type__: 'MeshRenderer',
                geometry: { __type__: 'CubeGeometry' },
                material: {
                    __type__: 'ColorMaterial',
                    uniforms: { u_diffuseInput: { __type__: 'Color4', r: 0.90, g: 0.45, b: 0.30, a: 1 } },
                },
            }, { __type__: 'BoxCollider', width: 1.8, height: 0.6, depth: 4 }, {
                __type__: 'Rigidbody',
                mass: 100,
                // 车别翻：把重心压低（用角阻尼模拟）
                angularDamping: 0.6,
            }, vehicle],
            scale: { x: 1.8, y: 0.6, z: 4 },
            children: wheelMeshes,
        }],
    },
};
const viewLogic = logic(view);

// 每 4 秒切换一次驾驶状态：直行 → 右转 → 左转
let elapsed = 0;
ticker.onframe((interval) =>
{
    elapsed += interval;
    const phase = Math.floor(elapsed / 4000) % 3;
    reactive(vehicle).steering = phase === 1 ? 0.32 : (phase === 2 ? -0.32 : 0);

    webgpu.submit(viewLogic.submit);
});
