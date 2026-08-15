import { reactive, registerLogic } from '@feng3d/reactivity';
import { RenderObject } from '@feng3d/webgpu';
import type { Object3D } from '../core/Object3D';
import { Component3D, Component3DLogic, ComponentLogicBase } from './Component';

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
/**
 * BillboardLogic 实现（AGENTS 第 3 章 class 模板，存量工厂迁移示范）。
 *
 * protected constructor（只能经 logic() 创建）；继承 ComponentLogicBase
 * 复用 component/entity/init 行为；方法在原型上共享。
 */
export class BillboardLogic extends ComponentLogicBase
{
    protected constructor(data: Billboard)
    {
        super(data);
    }

    get entity(): Object3D | null
    {
        return this._entity as Object3D | null;
    }

    beforeRender(renderObject: RenderObject): void
    {
        // 从 renderObject 的 transform uniform 取已写入的 u_modelMatrix（Renderable 的 transform binding 写入先执行）
        const bindingResources = renderObject.bindingResources;
        const transformBinding = bindingResources?.transform;
        if (!transformBinding?.value) return;

        const transformUniforms = transformBinding.value;
        const modelMatrix = transformUniforms.u_modelMatrix;
        if (!modelMatrix) return;

        if (!this.entity) return;

        // 从 cameraUniforms 获取相机数据（u_cameraMatrix=local2world，取 position + Y 轴）。
        // cameraUniforms 由 ForwardRenderer 在 draw 阶段注入，组件 beforeRender（在 _renderObject
        // computed 内）先执行时可能尚未注入，此时跳过。
        const cameraUniformsBinding = bindingResources?.cameraUniforms;
        if (!cameraUniformsBinding?.value) return;
        const cameraUniforms = cameraUniformsBinding.value;
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

    dispose(): void { /* no-op */ }
}
registerLogic('Billboard', BillboardLogic as unknown as new (data: Billboard) => BillboardLogic);
