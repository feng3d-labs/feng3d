import { logic as getLogic, reactive, registerLogic } from '@feng3d/reactivity';
import { RenderObject } from '@feng3d/webgpu';
import type { Object3D } from '../core/Object3D';
import { Component3D, Component3DLogic, ComponentLogicBase } from './Component';
import { Matrix4x4, Vector3 } from '@feng3d/math';

declare module './Component'
{
    export interface ComponentMap
    {
        HoldSize: HoldSize;
    }
}

/**
 * HoldSize（纯数据接口）。
 */
export interface HoldSize extends Component3D
{
    readonly __type__: 'HoldSize';
    /** 保持的屏幕尺寸（缺失时由 registerLogic 自动填充） */
    readonly holdSize?: number;
}

declare module '@feng3d/reactivity'
{
    interface LogicMap
    {
        HoldSize: HoldSizeLogic;
    }
}

/**
 * HoldSize 逻辑处理接口。
 *
 * 在 beforeRender 阶段后处理 renderObject 的 u_modelMatrix：
 * 根据相机距离计算 depthScale，把 model matrix 的 scale 分量乘以
 * depthScale * holdSize，使对象在屏幕上保持固定尺寸。
 *
 * 忠实于原始逻辑（原版直接改 _local2world 矩阵的 scale 分量）。
 */
/**
 * HoldSizeLogic 实现（AGENTS 第 3 章 class 模板，存量工厂迁移示范）。
 *
 * protected constructor（只能经 logic() 创建）；继承 ComponentLogicBase
 * 复用 component/entity/init 行为；方法在原型上共享。
 */
export class HoldSizeLogic extends ComponentLogicBase
{
    private readonly _data: HoldSize;

    protected constructor(data: HoldSize)
    {
        super(data);
        this._data = data;
        // 默认值（缺失字段单独赋值）
        if (data.holdSize === undefined) (data as { holdSize: number }).holdSize = 1;
    }

    get entity(): Object3D | null
    {
        return this._entity as Object3D | null;
    }

    beforeRender(renderObject: RenderObject): void
    {
        const holdSize = this._data.holdSize ?? 1;
        if (!holdSize) return;

        // 从 renderObject 的 transform uniform 取已写入的 u_modelMatrix（Renderable 的 transform binding 写入先执行）
        const bindingResources = renderObject.bindingResources;
        const transformBinding = bindingResources?.transform;
        if (!transformBinding?.value) return;

        const transformUniforms = transformBinding.value;
        const modelMatrix = transformUniforms.u_modelMatrix;
        if (!modelMatrix) return;

        // 从 cameraUniforms 获取相机数据（u_cameraMatrix=local2world，u_scaleByDepth=depth=1 的 scale）。
        // cameraUniforms 由 ForwardRenderer 在 draw 阶段注入，组件 beforeRender（在 _renderObject
        // computed 内）先执行时可能尚未注入，此时跳过。
        const cameraUniformsBinding = bindingResources?.cameraUniforms;
        if (!cameraUniformsBinding?.value) return;
        const cameraUniforms = cameraUniformsBinding.value;
        const cameraMatrix = cameraUniforms.u_cameraMatrix;
        if (!cameraMatrix) return;
        const scaleByDepthUnit = cameraUniforms.u_scaleByDepth;

        // 计算相机距离对应的 depthScale（entity 为 Component3D 持有的 Object3D）
        const depthScale = getDepthScale(this.entity, cameraMatrix, scaleByDepthUnit);
        if (!depthScale) return;

        // 把 model matrix 的 scale 分量乘以 depthScale * holdSize
        const pos = new Vector3();
        const rot = new Vector3();
        const scl = new Vector3();
        modelMatrix.toTRS(pos, rot, scl);
        const factor = depthScale * holdSize;
        scl.x *= factor;
        scl.y *= factor;
        scl.z *= factor;

        // 写回新矩阵（避免直接 mutate 原 Matrix4x4）
        const newMatrix = modelMatrix.clone();
        newMatrix.fromTRS(pos, rot, scl);

        const r_transformUniforms = reactive(transformUniforms);
        r_transformUniforms.u_modelMatrix = newMatrix;
        // u_ITModelMatrix 同步更新（逆转置矩阵用于法线）
        r_transformUniforms.u_ITModelMatrix = newMatrix.clone().invert().transpose();
    }

    dispose(): void { /* no-op */ }
}
registerLogic('HoldSize', HoldSizeLogic as unknown as new (data: HoldSize) => HoldSizeLogic);

/**
 * 计算相机距离对应的 depthScale。
 *
 * 从 cameraMatrix（相机 local2world）算 object 在相机 view-space 的 depth，
 * depthScale = depth × scaleByDepthUnit（透视投影下 scale ∝ depth，
 * scaleByDepthUnit 是 depth=1 处的 scale，按比例得当前 depth 的 scale）。
 */
function getDepthScale(object3D: Object3D, cameraMatrix: Matrix4x4, scaleByDepthUnit: number): number
{
    if (!object3D) return 0;

    const worldPos = getLogic(object3D).worldPosition;
    const cameraPos = cameraMatrix.getPosition();
    const distance = worldPos.subTo(cameraPos);
    if (distance.length === 0)
    {
        distance.x = 1;
    }
    // 相机 forward 为本地 -Z，可见物体在相机前方 distance·getAxisZ() 为负，取负得正深度
    const depth = -distance.dot(cameraMatrix.getAxisZ());
    // 透视投影：scale ∝ depth，depth=1 时为 scaleByDepthUnit
    let scale = depth * scaleByDepthUnit;
    // 限制在放大缩小100倍之间
    scale = Math.max(Math.min(100, scale), 0.01);

    return scale;
}
