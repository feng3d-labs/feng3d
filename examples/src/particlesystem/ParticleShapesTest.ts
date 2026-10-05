import { WebGPU } from '@feng3d/webgpu';
import { logic, ticker, View } from 'feng3d';
import type { Components } from 'feng3d';
import { ParticleSystemShapeType } from '@feng3d/particlesystem';

const webgpuCanvas = document.getElementById('webgpu') as HTMLCanvasElement;
const webgpu = await new WebGPU().init(); // 初始化WebGPU

/** 一个发射形状示例：形状 + 颜色 */
function makeEmitter(name: string, x: number, shapeType: ParticleSystemShapeType, color: { r: number; g: number; b: number })
{
    return {
        __type__: 'Object3D' as const,
        name,
        position: { x, y: 0, z: 0 },
        components: [{
            __type__: 'ParticleSystem' as const,
            main: {
                startSpeed: { constant: 1.6 },
                startLifetime: { constant: 2.5 },
                startSize: { constant: 0.35 },
                maxParticles: 400,
            },
            emission: {
                rateOverTime: { constant: 60 },
            },
            shape: {
                shapeType,
                angle: 25,
                radius: 0.8,
                box: { x: 2, y: 2, z: 2 },
            },
            colorOverLifetime: {
                color: {
                    __type__: 'MinMaxGradient' as const,
                    mode: 0,
                    color: { __type__: 'Color4' as const, ...color, a: 1 },
                },
            },
            material: {
                __type__: 'ParticleMaterial' as const,
                uniforms: {
                    u_TintColor: { __type__: 'Color4', ...color, a: 1 },
                },
                blend: {
                    color: { srcFactor: 'src-alpha' as const, dstFactor: 'one-minus-src-alpha' as const },
                    alpha: { srcFactor: 'one' as const, dstFactor: 'one-minus-src-alpha' as const },
                },
            },
            // 过渡期断言（同 ParticleBasicTest：模块字段类型尚未放宽为可选）
        }],
    };
}

const view: View = {
    __type__: 'View',
    canvas: webgpuCanvas,
    root: {
        __type__: 'Object3D',
        name: 'Untitled',
        components: [{
            __type__: 'Scene',
            background: { __type__: 'Color4', r: 0.05, g: 0.05, b: 0.08, a: 1.0 },
        }],
        children: [{
            __type__: 'Object3D',
            name: 'Main Camera',
            position: { x: 0, y: 0, z: 14 },
            components: [{
                __type__: 'PerspectiveCamera',
            } as unknown as Components],
        },
            makeEmitter('SphereShape', -4, ParticleSystemShapeType.Sphere, { r: 0.4, g: 0.7, b: 1 }),
            makeEmitter('ConeShape', 0, ParticleSystemShapeType.Cone, { r: 1, g: 0.8, b: 0.3 }),
            makeEmitter('BoxShape', 4, ParticleSystemShapeType.Box, { r: 1, g: 0.4, b: 0.6 }),
        ],
    },
};
const viewLogic = logic(view);

ticker.onframe(() =>
{
    webgpu.submit(viewLogic.submit);
});
