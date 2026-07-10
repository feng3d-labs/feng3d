import { Vector3 } from '@feng3d/math';
import { logic as getLogic, reactive } from '@feng3d/reactivity';
import { RenderObject } from '@feng3d/webgpu';
import type { Camera } from '../cameras/Camera';
import { cameraLogic } from '../cameras/cameraLogic';
import { ComponentLogic, registerComponentLogic } from './componentLogic';
import { HoldSizeComponent } from './HoldSizeComponent';

declare module '@feng3d/reactivity'
{
    interface LogicMap
    {
        HoldSizeComponent: HoldSizeComponentLogic;
    }
}

/**
 * HoldSizeComponent 逻辑处理输出。
 *
 * 在 beforeRender 阶段后处理 renderObject 的 u_modelMatrix：
 * 根据相机距离计算 depthScale，把 model matrix 的 scale 分量乘以
 * depthScale * holdSize，使对象在屏幕上保持固定尺寸。
 *
 * 忠实于原始逻辑（原版直接改 _local2world 矩阵的 scale 分量）。
 */
export interface HoldSizeComponentLogic extends ComponentLogic
{
}

/**
 * 获取 HoldSizeComponent 的 logic。
 */
export function holdSizeComponentLogic(component: HoldSizeComponent): HoldSizeComponentLogic
{
    return getLogic(component);
}

function createHoldSizeComponentLogic(component: HoldSizeComponent): HoldSizeComponentLogic
{
    const holdSizeLogic: HoldSizeComponentLogic = {
        object3D: null as any,
        init() { /* no-op */ },
        beforeRender(renderObject: RenderObject)
        {
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
            const depthScale = getDepthScale(holdSizeLogic.object3D, camera);
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
        },
        dispose() { /* no-op */ },
    };

    return holdSizeLogic;
}

/**
 * 计算相机距离对应的 depthScale（与原始 _getDepthScale 一致）。
 */
function getDepthScale(object3D: any, camera: Camera): number
{
    const cameraObj3D = cameraLogic(camera).object3D;
    if (!cameraObj3D || !object3D) return 0;

    const cameraLocal2world = getLogic(cameraObj3D).local2world.value;
    const worldPos = getLogic(object3D).worldPosition.value;
    const distance = worldPos.subTo(cameraLocal2world.getPosition());
    if (distance.length === 0)
    {
        distance.x = 1;
    }
    const depth = distance.dot(cameraLocal2world.getAxisZ());
    let scale = cameraLogic(camera).getScaleByDepth(depth);
    // 限制在放大缩小100倍之间
    scale = Math.max(Math.min(100, scale), 0.01);

    return scale;
}

registerComponentLogic('HoldSizeComponent', (component) =>
{
    return createHoldSizeComponentLogic(component as HoldSizeComponent);
});
