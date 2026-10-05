import { WebGPU } from '@feng3d/webgpu';
import { logic, ticker, View } from 'feng3d';
import type { Components } from 'feng3d';
import { ParticleSystemShapeType } from '@feng3d/particlesystem';

const webgpuCanvas = document.getElementById('webgpu') as HTMLCanvasElement;
const webgpu = await new WebGPU().init(); // 初始化WebGPU

const view: View = {
    __type__: 'View',
    canvas: webgpuCanvas,
    root: {
        __type__: 'Object3D',
        name: 'Untitled',
        components: [{
            __type__: 'Scene',
            background: { __type__: 'Color4', r: 0.02, g: 0.02, b: 0.03, a: 1.0 },
        }],
        children: [{
            __type__: 'Object3D',
            name: 'Main Camera',
            position: { x: 0, y: 0, z: 10 },
            components: [{
                __type__: 'PerspectiveCamera',
            }],
        }, {
            __type__: 'Object3D',
            name: 'Flame',
            position: { x: 0, y: -2.5, z: 0 },
            components: [{
                __type__: 'ParticleSystem',
                main: {
                    startSpeed: { constant: 1.6 },
                    startLifetime: { constant: 2 },
                    startSize: { constant: 0.7 },
                    maxParticles: 500,
                },
                // 高发射率 + 加性混合 = 火焰
                emission: {
                    rateOverTime: { constant: 120 },
                },
                shape: {
                    shapeType: ParticleSystemShapeType.Cone,
                    angle: 14,
                    radius: 0.25,
                },
                colorOverLifetime: {
                    color: {
                        __type__: 'MinMaxGradient',
                        mode: 0,
                        color: { __type__: 'Color4', r: 1, g: 0.55, b: 0.12, a: 1 },
                    },
                },
                material: {
                    __type__: 'ParticleMaterial',
                    uniforms: {
                        u_TintColor: { __type__: 'Color4', r: 1, g: 0.72, b: 0.28, a: 1 },
                    },
                    // 加性混合：粒子亮度叠加，形成发光核心
                    blend: {
                        color: { srcFactor: 'one', dstFactor: 'one' },
                        alpha: { srcFactor: 'one', dstFactor: 'one' },
                    },
                },
            } as unknown as Components],
        }],
    },
};
const viewLogic = logic(view);

ticker.onframe(() =>
{
    webgpu.submit(viewLogic.submit);
});
