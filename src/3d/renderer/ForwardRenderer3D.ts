import { Vector4 } from '../../math/geom/Vector4';
import { mathUtil } from '../../polyfill/MathUtil';
import { lazy, LazyObject } from '../../polyfill/Types';
import { Uniforms } from '../../renderer/data/Uniforms';
import { WebGLRenderer } from '../../renderer/WebGLRenderer';
import { Camera3D } from '../cameras/Camera3D';
import { Mesh3D } from '../core/Mesh3D';
import { Scene3D } from '../core/Scene3D';
import { LightPicker } from '../light/pickers/LightPicker';

/**
 * 前向渲染器
 */
export class ForwardRenderer
{
    /**
     * 渲染
     */
    draw(gl: WebGLRenderer, scene: Scene3D, camera: Camera3D)
    {
        const frustum = camera.frustum;
        const { blendItems, unblenditems } = scene.getComponentsInChildren('Mesh3D').reduce((pv: { blendItems: Mesh3D[], unblenditems: Mesh3D[] }, cv) =>
        {
            if (cv.isVisibleAndEnabled)
            {
                if (frustum.intersectsBox(cv.globalBounds))
                {
                    if (cv.useMaterial.renderParams.enableBlend)
                    {
                        pv.blendItems.push(cv);
                    }
                    else
                    {
                        pv.unblenditems.push(cv);
                    }
                }
            }

            return pv;
        }, { blendItems: [], unblenditems: [] });

        unblenditems.reverse();

        const uniforms: LazyObject<Uniforms> = <any>{};
        //
        uniforms.u_projectionMatrix = camera.projectionMatrix;
        uniforms.u_viewProjection = camera.viewProjection;
        uniforms.u_viewMatrix = camera.node3d.invertGlobalMatrix;
        uniforms.u_cameraMatrix = camera.node3d.globalMatrix;
        uniforms.u_cameraPos = camera.node3d.globalPosition;
        uniforms.u_skyBoxSize = camera.far / Math.sqrt(3);
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

            lightPicker.beforeRender(renderAtomic, renderable);

            gl.render(renderAtomic);
        });
    }
}

const lightPicker = new LightPicker();

/**
 * 前向渲染器
 */
export const forwardRenderer = new ForwardRenderer();
