import { Camera } from "../cameras/Camera";
import { Attribute } from "@feng3d/renderer";
import { Index } from "@feng3d/renderer";
import { RenderAtomic } from "@feng3d/renderer";
import { Shader } from "@feng3d/renderer";
import { CullFace } from "@feng3d/renderer";
import { GL } from "@feng3d/renderer";
import { Scene } from "../scene/Scene";
import { SkyBox } from "./SkyBox";

/**
 * 天空盒渲染器
 */
export class SkyBoxRenderer
{
    private renderAtomic: RenderAtomic;

    init()
    {
        if (!this.renderAtomic)
        {
            var renderAtomic = this.renderAtomic = new RenderAtomic();
            //八个顶点，32个number
            var vertexPositionData = [ //
                -1, 1, -1,//
                1, 1, -1, //
                1, 1, 1, //
                -1, 1, 1, //
                -1, -1, -1,//
                1, -1, -1, //
                1, -1, 1,//
                -1, -1, 1 //
            ];
            renderAtomic.attributes.a_position = new Attribute("a_position", vertexPositionData, 3);
            //6个面，12个三角形，36个顶点索引
            var indices = [ //
                0, 1, 2, 2, 3, 0, //
                6, 5, 4, 4, 7, 6, //
                2, 6, 7, 7, 3, 2, //
                4, 5, 1, 1, 0, 4, //
                4, 0, 3, 3, 7, 4, //
                2, 1, 5, 5, 6, 2 //
            ];
            renderAtomic.indexBuffer = new Index();
            renderAtomic.indexBuffer.indices = indices;
            //
            var renderParams = renderAtomic.renderParams;
            renderParams.cullFace = CullFace.NONE;
            //

            renderAtomic.shader = new Shader("skybox");
        }
    }

    /**
     * 绘制场景中天空盒
     * @param gl 
     * @param scene 场景
     * @param camera 摄像机
     */
    draw(gl: GL, scene: Scene, camera: Camera)
    {
        var skybox = scene.activeSkyBoxs[0];
        this.drawSkyBox(gl, skybox, scene, camera);
    }

    /**
     * 绘制天空盒
     * @param gl 
     * @param skybox 天空盒
     * @param camera 摄像机
     */
    drawSkyBox(gl: GL, skybox: SkyBox, scene: Scene, camera: Camera)
    {
        if (!skybox) return;

        this.init();

        //
        skybox.beforeRender(this.renderAtomic, scene, camera);

        //
        this.renderAtomic.uniforms.u_viewProjection = camera.viewProjection;
        this.renderAtomic.uniforms.u_viewMatrix = camera.node3d.worldToLocalMatrix
        this.renderAtomic.uniforms.u_cameraMatrix = camera.node3d.localToWorldMatrix;
        this.renderAtomic.uniforms.u_cameraPos = camera.node3d.worldPosition;
        this.renderAtomic.uniforms.u_skyBoxSize = camera.lens.far / Math.sqrt(3);

        gl.render(this.renderAtomic);
    }
}


/**
 * 天空盒渲染器
 */
export const skyboxRenderer = new SkyBoxRenderer();
