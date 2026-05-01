import { Vector4 } from '@feng3d/math';
import { LazyObject, lazy, mathUtil } from '@feng3d/polyfill';
import { Uniforms } from '@feng3d/renderer';
import { RenderPass, RenderPassObject, Submit } from '@feng3d/webgpu';
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

        const uniforms: LazyObject<Uniforms> = <any>{};
        //
        uniforms.u_projectionMatrix = camera.lens.matrix;
        uniforms.u_viewProjection = camera.viewProjection;
        uniforms.u_viewMatrix = camera.transform.worldToLocalMatrix;
        uniforms.u_cameraMatrix = camera.transform.localToWorldMatrix;
        uniforms.u_cameraPos = camera.transform.worldPosition;
        uniforms.u_skyBoxSize = camera.lens.far / Math.sqrt(3);
        uniforms.u_scaleByDepth = camera.getScaleByDepth(1);
        uniforms.u_sceneAmbientColor = scene.ambientColor;

        const ctime = (Date.now() / 1000) % 3600;
        uniforms._Time = new Vector4(ctime / 20, ctime, ctime * 2, ctime * 3);

        unblenditems.concat(blenditems).forEach((renderable) =>
        {
            // 绘制
            const renderObject = renderable.renderObject;

            for (const key in uniforms)
            {
                renderObject.uniforms[key] = uniforms[key];
            }
            //
            renderObject.uniforms.u_mvMatrix = () =>
                lazy.getvalue(renderObject.uniforms.u_modelMatrix).clone().append(lazy.getvalue(renderObject.uniforms.u_viewMatrix));
            renderObject.uniforms.u_ITMVMatrix = () =>
                lazy.getvalue(renderObject.uniforms.u_mvMatrix).clone().invert().transpose();

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
