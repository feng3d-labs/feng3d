import { Vector4 } from '@feng3d/math';
import { lazy, mathUtil } from '@feng3d/polyfill';
import { BindingResource, RenderPass, RenderPassObject, Submit } from '@feng3d/webgpu';
import { Camera } from '../../cameras/Camera';
import { Scene } from '../../scene/Scene';

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
        const blenditems = scene.getPickCache(camera).blenditems;
        const unblenditems = scene.getPickCache(camera).unblenditems;

        const ctime = (Date.now() / 1000) % 3600;
        const globalUniforms: GlobalUniforms = {
            u_projectionMatrix: camera.lens.matrix,
            u_viewProjection: camera.viewProjection,
            u_viewMatrix: camera.transform.worldToLocalMatrix,
            u_cameraMatrix: camera.transform.localToWorldMatrix,
            u_cameraPos: camera.transform.worldPosition,
            u_skyBoxSize: camera.lens.far / Math.sqrt(3),
            u_scaleByDepth: camera.getScaleByDepth(1),
            u_sceneAmbientColor: scene.ambientColor,
            _Time: new Vector4(ctime / 20, ctime, ctime * 2, ctime * 3)
        };
        //

        unblenditems.concat(blenditems).forEach((renderable) =>
        {
            // 绘制
            const renderObject = renderable.renderObject;

            const bindingResources = renderObject.bindingResources as { [key: string]: BindingResource };

            bindingResources.globalUniforms = { value: globalUniforms };

            //
            const u_mvMatrix = lazy.getvalue(renderObject.uniforms.u_modelMatrix).clone().append(lazy.getvalue(globalUniforms.u_viewMatrix));
            const u_ITMVMatrix = lazy.getvalue(renderObject.uniforms.u_mvMatrix).clone().invert().transpose();

            bindingResources.modelUniforms = {
                value: {
                    u_mvMatrix: u_mvMatrix,
                    u_ITMVMatrix: u_ITMVMatrix,
                }
            };

            //
            renderObject.shaderMacro.RotationOrder = mathUtil.DefaultRotationOrder;

            renderable.beforeRender(renderObject, scene, camera);

            (((submit.commandEncoders[0].passEncoders[0] as RenderPass).renderPassObjects as RenderPassObject[])).push(renderObject);
        });
    }
}

/**
 * 前向渲染器
 */
export const forwardRenderer = new ForwardRenderer();
