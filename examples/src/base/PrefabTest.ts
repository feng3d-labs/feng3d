import { WebGPU } from '@feng3d/webgpu';
import { reactive, ticker, View, logic, findByName } from 'feng3d';
import type { Object3D, CubeGeometry, ColorMaterial } from 'feng3d';

//
// Prefab 千级相似对象示例（框架设计文档 3.6）。
//
// 模板只在 defs.prefabs 写一份，每个实例仅表达 prefabId 与自身差异（overrides），
// 声明体积与对象数量解耦：实例化为「深拷贝模板 + 递归合并 overrides」，
// 发生在 logic() 首次触达该节点时，实例是独立的响应式数据。
//

const webgpu = await new WebGPU().init(); // 初始化WebGPU

const SIDE = 10; // 10 × 10 × 10 = 1000 个实例
const SPACING = 1.2; // 网格间距（立方体边长 1）

const children: Object3D[] = [];
let index = 0;
for (let x = 0; x < SIDE; x++)
    for (let y = 0; y < SIDE; y++)
        for (let z = 0; z < SIDE; z++)
        {
            children.push({
                __type__: 'Object3D',
                name: `Cube-${index++}`,
                prefabId: 'CubePrefab',
                overrides: {
                    position: { x: (x - (SIDE - 1) / 2) * SPACING, y: (y - (SIDE - 1) / 2) * SPACING, z: (z - (SIDE - 1) / 2) * SPACING },
                },
            });
        }

const view: View = {
    __type__: 'View',
    // 宿主锚点（设计 3.3）：canvas 以元素 id 字符串引用，View 字面量保持纯数据
    canvas: 'webgpu',
    defs: {
        // 模板内经 $ref 引用共享材质/几何体（设计 3.6/3.7：$ref 与 Prefab 共用 defs 区）：
        // 实例化深拷贝的是 $ref 占位字面量，resolveRefs 随后替换为同一 raw 对象——
        // 千级实例共享 1 份材质/几何体（1 个 GPU pipeline），每个实例仅持有独立 TRS
        geometries: {
            cube: { __type__: 'CubeGeometry', width: 1, height: 1, depth: 1 },
        },
        materials: {
            cube: {
                __type__: 'ColorMaterial',
                uniforms: { u_diffuseInput: { __type__: 'Color4', r: 0.85, g: 0.55, b: 0.35, a: 1 } },
            },
        },
        prefabs: {
            CubePrefab: {
                __type__: 'Object3D',
                // 显式声明 rotation 使其成为实例数据（默认值不写入 raw 数据，
                // 由 Logic getter 提供——设计 3.6/G1「JSON 只表达与默认值的差异」）
                rotation: { x: 0, y: 0, z: 0 },
                components: [{
                    __type__: 'MeshRenderer',
                    // $ref 占位字面量与具体类型不兼容，断言处理（构造期解析为共享实例）
                    geometry: { $ref: 'geometries/cube' } as unknown as CubeGeometry,
                    material: { $ref: 'materials/cube' } as unknown as ColorMaterial,
                }],
            },
        },
    },
    root: {
        __type__: 'Object3D',
        name: 'Untitled',
        components: [{
            __type__: 'Scene',
            background: { __type__: 'Color4', r: 0.2, g: 0.2, b: 0.2, a: 1.0 },
        }],
        children: [{
            __type__: 'Object3D',
            name: 'Main Camera',
            position: { x: 0, y: 0, z: 22 },
            components: [{
                __type__: 'PerspectiveCamera',
            }],
        }, ...children],
    },
};
const viewLogic = logic(view);

// 查询 API（设计 3.4）：按名查找 Cube-0 实例并旋转它——
// 实例是独立数据，修改它不影响模板与其余 999 个实例
const cube0 = findByName(view.root, 'Cube-0') as Object3D;
const rotation = cube0.rotation as { x: number; y: number; z: number };

ticker.onframe(() =>
{
    // 变化旋转（rotation 单位为弧度，1° = π/180）
    // 从原始对象读当前值、向响应式代理写新值（规范 8.4，避免读响应式建立依赖）
    const r_rotation = reactive(rotation);
    r_rotation.x = rotation.x + Math.PI / 360;
    r_rotation.y = rotation.y + Math.PI / 360;

    //
    webgpu.submit(viewLogic.submit);
});
