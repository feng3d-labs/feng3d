import { WebGPU } from '@feng3d/webgpu';
import { createTextureFromCanvas, logic, Object3D, reactive, Scene, TextureMaterial, View, ticker } from 'feng3d';

/**
 * 公告板精灵（Sprite/Billboard）。
 *
 * 对照 three.js：examples/webgl_sprites.html
 *
 * 原示例用 THREE.Sprite（始终面向相机的平面），feng3d 无 Sprite，用 Plane + billboard
 * 脚本（每帧同步相机朝向，让平面始终面向相机）。
 */

const webgpuCanvas = document.getElementById('webgpu') as HTMLCanvasElement;
const webgpu = await new WebGPU().init();

// 程序化生成 sprite 纹理（彩色圆形）
function makeSpriteTexture(r: number, g: number, b: number)
{
    const c = document.createElement('canvas');
    c.width = c.height = 64;
    const ctx = c.getContext('2d')!;
    const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    grad.addColorStop(0, `rgba(${r*255|0},${g*255|0},${b*255|0},1)`);
    grad.addColorStop(0.7, `rgba(${r*255|0},${g*255|0},${b*255|0},0.8)`);
    grad.addColorStop(1, `rgba(${r*255|0},${g*255|0},${b*255|0},0)`);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 64, 64);

    return createTextureFromCanvas(c);
}

const tex1 = await makeSpriteTexture(1, 0.3, 0.3);
const tex2 = await makeSpriteTexture(0.3, 1, 0.3);
const tex3 = await makeSpriteTexture(0.3, 0.3, 1);

const spriteNodes: { node: Object3D; rot: { x: number; y: number; z: number } }[] = [];
const textures = [tex1, tex2, tex3];

for (let i = 0; i < 30; i++)
{
    const angle = (i / 30) * Math.PI * 2;
    const radius = 5 + (i % 3) * 3;
    const rot = { x: 0, y: 0, z: 0 };
    const tex = textures[i % 3];
    const node: Object3D = {
        __type__: 'Object3D',
        name: `sprite_${i}`,
        position: { x: Math.cos(angle) * radius, y: (i % 5) * 2 - 4, z: Math.sin(angle) * radius },
        rotation: rot,
        components: [{
            __type__: 'MeshRenderer',
            geometry: { __type__: 'PlaneGeometry', width: 1.5, height: 1.5 },
            material: {
                __type__: 'TextureMaterial',
                uniforms: { u_color: { __type__: 'Color4', r: 1, g: 1, b: 1, a: 1 } },
                s_texture: tex as unknown as TextureMaterial['s_texture'],
            },
        }],
    };
    spriteNodes.push({ node, rot });
}

const view: View = {
    __type__: 'View',
    canvas: webgpuCanvas,
    root: {
        __type__: 'Object3D',
        name: 'Untitled',
        components: [{
            __type__: 'Scene',
            background: { __type__: 'Color4', r: 0.1, g: 0.1, b: 0.1, a: 1 },
            ambientColor: { __type__: 'Color4', r: 1, g: 1, b: 1, a: 1 },
        }],
        children: [
            {
                __type__: 'Object3D', name: 'Main Camera', position: { x: 0, y: 0, z: 15 },
                rotation: { x: 0, y: 0, z: 0 },
                components: [{
                    __type__: 'PerspectiveCamera', fov: 60,
                    aspect: webgpuCanvas.width / webgpuCanvas.height, near: 0.1, far: 100,
                },
                { __type__: 'OrbitControls', target: { x: 0, y: 0, z: 0 }, autoRotate: true, autoRotateSpeed: 0.3 }],
            },
            ...spriteNodes.map(s => s.node),
        ],
    },
};

const viewLogic = logic(view);
const cameraNode = view.root!.children![0];

ticker.onframe(() =>
{
    // billboard：让每个 sprite 平面朝向相机
    const camLogic = logic(cameraNode);
    const camWorldPos = camLogic.position;
    for (const s of spriteNodes)
    {
        const nodeLogic = logic(s.node);
        const pos = nodeLogic.position;
        // 计算 sprite→相机方向，设置 rotation 朝向
        const dx = camWorldPos.x - pos.x;
        const dy = camWorldPos.y - pos.y;
        const dz = camWorldPos.z - pos.z;
        // 简化 billboard：用 lookAt 逻辑（Y 轴向上的 billboard）
        const yaw = Math.atan2(dx, dz);
        const pitch = Math.atan2(dy, Math.sqrt(dx * dx + dz * dz));
        reactive(s.rot).x = pitch;
        reactive(s.rot).y = yaw;
    }
    webgpu.submit(viewLogic.submit);
});
