import { Attribute, CullFace, Index, Shader, WebGLRenderer } from '@feng3d/renderer';
import { RenderObject } from '@feng3d/webgpu';
import { Camera } from '../cameras/Camera';
import { Scene } from '../scene/Scene';
import { SkyBox } from './SkyBox';

/**
 * 天空盒渲染器
 */
export class SkyBoxRenderer
{
    private renderObject: RenderObject;

    init()
    {
        if (!this.renderObject)
        {
            const renderObject = this.renderObject = new RenderObject();
            // 八个顶点，32个number
            const vertexPositionData = [ //
                -1, 1, -1, //
                1, 1, -1, //
                1, 1, 1, //
                -1, 1, 1, //
                -1, -1, -1, //
                1, -1, -1, //
                1, -1, 1, //
                -1, -1, 1 //
            ];
            renderObject.attributes.a_position = new Attribute({ name: 'a_position', data: vertexPositionData, size: 3 });
            // 6个面，12个三角形，36个顶点索引
            const indices = [ //
                0, 1, 2, 2, 3, 0, //
                6, 5, 4, 4, 7, 6, //
                2, 6, 7, 7, 3, 2, //
                4, 5, 1, 1, 0, 4, //
                4, 0, 3, 3, 7, 4, //
                2, 1, 5, 5, 6, 2 //
            ];
            renderObject.index = new Index();
            renderObject.index.indices = indices;
            //
            const renderParams = renderObject.renderParams;
            renderParams.cullFace = CullFace.NONE;
            //

            renderObject.shader = new Shader({ shaderName: 'skybox' });
        }
    }

    /**
     * 绘制场景中天空盒
     * @param renderer
     * @param scene 场景
     * @param camera 摄像机
     */
    draw(renderer: WebGLRenderer, scene: Scene, camera: Camera)
    {
        const skybox = scene.activeSkyBoxs[0];
        this.drawSkyBox(renderer, skybox, scene, camera);
    }

    /**
     * 绘制天空盒
     * @param renderer
     * @param skybox 天空盒
     * @param camera 摄像机
     */
    drawSkyBox(renderer: WebGLRenderer, skybox: SkyBox, scene: Scene, camera: Camera)
    {
        if (!skybox) return;

        this.init();

        //
        skybox.beforeRender(this.renderObject, scene, camera);

        //
        this.renderObject.uniforms.u_viewProjection = camera.viewProjection;
        this.renderObject.uniforms.u_viewMatrix = camera.transform.worldToLocalMatrix;
        this.renderObject.uniforms.u_cameraMatrix = camera.transform.localToWorldMatrix;
        this.renderObject.uniforms.u_cameraPos = camera.transform.worldPosition;
        this.renderObject.uniforms.u_skyBoxSize = camera.lens.far / Math.sqrt(3);

        renderer.render(this.renderObject);
    }
}

/**
 * 天空盒渲染器
 */
export const skyboxRenderer = new SkyBoxRenderer();
