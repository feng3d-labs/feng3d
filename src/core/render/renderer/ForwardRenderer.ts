import { Vector4 } from '../../../math/geom/Vector4';
import { mathUtil } from '../../../polyfill/MathUtil';
import { LazyObject, lazy } from '../../../polyfill/Types';
import { Uniforms } from '../../../renderer/data/Uniform';
import { WebGLRenderer } from '../../../renderer/WebGLRenderer';
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
    draw(gl: WebGLRenderer, scene: Scene, camera: Camera)
    {
        const blendItems = scene.getPickCache(camera).blendItems;
        const unblenditems = scene.getPickCache(camera).unBlendItems;

        const uniforms: LazyObject<Uniforms> = <any>{};
        //
        uniforms.u_projectionMatrix = camera.lens.matrix;
        uniforms.u_viewProjection = camera.viewProjection;
        uniforms.u_viewMatrix = camera.entity.globalInvertMatrix;
        uniforms.u_cameraMatrix = camera.entity.globalMatrix;
        uniforms.u_cameraPos = camera.entity.worldPosition;
        uniforms.u_skyBoxSize = camera.lens.far / Math.sqrt(3);
        uniforms.u_scaleByDepth = camera.getScaleByDepth(1);
        uniforms.u_sceneAmbientColor = scene.ambientColor;

        const ctime = (Date.now() / 1000) % 3600;
        uniforms._Time = new Vector4(ctime / 20, ctime, ctime * 2, ctime * 3);

        unblenditems.concat(blendItems).forEach((renderable) =>
        {
            // 绘制
            const renderAtomic = renderable.renderAtomic;

            for (const key in uniforms)
            {
                renderAtomic.uniforms[key] = uniforms[key];
            }
            //
            renderAtomic.uniforms.u_mvMatrix = () =>
                lazy.getValue(renderAtomic.uniforms.u_modelMatrix).clone().append(lazy.getValue(renderAtomic.uniforms.u_viewMatrix));
            renderAtomic.uniforms.u_ITMVMatrix = () =>
                lazy.getValue(renderAtomic.uniforms.u_mvMatrix).clone().invert().transpose();

            renderAtomic.shaderMacro.RotationOrder = mathUtil.DefaultRotationOrder;

            renderable.beforeRender(renderAtomic, scene, camera);

            gl.render(renderAtomic);
        });
    }
}

/**
 * 前向渲染器
 */
export const forwardRenderer = new ForwardRenderer();
