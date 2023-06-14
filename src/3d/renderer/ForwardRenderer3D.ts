import { Color4 } from '../../math/Color4';
import { Matrix4x4 } from '../../math/geom/Matrix4x4';
import { Vector3 } from '../../math/geom/Vector3';
import { Vector4 } from '../../math/geom/Vector4';
import { mathUtil } from '../../polyfill/MathUtil';
import { lazy, LazyObject } from '../../polyfill/Types';
import { RenderAtomic } from '../../renderer/data/RenderAtomic';
import { Uniforms } from '../../renderer/data/Uniforms';
import { WebGLRenderer } from '../../renderer/WebGLRenderer';
import { Camera3D } from '../cameras/Camera3D';
import { Mesh3D } from '../core/Mesh3D';
import { Scene3D } from '../core/Scene3D';
import { LightPicker } from '../light/pickers/LightPicker';

declare module '../../renderer/data/Uniforms'
{
    interface Uniforms
    {
        /**
         * t(单位秒) 是自该初始化开始所经过的时间，4个分量分别是 (t/20, t, t*2, t*3)
         */
        _Time: Vector4;

        /**
         * （view矩阵）摄像机逆矩阵
         */
        u_viewMatrix: Matrix4x4;

        /**
         * 投影矩阵
         */
        u_projectionMatrix: Matrix4x4;

        /**
         * 全局投影矩阵
         */
        u_viewProjection: Matrix4x4;

        /**
         * 摄像机矩阵
         */
        u_cameraMatrix: Matrix4x4;
        /**
         * 摄像机位置
         */
        u_cameraPos: Vector3;
        /**
         * 模型-摄像机 矩阵
         */
        u_mvMatrix: Matrix4x4;

        /**
         * 模型-摄像机 逆转置矩阵，用于计算摄像机空间法线
         */
        u_ITMVMatrix: Matrix4x4;

        /**
         * 天空盒尺寸
         */
        u_skyBoxSize: number;

        /**
         * 单位深度映射到屏幕像素值
         */
        u_scaleByDepth: number;

        /**
         * 场景环境光
         */
        u_sceneAmbientColor: Color4;
    }
}

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

        const gloablRenderAtomic = new RenderAtomic();

        gloablRenderAtomic.shaderMacro.RotationOrder = mathUtil.DefaultRotationOrder;

        const uniforms: LazyObject<Uniforms> = gloablRenderAtomic.uniforms;
        //
        uniforms.u_projectionMatrix = camera.projectionMatrix;
        uniforms.u_viewProjection = camera.viewProjection;
        uniforms.u_viewMatrix = camera.entity.invertGlobalMatrix;
        uniforms.u_cameraMatrix = camera.entity.globalMatrix;
        uniforms.u_cameraPos = camera.entity.globalPosition;
        uniforms.u_skyBoxSize = camera.far / Math.sqrt(3);
        uniforms.u_scaleByDepth = camera.getScaleByDepth(1);

        uniforms.u_sceneAmbientColor = scene.ambientColor;

        //
        uniforms.u_mvMatrix = (uniforms: LazyObject<Uniforms>) =>
        {
            const modelMatrix = lazy.getValue(uniforms.u_modelMatrix, uniforms);
            const viewMatrix = lazy.getValue(uniforms.u_viewMatrix, uniforms);

            return modelMatrix.clone().append(viewMatrix);
        };
        uniforms.u_ITMVMatrix = (uniforms: LazyObject<Uniforms>) =>
        {
            const mvMatrix = lazy.getValue(uniforms.u_mvMatrix, uniforms);

            return mvMatrix.invert().transpose();
        };

        const ctime = (Date.now() / 1000) % 3600;
        uniforms._Time = new Vector4(ctime / 20, ctime, ctime * 2, ctime * 3);

        unblenditems.concat(blendItems).forEach((renderable) =>
        {
            // 绘制
            const renderAtomic = renderable.renderAtomic;

            renderable.beforeRender(renderAtomic, scene, camera);

            const lightRenderAtomic = lightPicker.beforeRender(renderable);
            renderAtomic.next = lightRenderAtomic;

            gloablRenderAtomic.next = renderAtomic;

            gl.render(gloablRenderAtomic);
        });
    }
}

const lightPicker = new LightPicker();

/**
 * 前向渲染器
 */
export const forwardRenderer = new ForwardRenderer();
