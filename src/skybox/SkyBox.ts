import { computed, logic, reactive, registerLogic } from "@feng3d/reactivity";
import { RenderObject, TextureView } from "@feng3d/webgpu";
import { Camera } from "../cameras/Camera";
import type { Component3D } from '../component/Component';
import { Component3DLogic } from '../component/Component';
import { Scene } from "../scene/Scene";
import { skyboxWGSL } from "../shaders/skybox.vertex.wgsl";
import { TextureCube } from '../textures/TextureCube';

declare module '../component/Component'
{
    export interface ComponentMap
    {
        SkyBox: SkyBox;
    }
}

/**
 * SkyBox（纯数据接口）。
 */
export interface SkyBox extends Component3D
{
    readonly __type__: 'SkyBox';
    readonly s_skyboxTexture: TextureCube;
}

/**
 * 创建 SkyBox 实例。
 */
export function createSkyBox(): SkyBox
{
    return {
        __type__: 'SkyBox',
        s_skyboxTexture: TextureCube.default,
    };
}

declare module '@feng3d/reactivity'
{
    interface LogicMap
    {
        SkyBox: SkyBoxLogic;
    }
}

/**
 * SkyBox 逻辑处理类。
 *
 * beforeRender 将天空盒纹理写入 renderObject.bindingResources。
 */
export class SkyBoxLogic extends Component3DLogic
{
    constructor(skybox: SkyBox)
    {
        super(skybox);
    }
}

// 注册到 componentLogic 分发表
registerLogic('SkyBox', SkyBoxLogic);

export function skyboxRenderObject(input: { readonly scene: Scene, readonly camera: Camera })
{
    const r_input = reactive(input);

    let cameraUniforms: {
        readonly value: CameraUniforms;
    };

    let s_skyboxTexture: TextureView;

    const renderObject: RenderObject = {
        pipeline: {
            vertex: { wgsl: skyboxWGSL, },
            fragment: { wgsl: skyboxWGSL },
            primitive: { cullFace: 'none' },
            depthStencil: { depthWriteEnabled: false, depthCompare: 'less-equal' }
        },
        draw: { __type__: 'DrawVertex' as const, vertexCount: 36, instanceCount: 1, firstVertex: 0, firstInstance: 0 },
        bindingResources: {
            cameraUniforms: cameraUniforms = { value: null as CameraUniforms },
            s_skyboxTextureSampler: {},
            s_skyboxTexture: s_skyboxTexture = { texture: null, dimension: 'cube', arrayLayerCount: 6, }
        },
    };

    const renderObjectComput = computed(() =>
    {
        //
        r_input.scene;
        r_input.camera;

        //
        const scene = input.scene;
        const camera = input.camera;

        const activeSkyBoxs = logic(scene).activeSkyBoxs;
        const skybox = activeSkyBoxs[0];

        // 无激活天空盒：返回空数组（保持引用稳定）
        if (!skybox) return null;

        reactive(s_skyboxTexture).texture = skybox.s_skyboxTexture.texture;
        reactive(cameraUniforms).value = logic(camera).uniforms.value;

        return renderObject;
    });


    return {
        get renderObject() { return renderObjectComput.value; }
    };
}