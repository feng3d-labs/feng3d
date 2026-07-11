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
        draw: { __type__: 'DrawVertex' as const, vertexCount: 36, instanceCount: 1, firstVertex: 0, firstInstance: 0 },
        bindingResources: {},
    };

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
        const activeSkyBoxs = logic(scene).activeSkyBoxs;
        this.drawSkyBox(submit, activeSkyBoxs[0], scene, camera);
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

        (((submit.commandEncoders[0].passEncoders[0] as RenderPass).renderPassObjects as RenderPassObject[])).push(this.renderObject);
    }
}

/**
 * 天空盒渲染器
 */
export const skyboxRenderer = new SkyBoxRenderer();
