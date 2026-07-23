import { Matrix4x4, Vector3 } from '@feng3d/math';
import { logic as getLogic, reactive, registerLogic } from '@feng3d/reactivity';
import { BindingResource, BufferBinding, RenderObject } from '@feng3d/webgpu';
import type { Object3D } from '../core/Object3D';
import { Component3D, Component3DLogic } from './Component';
// 触发 HoldSize logic 注册（registerLogic 副作用）
import './HoldSize';
// 引入全局 uniform 类型定义（TransformUniforms / CameraUniforms 通过 declare global 声明）
import '../render/data/Uniform';

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

/**
 * HoldSize 默认值模板。
 */
const holdSizeDefaults = {
    __type__: 'HoldSize' as const,
    holdSize: 1,
};

/**
 * 创建 HoldSize 实例。
 */
export function createHoldSize(): HoldSize
{
    return { ...holdSizeDefaults };
}

declare module '@feng3d/reactivity'
{
    interface LogicMap
    {
        HoldSize: HoldSizeLogic;
    }
}

/**
 * HoldSize 逻辑处理类。
 *
 * 在 beforeRender 阶段后处理 renderObject 的 u_modelMatrix：
 * 根据相机距离计算 depthScale，把 model matrix 的 scale 分量乘以
 * depthScale * holdSize，使对象在屏幕上保持固定尺寸。
 *
 * 忠实于原始逻辑（原版直接改 _local2world 矩阵的 scale 分量）。
 */
export class HoldSizeLogic extends Component3DLogic
{
    constructor(component: HoldSize)
    {
        super(component);
        // 默认值（缺失字段单独赋值）
        if (component.holdSize === undefined) (component as { holdSize: number }).holdSize = 1;
    }

    init(object3D?: Object3D) { super.init(object3D); }

    beforeRender(renderObject: RenderObject)
    {
        const component = this.component as HoldSize;
        const holdSize = component.holdSize ?? 1;
        if (!holdSize) return;

        // 从 renderObject 的 transform uniform 取已写入的 u_modelMatrix（transform.beforeRender 先执行）
        const bindingResources = renderObject.bindingResources as Record<string, BindingResource> | undefined;
        const transformBinding = bindingResources?.transform as BufferBinding | undefined;
        if (!transformBinding?.value) return;

        const transformUniforms = transformBinding.value as TransformUniforms;
        const modelMatrix = transformUniforms.u_modelMatrix;
        if (!modelMatrix) return;

        // 从 cameraUniforms 获取相机数据（u_cameraMatrix=local2world，u_scaleByDepth=depth=1 的 scale）。
        // cameraUniforms 由 ForwardRenderer 在 draw 阶段注入，组件 beforeRender（在 _renderObject
        // computed 内）先执行时可能尚未注入，此时跳过。
        const cameraUniformsBinding = bindingResources?.cameraUniforms as BufferBinding | undefined;
        if (!cameraUniformsBinding?.value) return;
        const cameraUniforms = cameraUniformsBinding.value as CameraUniforms;
        const cameraMatrix = cameraUniforms.u_cameraMatrix;
        if (!cameraMatrix) return;
        const scaleByDepthUnit = cameraUniforms.u_scaleByDepth;

        // 计算相机距离对应的 depthScale
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

    dispose() { /* no-op */ }
}

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
    const depth = distance.dot(cameraMatrix.getAxisZ());
    // 透视投影：scale ∝ depth，depth=1 时为 scaleByDepthUnit
    let scale = depth * scaleByDepthUnit;
    // 限制在放大缩小100倍之间
    scale = Math.max(Math.min(100, scale), 0.01);

    return scale;
}
registerLogic('HoldSize', HoldSizeLogic);
