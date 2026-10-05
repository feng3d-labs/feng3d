import { computed, logic, reactive, registerLogic } from "@feng3d/reactivity";
import { RenderObject, Texture, TextureView } from "@feng3d/webgpu";
import { Camera, CameraUniforms } from "../cameras/Camera";
import { getSkyBoxShaderWGSL } from '../shaders/tsl/skybox';
import { Component3D, Component3DLogic, createComponentLogicBase } from '../component/Component';
import type { Object3D } from "../core/Object3D";
import { Scene } from "../scene/Scene";

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
    readonly s_skyboxTexture: Texture;
}

declare module '@feng3d/reactivity'
{
    interface LogicMap
    {
        SkyBox: SkyBoxLogic;
    }
}

/**
 * SkyBox 逻辑处理接口。
 *
 * beforeRender 将天空盒纹理写入 renderObject.bindingResources（由 skyboxRenderObject 承担）。
 */
export interface SkyBoxLogic extends Component3DLogic
{
}

/**
 * 工厂函数：SkyBoxLogic 的唯一创建入口（registerLogic 注册它）。
 *
 * 自身无覆写成员，逐项委托 Component 基座。
 *
 * @param data 组件数据（raw）
 */
export function skyBoxLogic(data: SkyBox): SkyBoxLogic
{
    const { state, members } = createComponentLogicBase(data);

    const logic: SkyBoxLogic = {
        get component() { return members.component; },
        get entity() { return state.entity as Object3D | null; },
        init(object3D) { members.init(object3D); },
        beforeRender(renderObject) { members.beforeRender(renderObject); },
        get isLoaded() { return members.isLoaded; },
        dispose() { members.dispose(); },
    };

    return logic;
}

// 注册到 logic 分发表
registerLogic('SkyBox', skyBoxLogic);

export function skyboxRenderObject(input: { readonly scene: Scene, readonly camera: Camera })
{
    const r_input = reactive(input);

    let cameraUniforms: {
        readonly value: CameraUniforms;
    };

    let s_skyboxTexture: TextureView;

    // TSL 构建的着色器（首次调用时构建并缓存，见 shaders/tsl/skybox.ts）
    const shaderWGSL = getSkyBoxShaderWGSL();

    const renderObject: RenderObject = {
        pipeline: {
            vertex: { wgsl: shaderWGSL.vertex },
            fragment: { wgsl: shaderWGSL.fragment },
            primitive: { cullFace: 'none' },
            depthStencil: { depthWriteEnabled: false, depthCompare: 'less-equal' }
        },
        draw: { __type__: 'DrawVertex' as const, vertexCount: 36, instanceCount: 1, firstVertex: 0, firstInstance: 0 },
        bindingResources: {
            cameraUniforms: cameraUniforms = { value: {} },
            // 键名与 TSL 的采样器展开约定一致（见 shaders/tsl/skybox.ts）：
            // TSL 把 samplerCube(uniform('s_skyboxTexture')) 展开成
            // s_skyboxTexture_texture（texture_cube）+ s_skyboxTexture（sampler）
            s_skyboxTexture_texture: s_skyboxTexture = { texture: null as unknown as TextureView['texture'], dimension: 'cube', arrayLayerCount: 6, },
            s_skyboxTexture: {}
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

        // 旧版 TextureCube 有嵌套 .texture 字段（Texture 类型）；改为统一 Texture 接口后，
        // s_skyboxTexture 本身就是 TextureLike，直接赋给 TextureView.texture。
        reactive(s_skyboxTexture).texture = skybox.s_skyboxTexture as unknown as TextureView['texture'];
        reactive(cameraUniforms).value = logic(camera).uniforms;

        return renderObject;
    });


    return {
        get renderObject() { return renderObjectComput.value; }
    };
}
