import { Component3D, Component, Component3DLogic, ComponentLogic } from './Component';
import type { Camera } from '../cameras/Camera';
import type { Object3D } from '../core/Object3D';
import { registerLogic, logic as getLogic, reactive } from '@feng3d/reactivity';
import { RenderObject } from '@feng3d/webgpu';
// 触发 BillboardComponent logic 注册（registerLogic 副作用）
import './BillboardComponent';

declare module './Component'
{
    export interface ComponentMap
    {
        BillboardComponent: BillboardComponent;
    }
}

/**
 * BillboardComponent（纯数据接口）。
 */
export interface BillboardComponent extends Component3D
{
    readonly __type__: 'BillboardComponent';
    /** 注视的相机（缺失时由 registerLogic 自动填充为 null，使用时另行赋值） */
    readonly camera?: Camera | null;
}

/**
 * BillboardComponent 默认值模板。
 */
const billboardComponentDefaults = {
    __type__: 'BillboardComponent' as const,
    camera: null as Camera | null,
};

/**
 * 创建 BillboardComponent 实例。
 */
export function createBillboardComponent(): BillboardComponent
{
    return { ...billboardComponentDefaults };
}

declare module '@feng3d/reactivity'
{
    interface LogicMap
    {
        BillboardComponent: BillboardComponentLogic;
    }
}

/**
 * BillboardComponent 逻辑处理类。
 *
 * 在 beforeRender 阶段后处理 renderObject 的 u_modelMatrix：
 * 让对象始终看向相机（lookAt 相机位置，up 轴用相机 local2world 的 Y 轴）。
 *
 * 忠实于原始逻辑（原版直接改 _local2world.lookAt(cameraPos, yAxis)）。
 */
export class BillboardComponentLogic extends Component3DLogic
{
    constructor(component: BillboardComponent)
    {
        super(component);
    }

    init(object3D?: Object3D) { super.init(object3D); }

    beforeRender(renderObject: RenderObject)
    {
        const component = this.component as BillboardComponent;
        const camera = component.camera;
        if (!camera) return;

        // 从 renderObject 的 transform uniform 取已写入的 u_modelMatrix（transform.beforeRender 先执行）
        const bindingResources = renderObject.bindingResources as Record<string, any>;
        const transformBinding = bindingResources?.transform;
        if (!transformBinding?.value) return;

        const transformUniforms = transformBinding.value as any;
        const modelMatrix = transformUniforms.u_modelMatrix;
        if (!modelMatrix) return;

        const cameraObj3D = getLogic(camera).entity;
        if (!cameraObj3D || !this.entity) return;

        const cameraLocal2world = getLogic(cameraObj3D).local2world.value;
        const cameraPos = getLogic(cameraObj3D).worldPosition;
        const yAxis = cameraLocal2world.getAxisY();

        // 复制原矩阵并 lookAt 相机（保持位置，改变旋转）
        const newMatrix = modelMatrix.clone();
        newMatrix.lookAt(cameraPos, yAxis);

        const r_transformUniforms = reactive(transformUniforms);
        r_transformUniforms.u_modelMatrix = newMatrix;
        r_transformUniforms.u_ITModelMatrix = newMatrix.clone().invert().transpose();
    }

    dispose() { /* no-op */ }
}
registerLogic('BillboardComponent', BillboardComponentLogic, billboardComponentDefaults);
