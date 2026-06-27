import { Color4 } from '@feng3d/math';
import { Index, Shader } from '@feng3d/renderer';
import { RenderObject, RenderPass, RenderPassObject, Submit } from '@feng3d/webgpu';
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
        wireframeindexBuffer?: Index;

        wireframeShader?: Shader;
    }
}

export class WireframeRenderer
{
    private renderObject = new RenderObject();

    init()
    {
        if (!this.renderObject.shader)
        {
            this.renderObject.shader = new Shader({ shaderName: 'wireframe' });
        }
    }

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

        this.init();

        wireframes.forEach((element) =>
        {
            this.drawGameObject(submit, element.renderable, scene, camera, element.wireframe.color);
        });
    }

    /**
     * 绘制3D对象
     */
    drawGameObject(_submit: Submit, renderable: Renderable, _scene: Scene, _camera: Camera, wireframeColor = new Color4())
    {
        const renderObject = renderable.renderObject.value;

        const renderMode = renderObject.pipeline.primitive.topology;
        if (renderMode === 'point-list'
            || renderMode === 'line-list'
            || renderMode === 'line-strip'
        )
        { return; }

        const indices = renderObject.indices;
        if (!indices || indices.length < 3) return;

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

        const newRenderObject = Object.assign({}, renderObject, {
            indices: wireframeindices,
            shader: renderObject.wireframeShader,
            uniforms: { ...renderObject.uniforms, u_wireframeColor: wireframeColor }
        }) as RenderObject;

        ((_submit.commandEncoders[0].passEncoders[0] as RenderPass).renderPassObjects as RenderPassObject[]).push(newRenderObject);
    }
}

/**
 * 线框渲染器
 */
export const wireframeRenderer = new WireframeRenderer();
