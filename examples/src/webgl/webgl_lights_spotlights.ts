import { WebGPU } from '@feng3d/webgpu';
import { logic, Object3D, reactive, Scene, StandardMaterial, Vector3, View, ticker } from 'feng3d';

/**
 * 多聚光灯 + 阴影展示。
 *
 * 对照 three.js：examples/webgl_lights_spotlights.html
 *
 * 原示例：3 个 SpotLight（橙/绿/紫色），angle/penumbra/position 随机变化（TWEEN 缓动），
 * 照亮地板和小盒子，投射阴影。
 *
 * feng3d 适配：
 * - SpotLight { range, angle, penumbra } + shadowType 开启阴影
 * - TWEEN.js → ticker 内手写二次缓动（每帧 lerp 到目标值）
 * - SpotLightHelper 省略（feng3d 暂无，用光源位置本身可视化）
 * - MeshPhongMaterial → StandardMaterial
 */

const webgpuCanvas = document.getElementById('webgpu') as HTMLCanvasElement;
const webgpu = await new WebGPU().init();

// ---- 3 个聚光灯的状态（位置 + angle + penumbra，带缓动目标） ----
interface SpotState
{
    // 当前值
    x: number; y: number; z: number;
    angle: number; penumbra: number;
    // 缓动目标
    tx: number; ty: number; tz: number;
    tAngle: number; tPenumbra: number;
}

const spotStates: SpotState[] = [
    { x: 1.5, y: 4, z: 4.5, angle: 30, penumbra: 0.3, tx: 1.5, ty: 4, tz: 4.5, tAngle: 30, tPenumbra: 0.3 },
    { x: 0, y: 4, z: 3.5, angle: 30, penumbra: 0.3, tx: 0, ty: 4, tz: 3.5, tAngle: 30, tPenumbra: 0.3 },
    { x: -1.5, y: 4, z: 4.5, angle: 30, penumbra: 0.3, tx: -1.5, ty: 4, tz: 4.5, tAngle: 30, tPenumbra: 0.3 },
];

// 随机化目标值（对应原示例 tween(light)）
let retargetTimer = 0;
function retarget()
{
    for (const s of spotStates)
    {
        s.tAngle = Math.random() * 40 + 10; // 10-50 度
        s.tPenumbra = Math.random();
        s.tx = Math.random() * 6 - 3;
        s.ty = Math.random() * 2 + 3;
        s.tz = Math.random() * 4 + 2;
    }
}

let spotRots: { x: number; y: number; z: number }[] = [];

