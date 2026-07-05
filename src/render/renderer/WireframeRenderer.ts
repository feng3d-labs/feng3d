import { Color4 } from '@feng3d/math';
import { RenderObject, RenderPass, RenderPassObject, Submit } from '@feng3d/webgpu';
import { Camera } from '../../cameras/Camera';
import { WireframeComponent } from '../../component/WireframeComponent';
import { getComponent } from '../../component/componentQuery';
import { renderableLogic } from '../../core/renderableLogic';
import type { Renderable } from '../../core/Renderable';
import { sceneLogic } from '../../scene/sceneLogic';
import type { Scene } from '../../scene/Scene';

/**
 * 线框渲染器
 *
 * TODO: 待接入 WebGPU 渲染路径（原依赖已移除的 shader WebGL 兼容机制）。
 */
export class WireframeRenderer
{
    /**
     * 渲染
     */
    draw(_submit: Submit, scene: Scene, camera: Camera)
    {
        const unblenditems = sceneLogic(scene).getPickCache(camera).unblenditems;

        const wireframes = unblenditems.reduce((pv: { wireframe: WireframeComponent, renderable: Renderable }[], cv) =>
        {
            const wireframe = getComponent(renderableLogic(cv).object3D, { __type__: 'WireframeComponent' } as any) as WireframeComponent;
            if (wireframe) pv.push({ wireframe, renderable: cv });

            return pv;
        }, []);

        if (wireframes.length === 0)
        {
            return;
        }

        wireframes.forEach((element) =>
        {
            this.drawObject3D(element.renderable, element.wireframe.color as any);
        });
    }

    /**
     * 绘制3D对象
     */
    drawObject3D(renderable: Renderable, wireframeColor = new Color4())
    {
        const renderObject = renderableLogic(renderable).renderObject.value;

        const renderMode = renderObject.pipeline.primitive.topology;
        if (renderMode === 'point-list'
            || renderMode === 'line-list'
            || renderMode === 'line-strip'
        )
        { return; }

        const indices = renderObject.indices;
        if (!indices || indices.length < 3) return;

        // TODO: 使用线框材质重新绘制（原依赖已移除的 shader 机制）
        void wireframeColor;
    }
}

/**
 * 线框渲染器
 */
export const wireframeRenderer = new WireframeRenderer();
