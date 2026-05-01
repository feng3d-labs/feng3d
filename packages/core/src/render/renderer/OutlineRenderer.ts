import { CullFace, Shader, WebGLRenderer } from '@feng3d/renderer';
import { RenderObject } from '@feng3d/webgpu';
import { Camera } from '../../cameras/Camera';
import { CartoonComponent } from '../../component/CartoonComponent';
import { OutLineComponent } from '../../component/OutLineComponent';
import { Scene } from '../../scene/Scene';

/**
 * 轮廓渲染器
 */
export class OutlineRenderer
{
    renderObject: RenderObject;

    init()
    {
        if (!this.renderObject)
        {
            this.renderObject = new RenderObject();
            const renderParams = this.renderObject.renderParams;
            renderParams.enableBlend = false;
            renderParams.cullFace = CullFace.FRONT;

            this.renderObject.shader = new Shader({ shaderName: 'outline' });
        }
    }

    draw(gl: WebGLRenderer, scene: Scene, camera: Camera)
    {
        const unblenditems = scene.getPickCache(camera).unblenditems;

        this.init();

        for (let i = 0; i < unblenditems.length; i++)
        {
            const renderable = unblenditems[i];
            if (renderable.getComponent(OutLineComponent) || renderable.getComponent(CartoonComponent))
            {
                const renderObject = renderable.renderObject;
                renderable.beforeRender(renderObject, scene, camera);

                this.renderObject.next = renderObject;

                gl.render(this.renderObject);
            }
        }
    }
}

/**
 * 轮廓渲染器
 */
export const outlineRenderer = new OutlineRenderer();
