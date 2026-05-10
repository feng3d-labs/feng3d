import { Color4 } from '@feng3d/math';
import { Index, Shader } from '@feng3d/renderer';
import { BindingResource, RenderObject, RenderPass, RenderPassObject, Submit } from '@feng3d/webgpu';
import { Camera } from '../../cameras/Camera';
import { WireframeComponent } from '../../component/WireframeComponent';
import { Renderable } from '../../core/Renderable';
import { Scene } from '../../scene/Scene';

declare global
{
    export interface MixinsRenderObject
    {
        /**
         * 顶点索引缓冲
         */
        wireframeindexBuffer: Index;

        wireframeShader: Shader;
    }
}

export class WireframeRenderer
{
    /**
     * 渲染
     */
    draw(submit: Submit, scene: Scene, camera: Camera)
    {
        const unblenditems = scene.getPickCache(camera).unblenditems;

        const wireframes = unblenditems.reduce((pv: { wireframe: WireframeComponent, renderable: Renderable }[], cv) =>
        {
            const wireframe = cv.getComponent(WireframeComponent); if (wireframe) pv.push({ wireframe, renderable: cv });

            return pv;
        }, []);

        if (wireframes.length === 0)
        {
            return;
        }

        wireframes.forEach((element) =>
        {
            this.drawGameObject(submit, element.renderable, scene, camera, element.wireframe.color); //
        });
    }

    /**
     * 绘制3D对象
     */
    drawGameObject(submit: Submit, renderable: Renderable, scene: Scene, camera: Camera, wireframeColor = new Color4())
    {
        const renderObject = renderable.renderObject.value;

        const renderMode = renderObject.pipeline.primitive.topology;
        if (renderMode === 'point-list'
            || renderMode === 'line-list'
            || renderMode === 'line-strip'
        )
        { return; }

        const cameraUniforms = camera.getUniforms();

        const bindingResources = renderObject.bindingResources as { [key: string]: BindingResource };

        bindingResources.cameraUniforms = { value: cameraUniforms };

        //
        const indices = renderObject.indices;
        if (indices.length < 3) return;

        const wireframeindices = new Uint16Array(indices.length * 2);
        for (let i = 0; i < indices.length; i += 3)
        {
            wireframeindices[i * 2] = indices[i];
            wireframeindices[i * 2 + 1] = indices[i + 1];
            wireframeindices[i * 2 + 2] = indices[i];
            wireframeindices[i * 2 + 3] = indices[i + 2];
            wireframeindices[i * 2 + 4] = indices[i + 1];
            wireframeindices[i * 2 + 5] = indices[i + 2];
        }

        renderObject.wireframeShader = renderObject.wireframeShader || new Shader({ shaderName: 'wireframe' });

        const newRenderObject: RenderObject = {
            ...renderObject,
            indices: wireframeindices,
            bindingResources: {
                ...renderObject.bindingResources,
                wireframe: { value: { u_wireframeColor: wireframeColor } }
            },
            pipeline: {
                ...renderObject.pipeline,
                fragment: {
                    ...renderObject.pipeline.fragment,
                    code: getWireframeShaderCode(),
                }
            },
        };

        ((submit.commandEncoders[0].passEncoders[0] as RenderPass).renderPassObjects as RenderPassObject[]).push(newRenderObject);
        //
    }
}

/**
 * 线框渲染器
 */
export const wireframeRenderer = new WireframeRenderer();
