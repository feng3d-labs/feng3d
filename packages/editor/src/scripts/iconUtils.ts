import {
    Camera, Matrix4x4, Object3D, OrthographicCamera, PerspectiveCamera, Vector3,
    logic as getLogic, reactive,
} from 'feng3d';

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
    const local = parent ? world.clone().append(getLogic(parent).world2local) : world.clone();
    const position = new Vector3();
    const rotation = new Vector3();
    const scale = new Vector3();
    local.toTRS(position, rotation, scale);

    const r_object3D = reactive(object3D);
    r_object3D.position = { x: position.x, y: position.y, z: position.z };
    r_object3D.rotation = { x: rotation.x, y: rotation.y, z: rotation.z };
    r_object3D.scale = { x: scale.x, y: scale.y, z: scale.z };
}
