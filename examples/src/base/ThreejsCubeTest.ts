import { WebGPU } from '@feng3d/webgpu';
import { createTextureFromUrl, logic, PerspectiveLens, reactive, View } from 'feng3d';

/**
 * 移植自 three.js examples/webgl_geometry_cube.html。
 *
 * 原示例：单个 BoxGeometry + MeshBasicMaterial（crate 贴图），PerspectiveCamera fov=70
 * 在 +Z 朝原点看，每帧旋转 cube（x +0.005, y +0.01）。
 *
 * feng3d 适配：
 * - BoxGeometry → CubeGeometry
 * - MeshBasicMaterial（无光照）→ TextureMaterial
 * - textures/crate.gif → /crate.gif（同源资源，复制自 three.js）
 * - PerspectiveCamera(70, aspect, 0.1, 100)，position.z=2 → fov=70，position.z=-2
 *   （feng3d 相机视线 +Z，原点须在相机前方，故相机放在 -Z）
 * - setAnimationLoop → requestAnimationFrame（每帧执行，旋转速度跟随显示器刷新率）
 * - onWindowResize → window resize 事件，更新 lens.aspect 与 canvas 尺寸
 */
let cubeRotation: { readonly x: number; readonly y: number; readonly z: number; };

const webgpuCanvas = document.getElementById('webgpu') as HTMLCanvasElement;
const webgpu = await new WebGPU().init();

// 先 await 纹理 Promise，再构造 View
const texture = await createTextureFromUrl('/crate.gif');

const view: View = {
    __type__: 'View',
    canvas: webgpuCanvas,
    root: {
        __type__: 'Object3D',
        name: 'Untitled',
        components: [{
            __type__: 'Scene',
            background: { __type__: 'Color4', r: 0, g: 0, b: 0, a: 1 },
        }],
        children: [{
            __type__: 'Object3D',
            name: 'Main Camera',
            position: { x: 0, y: 0, z: -2 },
            components: [{
                __type__: 'Camera',
            }],
        }, {
            __type__: 'Object3D',
            name: 'Cube',
            rotation: cubeRotation = { x: 0, y: 0, z: 0 },
            components: [{
                __type__: 'MeshRenderer',
                geometry: { __type__: 'CubeGeometry' },
                material: {
                    __type__: 'TextureMaterial',
                    s_texture: texture,
                },
            }],
        }],
    },
};
const viewLogic = logic(view);

// PerspectiveCamera(70, aspect, 0.1, 100)：aspect 用 canvas 实际宽高比（对应 three.js 的 innerWidth/innerHeight）
const cameraEntity = view.root!.children![0];
const lens = new PerspectiveLens(70, webgpuCanvas.width / webgpuCanvas.height, 0.1, 100);
logic(cameraEntity).lens = lens;

// onWindowResize：更新 aspect 与 canvas 尺寸（对应原示例的 onWindowResize）
function onWindowResize(): void
{
    reactive(lens).aspect = webgpuCanvas.width / webgpuCanvas.height;
}
window.addEventListener('resize', onWindowResize);

// animate：对应原示例 setAnimationLoop(animate) + 每帧 rotation.x += 0.005, y += 0.01（弧度）
// three.js rotation 是弧度；feng3d rotation 字段是角度（fromTRS 内部乘 DEG2RAD 转弧度），
// 故增量 ×180/π 换算为角度，才能与原示例旋转速度一致。
function animate(): void
{
    const cur = cubeRotation;
    reactive(cubeRotation).x = cur.x + 0.005 * 180 / Math.PI;
    reactive(cubeRotation).y = cur.y + 0.01 * 180 / Math.PI;

    webgpu.submit(viewLogic.submit);

    requestAnimationFrame(animate);
}
requestAnimationFrame(animate);
