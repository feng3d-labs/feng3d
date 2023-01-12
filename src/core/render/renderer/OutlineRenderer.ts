import { RenderAtomic } from '../../../renderer/data/RenderAtomic';
import { Shader } from '../../../renderer/data/Shader';
import { WebGLRenderer } from '../../../renderer/WebGLRenderer';
import { Camera } from '../../cameras/Camera';
import { CartoonComponent } from '../../component/CartoonComponent';
import { OutLineComponent } from '../../component/OutLineComponent';
import { Scene3D } from '../../../3d/Scene3D';

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

    draw(gl: WebGLRenderer, scene: Scene3D, camera: Camera)
    {
        const frustum = camera.frustum;
        const unblenditems = scene.getComponentsInChildren('Mesh3D').reduce((pv, cv) =>
        {
            if (cv.isVisibleAndEnabled)
            {
                if (frustum.intersectsBox(cv.worldBounds))
                {
                    if (!cv.useMaterial.renderParams.enableBlend)
                    {
                        pv.push(cv);
                    }
                }
            }

            return pv;
        }, []);

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
