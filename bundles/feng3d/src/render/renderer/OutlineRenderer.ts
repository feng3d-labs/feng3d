import { Camera } from "../../cameras/Camera";
import { CartoonComponent } from "../../component/CartoonComponent";
import { OutLineComponent } from "../../component/OutLineComponent";
import { RenderAtomic } from "../../renderer/data/RenderAtomic";
import { Shader } from "../../renderer/data/Shader";
import { CullFace } from "../../renderer/gl/enums/CullFace";
import { GL } from "../../renderer/gl/GL";
import { Scene } from "../../scene/Scene";

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
            var renderParams = this.renderAtomic.renderParams;
            renderParams.enableBlend = false;
            renderParams.cullFace = CullFace.FRONT;

            this.renderAtomic.shader = new Shader("outline");
        }
    }

    draw(gl: GL, scene: Scene, camera: Camera)
    {
        var unblenditems = scene.getPickCache(camera).unblenditems;

        this.init();

        for (var i = 0; i < unblenditems.length; i++)
        {
            var renderable = unblenditems[i];
            if (renderable.getComponent(OutLineComponent) || renderable.getComponent(CartoonComponent))
            {
                var renderAtomic = renderable.renderAtomic;
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
