import { RenderAtomic } from '../../renderer/data/RenderAtomic';
import { Shader } from '../../renderer/data/Shader';
import { WebGLRenderer } from '../../renderer/WebGLRenderer';
import { $set } from '../../serialization/Serialization';
import { Camera3D } from '../cameras/Camera3D';
import { Scene3D } from '../core/Scene3D';
import { SkyBox3D } from './SkyBox3D';

/**
 * 天空盒渲染器
 */
export class SkyBox3DRenderer
{
    private renderAtomic: RenderAtomic;

    init()
    {
        if (!this.renderAtomic)
        {
            const renderAtomic = this.renderAtomic = new RenderAtomic();
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
            renderAtomic.attributes.a_position = { array: vertexPositionData, itemSize: 3 };
            // 6个面，12个三角形，36个顶点索引
            const indices = [ //
                0, 1, 2, 2, 3, 0, //
                6, 5, 4, 4, 7, 6, //
                2, 6, 7, 7, 3, 2, //
                4, 5, 1, 1, 0, 4, //
                4, 0, 3, 3, 7, 4, //
                2, 1, 5, 5, 6, 2 //
            ];
            renderAtomic.index = { array: indices };
            //
            const renderParams = renderAtomic.renderParams;
            renderParams.cullFace = 'NONE';
            //

            renderAtomic.shader = $set(new Shader(), { shaderName: 'skybox' });
        }
    }

    /**
     * 绘制场景中天空盒
     * @param renderer
     * @param scene 场景
     * @param camera 摄像机
     */
    draw(renderer: WebGLRenderer, scene: Scene3D, camera: Camera3D)
    {
        const skybox = scene.getComponentsInChildren('SkyBox').filter((sb) => sb.isVisibleAndEnabled)[0];
        this.drawSkyBox(renderer, skybox, scene, camera);
    }

    /**
     * 绘制天空盒
     * @param renderer
     * @param skybox 天空盒
     * @param camera 摄像机
     */
    drawSkyBox(renderer: WebGLRenderer, skybox: SkyBox3D, scene: Scene3D, camera: Camera3D)
    {
        if (!skybox) return;

        this.init();

        //
        skybox.beforeRender(this.renderAtomic, scene, camera);

        //
        this.renderAtomic.uniforms.u_viewProjection = camera.viewProjection;
        this.renderAtomic.uniforms.u_viewMatrix = camera.node3d.invertGlobalMatrix;
        this.renderAtomic.uniforms.u_cameraMatrix = camera.node3d.globalMatrix;
        this.renderAtomic.uniforms.u_cameraPos = camera.node3d.globalPosition;
        this.renderAtomic.uniforms.u_skyBoxSize = camera.far / Math.sqrt(3);

        renderer.render(this.renderAtomic);
    }
}

/**
 * 天空盒渲染器
 */
export const skyboxRenderer = new SkyBox3DRenderer();
