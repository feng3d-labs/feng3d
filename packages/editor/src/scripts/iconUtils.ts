import { mat4Append, mat4Copy, mat4ToTRS, Matrix4x4, Vector3, logic as getLogic, reactive } from 'feng3d';
import type { Camera, Object3D, OrthographicCamera, PerspectiveCamera } from 'feng3d';
import type { UnReadonly } from '@feng3d/reactivity';

/**
 * 图标类组件统一使用的 alpha 混合状态（src-alpha / one-minus-src-alpha，add）。
 *
 * 迁移自旧 `setBlendEnabled(material, true)`：新范式的渲染状态是材质的**数据字段**
 * （`TextureMaterial.blend` 等），不再经 renderPipeline 命令式写入——主仓已移除
 * `Material.renderParams`，各材质 logic 在构造时自建 pipeline，外部只改数据。
 */
export const ALPHA_BLEND = {
    color: { srcFactor: 'src-alpha', dstFactor: 'one-minus-src-alpha', operation: 'add' },
    alpha: { srcFactor: 'src-alpha', dstFactor: 'one-minus-src-alpha', operation: 'add' },
} as const;

/**
 * 取相机组件所属的 Object3D。
 *
 * `Camera.__type__` 是宽松 `string`（抽象基接口，不声明具体字面量），无法直接按
 * `LogicMap` 分发；这里按具体子类（PerspectiveCamera / OrthographicCamera）取 logic
 * 后再读只读 getter `entity`。
 */
export function cameraObject3D(camera: Camera): Object3D | null
{
    return getLogic(camera as PerspectiveCamera | OrthographicCamera).entity;
}

/**
 * 把世界变换矩阵写入纯数据 Object3D（分解为本地 position / rotation / scale）。
 *
 * 迁移自旧 `Transform.setLocal2world()`（主仓已移除 `Transform` 类与
 * `Object3D.transform` 字段）：父级存在时先把世界矩阵右乘父级的世界转本地矩阵得到
 * 本地矩阵，再分解 TRS 经响应式代理写入（规范 §8.4：从 raw 读、向代理写）。
 *
 * @param object3D 目标对象（原始数据对象）
 * @param world 目标世界变换矩阵
 */
export function setWorldMatrix(object3D: Object3D, world: Matrix4x4): void
{
    const parent = getLogic(object3D).parent;
    // 阶段 C-e：`Matrix4x4` 的 class 已删除，`clone()` / `append()` / `toTRS()` 换成纯函数
    const local: Matrix4x4 = { __type__: 'Matrix4x4', ...mat4Copy(world) };
    if (parent) mat4Append(local, getLogic(parent).world2local, local);
    const position = new Vector3();
    const rotation = new Vector3();
    const scale = new Vector3();
    mat4ToTRS(local, position, rotation, scale);

    const r_object3D = reactive(object3D);
    r_object3D.position = { x: position.x, y: position.y, z: position.z };
    r_object3D.rotation = { x: rotation.x, y: rotation.y, z: rotation.z };
    r_object3D.scale = { x: scale.x, y: scale.y, z: scale.z };
}

/**
 * 向纯数据 Object3D 的 children 追加子对象（经响应式代理写入，父级关系与子对象
 * 组件初始化由主仓 `ContainerLogic` / `EntityLogic` 的 effect 自动维护）。
 *
 * **为什么需要这个封装**：组件的 `init()` 是由 `EntityLogic` 构造期的 effect **同步**
 * 触发的，而 `ContainerLogic` 对 `children` 的 pre-fill 在其后执行（基类构造体先于
 * 派生类构造体）。因此 if 组件在 init 内直接 `reactive(host).children.push(...)`，
 * 此时 `children` 仍可能是 `undefined`，会抛
 * `TypeError: Cannot read properties of undefined (reading 'push')`
 * （编辑器给默认场景里的平行光 / 相机挂图标时必现）。
 *
 * 主仓已统一 pre-fill 时机（issue #222）：`EntityLogic` 把组件初始化推迟到**最派生类构造
 * 完成之后**（`EntityLogic` / `ContainerLogic` 用 `new.target` 让位，`Object3DLogic` 在字段
 * 初始化后调用 `initComponents()`），因此 `ContainerLogic` 的 children pre-fill 一定先于
 * 组件 `init()`——这里不再需要按需初始化。
 *
 * @param host 宿主 Object3D（原始数据对象）
 * @param children 待追加子对象
 */
export function appendChildren(host: Object3D, ...children: Object3D[]): void
{
    (reactive(host).children as Object3D[]).push(...children);
}
