import { Component3D, Component, Component3DLogic, ComponentLogic } from './Component';
import type { Camera } from '../cameras/Camera';
import type { Object3D } from '../core/Object3D';
import { registerLogic, logic as getLogic, reactive } from '@feng3d/reactivity';
import { Vector3 } from '@feng3d/math';
import { RenderObject } from '@feng3d/webgpu';
// 触发 HoldSizeComponent logic 注册（registerLogic 副作用）
import './HoldSizeComponent';

declare module './Component'
{
    export interface ComponentMap
    {
        HoldSizeComponent: HoldSizeComponent;
    }
}

/**
 * HoldSizeComponent（纯数据接口）。
 */
export interface HoldSizeComponent extends Component3D
{
    readonly __type__: 'HoldSizeComponent';
    /** 保持的屏幕尺寸（缺失时由 registerLogic 自动填充） */
    readonly holdSize?: number;
    /** 注视的相机（缺失时由 registerLogic 自动填充为 null，使用时另行赋值） */
    readonly camera?: Camera | null;
}

/**
 * HoldSizeComponent 默认值模板。
 */
const holdSizeComponentDefaults = {
    __type__: 'HoldSizeComponent' as const,
    holdSize: 1,
    camera: null as Camera | null,
};

/**
 * 创建 HoldSizeComponent 实例。
 */
export function createHoldSizeComponent(): HoldSizeComponent
{
    return { ...holdSizeComponentDefaults };
}

declare module '@feng3d/reactivity'
{
    interface LogicMap
    {
        HoldSizeComponent: HoldSizeComponentLogic;
    }
}

/**
 * HoldSizeComponent 逻辑处理类。
 *
 * 在 beforeRender 阶段后处理 renderObject 的 u_modelMatrix：
 * 根据相机距离计算 depthScale，把 model matrix 的 scale 分量乘以
 * depthScale * holdSize，使对象在屏幕上保持固定尺寸。
 *
 * 忠实于原始逻辑（原版直接改 _local2world 矩阵的 scale 分量）。
 */
export class HoldSizeComponentLogic extends Component3DLogic
{
    constructor(component: HoldSizeComponent)
    {
        super(component);
    }

    init(object3D?: Object3D) { super.init(object3D); }

    beforeRender(renderObject: RenderObject)
    {
        const component = this.component as HoldSizeComponent;
        const camera = component.camera;
        const holdSize = component.holdSize ?? 1;
        if (!camera || !holdSize) return;

        // 从 renderObject 的 transform uniform 取已写入的 u_modelMatrix（transform.beforeRender 先执行）
        const bindingResources = renderObject.bindingResources as Record<string, any>;
        const transformBinding = bindingResources?.transform;
        if (!transformBinding?.value) return;

        const transformUniforms = transformBinding.value as any;
        const modelMatrix = transformUniforms.u_modelMatrix;
        if (!modelMatrix) return;

        // 计算相机距离对应的 depthScale
        const depthScale = getDepthScale(this.entity, camera);
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
 * 计算相机距离对应的 depthScale（与原始 _getDepthScale 一致）。
 */
function getDepthScale(object3D: any, camera: Camera): number
{
    const cameraObj3D = getLogic(camera).entity;
    if (!cameraObj3D || !object3D) return 0;

    const cameraLocal2world = getLogic(cameraObj3D).local2world.value;
    const worldPos = getLogic(object3D).worldPosition.value;
    const distance = worldPos.subTo(cameraLocal2world.getPosition());
    if (distance.length === 0)
    {
        distance.x = 1;
    }
    const depth = distance.dot(cameraLocal2world.getAxisZ());
    let scale = getLogic(camera).getScaleByDepth(depth);
    // 限制在放大缩小100倍之间
    scale = Math.max(Math.min(100, scale), 0.01);

    return scale;
}
registerLogic('HoldSizeComponent', (component) =>
{
    return new HoldSizeComponentLogic(component as HoldSizeComponent);
}, holdSizeComponentDefaults);
