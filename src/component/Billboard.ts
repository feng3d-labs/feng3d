import { Component3D, Component3DLogic, componentLogic } from './Component';
import type { Object3D } from '../core/Object3D';
import { registerLogic, reactive } from '@feng3d/reactivity';
import { BindingResource, BufferBinding, RenderObject } from '@feng3d/webgpu';
// 触发 Billboard logic 注册（registerLogic 副作用）
import './Billboard';
// 引入全局 uniform 类型定义（TransformUniforms / CameraUniforms 通过 declare global 声明）
import '../render/data/Uniform';

declare module './Component'
{
    export interface ComponentMap
    {
        Billboard: Billboard;
    }
}

/**
 * Billboard（纯数据接口）。
 */
export interface Billboard extends Component3D
{
    readonly __type__: 'Billboard';
}

declare module '@feng3d/reactivity'
{
    interface LogicMap
    {
        Billboard: BillboardLogic;
    }
}

/**
 * Billboard 逻辑处理接口。
 *
 * 在 beforeRender 阶段后处理 renderObject 的 u_modelMatrix：
 * 让对象始终看向相机（lookAt 相机位置，up 轴用相机 local2world 的 Y 轴）。
 *
 * 忠实于原始逻辑（原版直接改 _local2world.lookAt(cameraPos, yAxis)）。
 */
export interface BillboardLogic extends Component3DLogic
{
}

/**
 * 创建 BillboardLogic 实例（工厂函数，组合 componentLogic 基础行为）。
 */
export function billboardLogic(component: Billboard): BillboardLogic
{
    const base = componentLogic(component);

    // 捕获基类方法，避免覆盖后再调用 base.init 导致递归
    const baseInit = base.init;

    return Object.assign(base, {
        init(object3D?: Object3D)
        {
            baseInit(object3D);
        },
        beforeRender(renderObject: RenderObject)
        {
            // 从 renderObject 的 transform uniform 取已写入的 u_modelMatrix（transform.beforeRender 先执行）
            const bindingResources = renderObject.bindingResources as Record<string, BindingResource> | undefined;
            const transformBinding = bindingResources?.transform as BufferBinding | undefined;
            if (!transformBinding?.value) return;

            const transformUniforms = transformBinding.value as TransformUniforms;
            const modelMatrix = transformUniforms.u_modelMatrix;
            if (!modelMatrix) return;

            if (!base.entity) return;

            // 从 cameraUniforms 获取相机数据（u_cameraMatrix=local2world，取 position + Y 轴）。
            // cameraUniforms 由 ForwardRenderer 在 draw 阶段注入，组件 beforeRender（在 _renderObject
            // computed 内）先执行时可能尚未注入，此时跳过。
            const cameraUniformsBinding = bindingResources?.cameraUniforms as BufferBinding | undefined;
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
        },
        dispose() { /* no-op */ },
    }) as unknown as BillboardLogic;
}
registerLogic('Billboard', billboardLogic);
