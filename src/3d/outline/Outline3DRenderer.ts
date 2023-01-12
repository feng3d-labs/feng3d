import { Camera3D } from '../../core/cameras/Camera3D';
import { RenderAtomic } from '../../renderer/data/RenderAtomic';
import { Shader } from '../../renderer/data/Shader';
import { WebGLRenderer } from '../../renderer/WebGLRenderer';
import { Scene3D } from '../Scene3D';
import { Cartoon3D } from './Cartoon3D';
import { OutLine3D } from './OutLine3D';

/**
 * 轮廓渲染器
 */
export class Outline3DRenderer
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

    draw(gl: WebGLRenderer, scene: Scene3D, camera: Camera3D)
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
            if (renderable.getComponent(OutLine3D) || renderable.getComponent(Cartoon3D))
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
export const outlineRenderer = new Outline3DRenderer();
