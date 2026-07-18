import { Component3D, Component3DLogic } from './Component';
import type { Object3D } from '../core/Object3D';
import { registerLogic, reactive } from '@feng3d/reactivity';
import { BufferBinding, RenderObject } from '@feng3d/webgpu';
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
}

/**
 * BillboardComponent 默认值模板。
 */
const billboardComponentDefaults = {
    __type__: 'BillboardComponent' as const,
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
        // 从 renderObject 的 transform uniform 取已写入的 u_modelMatrix（transform.beforeRender 先执行）
        const bindingResources = renderObject.bindingResources as Record<string, any>;
        const transformBinding = bindingResources?.transform;
        if (!transformBinding?.value) return;

        const transformUniforms = transformBinding.value as any;
        const modelMatrix = transformUniforms.u_modelMatrix;
        if (!modelMatrix) return;

        if (!this.entity) return;

        // 从 cameraUniforms 获取相机数据（u_cameraMatrix=local2world，取 position + Y 轴）。
        // cameraUniforms 由 ForwardRenderer 在 draw 阶段注入，组件 beforeRender（在 _renderObject
        // computed 内）先执行时可能尚未注入，此时跳过。
        const cameraUniformsBinding = (renderObject.bindingResources as Record<string, any>)?.cameraUniforms as BufferBinding | undefined;
        if (!cameraUniformsBinding?.value) return;
        const cameraUniforms = cameraUniformsBinding.value as CameraUniforms;
        const cameraMatrix = cameraUniforms.u_cameraMatrix;
        if (!cameraMatrix) return;

        const cameraPos = cameraMatrix.getPosition();
        const yAxis = cameraMatrix.getAxisY();

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
