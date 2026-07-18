import { computed, reactive, registerLogic } from "@feng3d/reactivity";
import { Sampler, TextureView } from '@feng3d/webgpu';
import type { Component3D } from '../component/Component';
import { Component3DLogic } from '../component/Component';
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

        const r_skybox = reactive(skybox);

        let s_skyboxTextureCacle: TextureView;
        const s_skyboxTextureComputed = computed(() =>
        {
            s_skyboxTextureCacle = s_skyboxTextureCacle || { texture: null, dimension: 'cube', arrayLayerCount: 6, }

            //
            reactive(s_skyboxTextureCacle).texture = r_skybox.s_skyboxTexture.texture;

            return s_skyboxTextureCacle;
        });

        let s_skyboxTextureSamplerCacle: Sampler;
        const s_skyboxTextureSamplerComputed = computed(() =>
        {
            s_skyboxTextureSamplerCacle = s_skyboxTextureSamplerCacle || {};

            return s_skyboxTextureSamplerCacle;
        });

        //
        this.beforeRender = (renderObject) =>
        {
            const r_bindingResources = reactive(renderObject.bindingResources);
            r_bindingResources.s_skyboxTexture = s_skyboxTextureComputed.value;
            r_bindingResources.s_skyboxTextureSampler = s_skyboxTextureSamplerComputed.value;
        };
    }
}

// 注册到 componentLogic 分发表
registerLogic('SkyBox', SkyBoxLogic);
