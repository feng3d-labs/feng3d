import { BindingResource, RenderObject, RenderPass, RenderPassObject, Submit } from '@feng3d/webgpu';
import type { Camera } from '../cameras/Camera';
import { logic } from '@feng3d/reactivity';
import { skyboxVertexWGSL } from '../shaders/skybox.vertex.wgsl';
import { skyboxFragmentWGSL } from '../shaders/skybox.fragment.wgsl';
import type { Scene } from '../scene/Scene';
import { SkyBox } from './SkyBox';

/**
 * 天空盒渲染器
 */
export class SkyBoxRenderer
{
    private renderObject: RenderObject = {
        pipeline: {
            vertex: { wgsl: skyboxVertexWGSL, entryPoint: 'main' },
            fragment: { wgsl: skyboxFragmentWGSL, entryPoint: 'main' },
            primitive: { cullFace: 'none' },
            depthStencil: { depthWriteEnabled: false, depthCompare: 'less-equal' }
        },
        vertices: {
            a_position: {
                data: new Float32Array([ //
                    -1, 1, -1, //
                    1, 1, -1, //
                    1, 1, 1, //
                    -1, 1, 1, //
                    -1, -1, -1, //
                    1, -1, -1, //
                    1, -1, 1, //
                    -1, -1, 1 //
                ]),
                format: "float32x3"
            } },
        indices: new Uint16Array([ //
            0, 1, 2, 2, 3, 0, //
            6, 5, 4, 4, 7, 6, //
            2, 6, 7, 7, 3, 2, //
            4, 5, 1, 1, 0, 4, //
            4, 0, 3, 3, 7, 4, //
            2, 1, 5, 5, 6, 2 //
        ]) };

    init()
    {
    }

    /**
     * 绘制场景中天空盒
     * @param renderer
     * @param scene 场景
     * @param camera 摄像机
     */
    draw(submit: Submit, scene: Scene, camera: Camera)
    {
        const skybox = logic(scene).activeSkyBoxs[0];
        this.drawSkyBox(submit, skybox, scene, camera);
    }

    /**
     * 绘制天空盒
     * @param renderer
     * @param skybox 天空盒
     * @param camera 摄像机
     */
    drawSkyBox(submit: Submit, skybox: SkyBox, scene: Scene, camera: Camera)
    {
        if (!skybox) return;

        this.init();

        //
        logic(skybox).beforeRender(this.renderObject, scene, camera);

        const cameraUniforms = logic(camera).uniforms;
        const bindingResources = this.renderObject.bindingResources as { [key: string]: BindingResource };

        bindingResources.cameraUniforms = { value: cameraUniforms };

        //
        (((submit.commandEncoders[0].passEncoders[0] as RenderPass).renderPassObjects as RenderPassObject[])).push(this.renderObject);
    }
}

/**
 * 天空盒渲染器
 */
export const skyboxRenderer = new SkyBoxRenderer();
