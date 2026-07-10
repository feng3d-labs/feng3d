import { Vector4 } from '@feng3d/math';
import { BindingResource, RenderPass, RenderPassObject, Submit } from '@feng3d/webgpu';
import { cameraLogic } from '../../cameras/cameraLogic';
import type { Camera } from '../../cameras/Camera';
import { logic } from '@feng3d/reactivity';
import { renderableLogic } from '../../core/renderableLogic';
import type { Renderable } from '../../core/Renderable';
import { sceneLogic } from '../../scene/sceneLogic';
import type { Scene } from '../../scene/Scene';

/**
 * 前向渲染器
 */
export class ForwardRenderer
{
    /**
     * 渲染
     */
    draw(submit: Submit, scene: Scene, camera: Camera)
    {
        const sLogic = sceneLogic(scene);
        const blenditems = sLogic.getPickCache(camera).blenditems;
        const unblenditems = sLogic.getPickCache(camera).unblenditems;

        // cameraUniforms 是响应式 computed（CameraLogic.uniforms），其 .value 依赖
        // viewMatrix/lens 等，相机变换变化时自动失效。bindingResources 持有同一 computed 引用，
        // 上游 WGPUBufferBinding 会重新读取 .value 并上传到 GPU。
        const cameraUniforms = cameraLogic(camera).uniforms;
        const ctime = (Date.now() / 1000) % 3600;
        const globalUniforms: GlobalUniforms = {
            u_sceneAmbientColor: scene.ambientColor,
            _Time: new Vector4(ctime / 20, ctime, ctime * 2, ctime * 3)
        };

        unblenditems.concat(blenditems).forEach((renderable) =>
        {
            // 绘制
            const renderObject = renderableLogic(renderable).renderObject.value;

            const bindingResources = renderObject.bindingResources as { [key: string]: BindingResource };

            // ---- 注入相机 / 全局 uniform（按 WGSL 变量名键控） ----
            // transform / model 矩阵由 transformLogic.beforeRender 写入 bindingResources.transform。
            bindingResources.cameraUniforms = { value: cameraUniforms };
            bindingResources.globalUniforms = { value: globalUniforms };

            logic(renderable).beforeRender(renderObject, scene, camera);

            (((submit.commandEncoders[0].passEncoders[0] as RenderPass).renderPassObjects as RenderPassObject[])).push(renderObject);
        });
    }
}

/**
 * 前向渲染器
 */
export const forwardRenderer = new ForwardRenderer();