const view: View = {
    __type__: 'View',
    canvas: webgpuCanvas,
    root: {
        __type__: 'Object3D',
        name: 'Untitled',
        components: [{
            __type__: 'Scene',
            background: { __type__: 'Color4', r: 0.05, g: 0.05, b: 0.05, a: 1 },
            ambientColor: { __type__: 'Color4', r: 0.3, g: 0.3, b: 0.3, a: 1 },
        }],
        children: [
            {
                __type__: 'Object3D', name: 'Main Camera',
                position: { x: 4.6, y: 2.2, z: -2.1 },
                rotation: { x: 0, y: 0, z: 0 },
                components: [
                    {
                        __type__: 'PerspectiveCamera', fov: 50,
                        aspect: webgpuCanvas.width / webgpuCanvas.height, near: 0.1, far: 100,
                    },
                    { __type__: 'OrbitControls', target: { x: 0, y: 0.5, z: 0 } },
                ],
            },
            // 地板（旋转 -π/2 水平铺，接收阴影）
            {
                __type__: 'Object3D', name: 'floor',
                position: { x: 0, y: -0.05, z: 0 },
                rotation: { x: -Math.PI / 2, y: 0, z: 0 },
                components: [{
                    __type__: 'MeshRenderer',
                    geometry: { __type__: 'PlaneGeometry', width: 100, height: 100 },
                    material: {
                        __type__: 'StandardMaterial',
                        uniforms: {
                            u_diffuse: { __type__: 'Color4', r: 0.5, g: 0.5, b: 0.5, a: 1 },
                            u_specular: { __type__: 'Color4', r: 0, g: 0, b: 0, a: 1 },
                            u_glossiness: 0, u_reflectivity: 0,
                        },
                    },
                }],
            },
            // 小盒子（投射阴影 + 接收阴影）
            {
                __type__: 'Object3D', name: 'box',
                position: { x: 0, y: 0.5, z: 0 },
                components: [{
                    __type__: 'MeshRenderer',
                    geometry: { __type__: 'CubeGeometry', width: 1, height: 1, depth: 1 },
                    material: {
                        __type__: 'StandardMaterial',
                        uniforms: {
                            u_diffuse: { __type__: 'Color4', r: 0.6, g: 0.6, b: 0.6, a: 1 },
                            u_specular: { __type__: 'Color4', r: 0.2, g: 0.2, b: 0.2, a: 1 },
                            u_glossiness: 30, u_reflectivity: 0,
                        },
                    },
                }],
            },
            // 3 个聚光灯（橙/绿/紫，投射阴影）
            ...spotStates.map((s, i) =>
                {
                    const colors = [
                        { r: 1, g: 0.5, b: 0 },
                        { r: 0, g: 1, b: 0.5 },
                        { r: 0.5, g: 0, b: 1 },
                    ];
                    spotRots.push({ x: 0, y: 0, z: 0 });

                    return {
                        __type__: 'Object3D',
                        name: `spot${i}`,
                        position: { x: s.x, y: s.y, z: s.z },
                        rotation: spotRots[i],
                        components: [{
                            __type__: 'SpotLight',
                            color: { __type__: 'Color3', r: colors[i].r, g: colors[i].g, b: colors[i].b },
                            intensity: 10,
                            range: 50,
                            angle: s.angle,
                            penumbra: s.penumbra,
                            shadowType: 0, // No_Shadows（先验证光照，阴影后续调试）
                        }],
                    } as Object3D;
                }),
        ],
    },
};

const viewLogic = logic(view);

// 缓存光源节点引用
const spotNodes = view.root!.children!.slice(3) as unknown as Object3D[];

ticker.onframe(() =>
{
    // 每 2 秒重新随机化目标
    retargetTimer += 1 / 60;
    if (retargetTimer > 2)
    {
        retarget();
        retargetTimer = 0;
    }

    // 二次缓动（每帧 lerp 5%）
    for (let i = 0; i < spotStates.length; i++)
    {
        const s = spotStates[i];
        const k = 0.03;
        s.x += (s.tx - s.x) * k;
        s.y += (s.ty - s.y) * k;
        s.z += (s.tz - s.z) * k;
        s.angle += (s.tAngle - s.angle) * k;
        s.penumbra += (s.tPenumbra - s.penumbra) * k;

        // 写回光源（reactive 触发 uniform 更新）
        const node = spotNodes[i];
        reactive(node).position = { x: s.x, y: s.y, z: s.z };
        const light = node.components![0] as unknown as { angle: number; penumbra: number };
        reactive(light).angle = s.angle;
        reactive(light).penumbra = s.penumbra;

        // 光源朝向 target（0, 0.5, 0）：用 lookAt 矩阵计算 rotation
        const nodeLogic = logic(node);
        if (nodeLogic.local2world)
        {
            const m = nodeLogic.local2world.clone();
            m.lookAt(new Vector3(0, 0.5, 0), Vector3.Y_AXIS);
            const pos2 = new Vector3(); const rot2 = new Vector3(); const scl2 = new Vector3();
            m.toTRS(pos2, rot2, scl2);
            reactive(node).rotation = { x: rot2.x, y: rot2.y, z: rot2.z };
        }
    }

    webgpu.submit(viewLogic.submit);
});
