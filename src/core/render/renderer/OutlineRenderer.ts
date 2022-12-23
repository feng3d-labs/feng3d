import { RenderAtomic, Shader, WebGLRenderer } from '@feng3d/renderer';
import { Camera } from '../../cameras/Camera';
import { CartoonComponent } from '../../component/CartoonComponent';
import { OutLineComponent } from '../../component/OutLineComponent';
import { Scene } from '../../scene/Scene';

/**
 * 轮廓渲染器
 */
export class OutlineRenderer
{
    renderAtomic: RenderAtomic;

    init()
    {
        if (!this.renderAtomic)
        {
            this.renderAtomic = new RenderAtomic();
            const renderParams = this.renderAtomic.renderParams;
            renderParams.enableBlend = false;
            renderParams.cullFace = 'FRONT';

            this.renderAtomic.shader = new Shader({ shaderName: 'outline' });
        }
    }

    draw(gl: WebGLRenderer, scene: Scene, camera: Camera)
    {
        const unblenditems = scene.getPickCache(camera).unBlendItems;

        this.init();

        for (let i = 0; i < unblenditems.length; i++)
        {
            const renderable = unblenditems[i];
            if (renderable.getComponent(OutLineComponent) || renderable.getComponent(CartoonComponent))
            {
                const renderAtomic = renderable.renderAtomic;
                renderable.beforeRender(renderAtomic, scene, camera);

                this.renderAtomic.next = renderAtomic;

                gl.render(this.renderAtomic);
            }
        }
    }
}

/**
 * 轮廓渲染器
 */
export const outlineRenderer = new OutlineRenderer();
