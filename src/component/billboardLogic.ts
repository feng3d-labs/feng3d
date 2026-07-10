import { registerLogic } from "@feng3d/reactivity";
import { logic as getLogic, reactive } from '@feng3d/reactivity';
import { RenderObject } from '@feng3d/webgpu';
import type { Camera } from '../cameras/Camera';
import { cameraLogic } from '../cameras/cameraLogic';
import { ComponentLogic, } from './componentLogic';
import { BillboardComponent } from './BillboardComponent';

declare module '@feng3d/reactivity'
{
    interface LogicMap
    {
        BillboardComponent: BillboardComponentLogic;
    }
}

/**
 * BillboardComponent 逻辑处理输出。
 *
 * 在 beforeRender 阶段后处理 renderObject 的 u_modelMatrix：
 * 让对象始终看向相机（lookAt 相机位置，up 轴用相机 local2world 的 Y 轴）。
 *
 * 忠实于原始逻辑（原版直接改 _local2world.lookAt(cameraPos, yAxis)）。
 */
export interface BillboardComponentLogic extends ComponentLogic
{
}

/**
 * 获取 BillboardComponent 的 logic。
 */
export function billboardComponentLogic(component: BillboardComponent): BillboardComponentLogic
{
    return getLogic(component);
}

function createBillboardComponentLogic(component: BillboardComponent): BillboardComponentLogic
{
    const billboardLogic = {
        object3D: null as any,
        init() { /* no-op */ },
        beforeRender(renderObject: RenderObject)
        {
            const camera = component.camera;
            if (!camera) return;

            // 从 renderObject 的 transform uniform 取已写入的 u_modelMatrix（transform.beforeRender 先执行）
            const bindingResources = renderObject.bindingResources as Record<string, any>;
            const transformBinding = bindingResources?.transform;
            if (!transformBinding?.value) return;

            const transformUniforms = transformBinding.value as any;
            const modelMatrix = transformUniforms.u_modelMatrix;
            if (!modelMatrix) return;

            const cameraObj3D = cameraLogic(camera).object3D;
            if (!cameraObj3D || !billboardLogic.object3D) return;

            const cameraLocal2world = getLogic(cameraObj3D).local2world.value;
            const cameraPos = getLogic(cameraObj3D).worldPosition.value;
            const yAxis = cameraLocal2world.getAxisY();

            // 复制原矩阵并 lookAt 相机（保持位置，改变旋转）
            const newMatrix = modelMatrix.clone();
            newMatrix.lookAt(cameraPos, yAxis);

            const r_transformUniforms = reactive(transformUniforms);
            r_transformUniforms.u_modelMatrix = newMatrix;
            r_transformUniforms.u_ITModelMatrix = newMatrix.clone().invert().transpose();
        },
        dispose() { /* no-op */ },
    };

    return billboardLogic as any;
}

registerLogic('BillboardComponent', (component) =>
{
    return createBillboardComponentLogic(component as BillboardComponent);
});
