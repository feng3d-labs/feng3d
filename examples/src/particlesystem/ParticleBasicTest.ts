import { WebGPU } from '@feng3d/webgpu';
import { logic, ticker, View } from 'feng3d';
import type { Components } from 'feng3d';
// 副作用导入：ParticleSystem 组件类型、粒子材质与着色器由本包注册
import '@feng3d/particlesystem';

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
            background: { __type__: 'Color4', r: 0.05, g: 0.05, b: 0.08, a: 1.0 },
        }],
        children: [{
            __type__: 'Object3D',
            name: 'Main Camera',
            position: { x: 0, y: 0, z: 10 },
            components: [{
                __type__: 'PerspectiveCamera',
            } as unknown as Components],
        }, {
            __type__: 'Object3D',
            name: 'Particles',
            position: { x: 0, y: -3, z: 0 },
            // 过渡期断言：ParticleSystem 目前仍是 class，模块字段类型是"全字段必填"的
            // class（纯数据化欠账），纯数据字面量需要断言放行；运行时由 logic 工厂补默认值。
            components: [{
                __type__: 'ParticleSystem',
                main: {
                    startSpeed: { constant: 3 },
                    startLifetime: { constant: 3 },
                    startSize: { constant: 0.8 },
                    maxParticles: 600,
                },
                emission: {
                    rateOverTime: { constant: 90 },
                },
                material: {
                    // alpha 混合：粒子贴图是径向衰减的圆点，不混合会看到方片黑底
                    __type__: 'ParticleMaterial',
                    uniforms: {
                        u_TintColor: { __type__: 'Color4', r: 1, g: 1, b: 1, a: 1 },
                    },
                    blend: {
                        color: { srcFactor: 'src-alpha', dstFactor: 'one-minus-src-alpha' },
                        alpha: { srcFactor: 'one', dstFactor: 'one-minus-src-alpha' },
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
