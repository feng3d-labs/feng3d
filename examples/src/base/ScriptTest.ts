import { reactive, Script, ScriptLogic, Texture2D, FogMode, View, registerLogic, ticker, logic } from 'feng3d';
import { WebGPU } from '@feng3d/webgpu';

// ---- 用户脚本：纯数据接口 + Logic 类 ----

/**
 * ScriptDemo（纯数据接口）
 */
interface ScriptDemo extends Script
{
    readonly __type__: 'ScriptDemo';
}

/**
 * ScriptDemo 逻辑：每帧旋转自身所属 Object3D
 */
class ScriptDemoLogic extends ScriptLogic
{
    constructor(script: ScriptDemo)
    {
        super(script);
    }

    update(_interval: number): void
    {
        reactive(this.entity!.rotation).y += 1;
    }
}

declare module '@feng3d/reactivity'
{
    interface LogicMap
    {
        ScriptDemo: ScriptDemoLogic;
    }
}
registerLogic('ScriptDemo', ScriptDemoLogic);

// ---- 场景声明 ----

const webgpuCanvas = document.getElementById('webgpu') as HTMLCanvasElement;
const webgpu = await new WebGPU().init();

const view: View = {
    __type__: 'View',
    canvas: webgpuCanvas,
    root: {
        __type__: 'Object3D',
        name: 'Untitled',
        components: [{
            __type__: 'Scene',
            background: { __type__: 'Color4', r: 0.408, g: 0.38, b: 0.357, a: 1.0 },
        }],
        children: [{
            __type__: 'Object3D',
            name: 'Main Camera',
            position: { x: 0, y: 1, z: -10 },
            components: [{
                __type__: 'Camera',
            }],
        }, {
            __type__: 'Object3D',
            name: 'Cube',
            position: { x: 0, y: 0, z: -7 },
            components: [{
                __type__: 'ScriptDemo',
            }, {
                __type__: 'MeshRenderer',
                geometry: { __type__: 'CubeGeometry' },
                material: {
                    __type__: 'StandardMaterial',
                    uniforms: {
                        u_fogMode: FogMode.LINEAR,
                        u_fogColor: { __type__: 'Color4', r: 1, g: 1, b: 0, a: 1 },
                        u_fogMinDistance: 2,
                        u_fogMaxDistance: 3,
                    },
                    s_diffuse: (() => { const t = new Texture2D(); t.source = { url: '/m.png' }; return t; })(),
                },
            }],
        }],
    },
};
const viewLogic = logic(view);

ticker.onframe(() => { webgpu.submit(viewLogic.submit); });
