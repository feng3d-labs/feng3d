import { WebGPU } from '@feng3d/webgpu';
import { reactive, ticker, View, logic, getByPath } from 'feng3d';
import type { ColorMaterial } from 'feng3d';

//
// $ref 共享引用示例（框架设计文档 3.7）。
//
// 两个立方体的材质以 `{ $ref: 'materials/shared' }` 声明，构造期解析为
// defs.materials.shared 的**同一 raw 对象**——reactive 经 WeakMap 缓存返回
// 同一代理，经代理修改一处，两处渲染同时变化。
//

const webgpu = await new WebGPU().init(); // 初始化WebGPU

const view: View = {
    __type__: 'View',
    // 宿主锚点（设计 3.3）：canvas 以元素 id 字符串引用，ViewLogic 构造时解析，
    // 整个 View 字面量保持纯数据（可序列化往返）
    canvas: 'webgpu',
    defs: {
        materials: {
            shared: {
                __type__: 'ColorMaterial',
                uniforms: { u_diffuseInput: { __type__: 'Color4', r: 0.9, g: 0.4, b: 0.2, a: 1 } },
            },
        },
    },
    root: {
        __type__: 'Object3D',
        name: 'Untitled',
        components: [{
            __type__: 'Scene',
            background: { __type__: 'Color4', r: 0.16, g: 0.23, b: 0.29, a: 1.0 },
        }],
        children: [{
            __type__: 'Object3D',
            name: 'Main Camera',
            position: { x: 0, y: 1, z: 8 },
            components: [{
                __type__: 'PerspectiveCamera',
            }],
        }, {
            __type__: 'Object3D',
            name: 'Cube-A',
            position: { x: -1.5, y: 0, z: 0 },
            components: [{
                __type__: 'MeshRenderer',
                geometry: { __type__: 'CubeGeometry' },
                // $ref 占位字面量与材质类型不兼容，断言处理（构造期解析为同一材质实例）
                material: { $ref: 'materials/shared' } as unknown as ColorMaterial,
            }],
        }, {
            __type__: 'Object3D',
            name: 'Cube-B',
            position: { x: 1.5, y: 0, z: 0 },
            components: [{
                __type__: 'MeshRenderer',
                geometry: { __type__: 'CubeGeometry' },
                material: { $ref: 'materials/shared' } as unknown as ColorMaterial,
            }],
        }],
    },
};
const viewLogic = logic(view);

// 查询 API（设计 3.4）：按索引路径获取可变引用，不在字面量内捕获变量
const shared = getByPath(view, 'defs/materials/shared') as ColorMaterial;
const materialA = getByPath(view, 'root/children/1/components/0/material');
const materialB = getByPath(view, 'root/children/2/components/0/material');
console.log(`[RefTest] 两处 $ref 解析为同一实例: ${materialA === shared && materialB === shared}`);

let num = 0;
ticker.onframe(() =>
{
    num++;

    // 每 30 帧改变共享材质颜色（由帧数决定，确定可复现）：
    // 两处 $ref 是同一对象，一次写入两处同时变化
    if (num % 30 === 0)
    {
        const t = (num % 180) / 180;
        // 从原始对象读、向响应式代理写（规范 8.4）
        const uniforms = shared.uniforms;
        const r_uniforms = reactive(uniforms);
        r_uniforms.u_diffuseInput = { __type__: 'Color4', r: t, g: 1 - t, b: 0.3, a: 1 };
    }

    //
    webgpu.submit(viewLogic.submit);
});
