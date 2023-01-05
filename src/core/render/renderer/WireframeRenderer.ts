import { Color4 } from '../../../math/Color4';
import { lazy } from '../../../polyfill/Types';
import { ElementBuffer } from '../../../renderer/data/ElementBuffer';
import { RenderAtomic } from '../../../renderer/data/RenderAtomic';
import { Shader } from '../../../renderer/data/Shader';
import { WebGLRenderer } from '../../../renderer/WebGLRenderer';
import { Camera } from '../../cameras/Camera';
import { WireframeComponent } from '../../component/WireframeComponent';
import { MeshRenderer } from '../../core/MeshRenderer';
import { Renderer } from '../../core/Renderer';
import { Scene } from '../../scene/Scene';

declare global
{
    export interface MixinsRenderAtomic
    {
        /**
         * 顶点索引缓冲
         */
        wireframeindexBuffer: ElementBuffer;

        wireframeShader: Shader;
    }
}

export class WireframeRenderer
{
    private renderAtomic: RenderAtomic;

    init()
    {
        if (!this.renderAtomic)
        {
            this.renderAtomic = new RenderAtomic();
            const renderParams = this.renderAtomic.renderParams;
            renderParams.renderMode = 'LINES';
            // renderParams.depthMask = false;
        }
    }

    /**
     * 渲染
     */
    draw(renderer: WebGLRenderer, scene: Scene, camera: Camera)
    {
        const frustum = camera.frustum;
        const unblenditems = scene.getComponentsInChildren(MeshRenderer).reduce((pv, cv) =>
        {
            if (cv.isVisibleAndEnabled)
            {
                if (frustum.intersectsBox(cv.selfWorldBounds))
                {
                    if (!cv.material.renderParams.enableBlend)
                    {
                        pv.push(cv);
                    }
                }
            }

            return pv;
        }, []);

        const wireframes = unblenditems.reduce((pv: { wireframe: WireframeComponent, renderable: Renderer }[], cv) =>
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
            this.drawObject3D(renderer, element.renderable, scene, camera, element.wireframe.color); //
        });
    }

    /**
     * 绘制3D对象
     */
    drawObject3D(renderer: WebGLRenderer, renderable: Renderer, scene: Scene, camera: Camera, wireframeColor = new Color4())
    {
        const renderAtomic = renderable.renderAtomic;
        renderable.beforeRender(renderAtomic, scene, camera);

        const renderMode = lazy.getValue(renderAtomic.renderParams.renderMode);
        if (renderMode === 'POINTS'
            || renderMode === 'LINES'
            || renderMode === 'LINE_LOOP'
            || renderMode === 'LINE_STRIP'
        )
        { return; }

        this.init();

        const uniforms = this.renderAtomic.uniforms;
        //
        uniforms.u_projectionMatrix = camera.lens.matrix;
        uniforms.u_viewProjection = camera.viewProjection;
        uniforms.u_viewMatrix = camera.node3d.globalInvertMatrix;
        uniforms.u_cameraMatrix = camera.node3d.globalMatrix;
        uniforms.u_cameraPos = camera.node3d.worldPosition;
        uniforms.u_skyBoxSize = camera.lens.far / Math.sqrt(3);
        uniforms.u_scaleByDepth = camera.getScaleByDepth(1);

        //
        this.renderAtomic.next = renderAtomic;

        //
        const oldIndexBuffer = renderAtomic.index;
        if (oldIndexBuffer.array.length < 3) return;
        if (!renderAtomic.wireframeindexBuffer || renderAtomic.wireframeindexBuffer.array.length !== 2 * oldIndexBuffer.array.length)
        {
            const wireframeindices: number[] = [];
            const indices = lazy.getValue(oldIndexBuffer.array);
            for (let i = 0; i < indices.length; i += 3)
            {
                wireframeindices.push(
                    indices[i], indices[i + 1],
                    indices[i], indices[i + 2],
                    indices[i + 1], indices[i + 2],
                );
            }
            renderAtomic.wireframeindexBuffer = { array: wireframeindices };
        }
        renderAtomic.wireframeShader = renderAtomic.wireframeShader || new Shader({ shaderName: 'wireframe' });
        this.renderAtomic.index = renderAtomic.wireframeindexBuffer;

        this.renderAtomic.uniforms.u_wireframeColor = wireframeColor;

        //
        this.renderAtomic.shader = renderAtomic.wireframeShader;
        renderer.render(this.renderAtomic);
        this.renderAtomic.shader = null;
        //
    }
}

/**
 * 线框渲染器
 */
export const wireframeRenderer = new WireframeRenderer();
