import { Color4 } from '../../math/Color4';
import { Matrix4x4 } from '../../math/geom/Matrix4x4';
import { mathUtil } from '../../polyfill/MathUtil';
import { lazy, LazyObject } from '../../polyfill/Types';
import { Uniforms, Vec3 } from '../../renderer/data/Uniforms';
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
        _Time: Vec4;

        /**
         * （view矩阵）摄像机逆矩阵
         */
        u_viewMatrix: Mat4;

        /**
         * 投影矩阵
         */
        u_projectionMatrix: Mat4;

        /**
         * 全局投影矩阵
         */
        u_viewProjection: Mat4;

        /**
         * 摄像机矩阵
         */
        u_cameraMatrix: Mat4;
        /**
         * 摄像机位置
         */
        u_cameraPos: Vec3;
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

        const uniforms: LazyObject<Uniforms> = <any>{};
        //
        uniforms.u_projectionMatrix = camera.projectionMatrix.elements;
        uniforms.u_viewProjection = camera.viewProjection.elements;
        uniforms.u_viewMatrix = camera.node3d.invertGlobalMatrix.elements;
        uniforms.u_cameraMatrix = camera.node3d.globalMatrix.elements;
        uniforms.u_cameraPos = camera.node3d.globalPosition.toArray() as Vec3;
        uniforms.u_skyBoxSize = camera.far / Math.sqrt(3);
        uniforms.u_scaleByDepth = camera.getScaleByDepth(1);
        uniforms.u_sceneAmbientColor = scene.ambientColor;

        const ctime = (Date.now() / 1000) % 3600;
        uniforms._Time = [ctime / 20, ctime, ctime * 2, ctime * 3];

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
            {
                const u_modelMatrix = lazy.getValue(renderAtomic.uniforms.u_modelMatrix);
                const u_viewMatrix = lazy.getValue(renderAtomic.uniforms.u_viewMatrix);
                const matrix = new Matrix4x4(u_modelMatrix)
                matrix.append(u_viewMatrix);

                return matrix;
            }
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
