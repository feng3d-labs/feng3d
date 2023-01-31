import { Component3D } from '../../3d/core/Component3D';
import { RenderContext3D } from '../../3d/core/RenderContext3D';
import { IEvent } from '../../event/IEvent';

/**
 * 2D渲染器
 */
export class Renderer2D extends Component3D
{
    init(): void
    {
        super.init();

        this.emitter.on('beforeRender', this._onBeforeRender, this);
    }

    dispose(): void
    {
        this.emitter.off('beforeRender', this._onBeforeRender, this);

        super.dispose();
    }

    private _onBeforeRender(event: IEvent<RenderContext3D>)
    {
        this.draw(event.data);
    }

    /**
     * 渲染
     */
    draw(data: RenderContext3D)
    {
        const { webGLRenderer, scene, viewRect, mousePos } = data;

        const canvasList = scene.getComponentsInChildren('Canvas').filter((v) => v.isVisibleAndEnabled);
        canvasList.forEach((canvas) =>
        {
            canvas.layout(viewRect.width, viewRect.height);

            // 更新鼠标射线
            canvas.calcMouseRay3D(mousePos);

            const renderables = canvas.getComponentsInChildren('CanvasRenderer').filter((v) => v.isVisibleAndEnabled);
            renderables.forEach((renderable) =>
            {
                // 绘制
                const renderAtomic = renderable.renderAtomic;

                renderAtomic.uniforms.u_viewProjection = canvas.projection.elements;

                renderable.beforeRender(renderAtomic, null, null);

                webGLRenderer.render(renderAtomic);
            });
        });
    }
}
