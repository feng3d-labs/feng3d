import { createLogicProto, reactive, registerLogic } from '@feng3d/reactivity';
import { RenderObject } from '@feng3d/webgpu';
import { mat4Copy, mat4GetAxisY, mat4GetPosition, mat4Invert, mat4LookAt, mat4Transpose, Matrix4x4 } from '@feng3d/math';
import { Component3D, Component3DLogic, componentLogicProto, setupComponentLogicState, type ComponentLogicState } from './Component';

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
 * BillboardLogic 的共享原型（issue #674）：继承 Component 基类实现，覆写 beforeRender。
 *
 * 方法 / getter 挂在模块级 proto 上、实例由 Object.create(proto) 创建，
 * 保住「方法在原型上共享」的内存优势（千级组件场景不产生每实例闭包）。
 */
const billboardLogicProto = createLogicProto<BillboardLogic>(componentLogicProto, {
    beforeRender: {
        value: function (this: BillboardLogic & ComponentLogicState, renderObject: RenderObject): void
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

            const cameraPos = mat4GetPosition(cameraMatrix);
            const yAxis = mat4GetAxisY(cameraMatrix);

            // 复制原矩阵并 lookAt 相机（保持位置，改变旋转）
            // 阶段 C-e：`Matrix4x4` 的 class 已删除，实例方法换成等价纯函数
            const newMatrix: Matrix4x4 = { __type__: 'Matrix4x4', ...mat4Copy(modelMatrix) };
            mat4LookAt(newMatrix, cameraPos, yAxis, newMatrix);

            const r_transformUniforms = reactive(transformUniforms);
            r_transformUniforms.u_modelMatrix = newMatrix;
            const itMatrix: Matrix4x4 = { __type__: 'Matrix4x4', ...mat4Copy(newMatrix) };
            mat4Invert(itMatrix, itMatrix);
            mat4Transpose(itMatrix, itMatrix);
            r_transformUniforms.u_ITModelMatrix = itMatrix;
        },
    },
});

/**
 * 工厂函数：BillboardLogic 的唯一创建入口（registerLogic 注册它）。
 *
 * @param data 组件数据（raw）
 */
export function billboardLogic(data: Billboard): BillboardLogic
{
    return setupComponentLogicState(Object.create(billboardLogicProto) as BillboardLogic & ComponentLogicState, data);
}

// 注册到 logic 分发表
registerLogic('Billboard', billboardLogic);
