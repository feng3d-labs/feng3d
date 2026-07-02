import { Color3, Color4 } from '@feng3d/math';
import { oav } from '@feng3d/objectview';
import { decoratorRegisterClass } from '@feng3d/polyfill';
import { reactive } from '@feng3d/reactivity';
import { serialize } from '@feng3d/serialization';
import { standardFragmentWGSL } from '../shaders/standard.fragment.wgsl';
import { standardVertexWGSL } from '../shaders/standard.vertex.wgsl';
import { buildTextureSampler } from '../render/webgpu/MaterialPipeline';
import { Texture2D } from '../textures/Texture2D';
import { TextureCube } from '../textures/TextureCube';
import { Material } from './Material';
import { RenderObject } from '@feng3d/webgpu';

declare global
{
    export interface MixinsDefaultMaterial
    {
        'Default-Material': Material;
    }
}

/**
 * 雾模式
 */
export enum FogMode
{
    NONE = 0,
    EXP = 1,
    EXP2 = 2,
    LINEAR = 3
}

/**
 * 标准材质。
 *
 * 使用 standard 着色器（漫反射纹理 + 环境光）。uniform/纹理字段直接作为实例属性，
 * beforeRender 写入 bindingResources（material_uniforms + 纹理绑定）。
 */
@decoratorRegisterClass()
export class StandardMaterial extends Material
{
    /** 点绘制时点的尺寸 */
    @serialize @oav()
    u_PointSize = 1;

    /** 漫反射纹理 */
    @serialize @oav({ block: 'diffuse' })
    s_diffuse = Texture2D.default;

    /** 基本颜色 */
    @serialize @oav({ block: 'diffuse' })
    u_diffuse = new Color4(1, 1, 1, 1);

    /** 透明阈值，透明度小于该值的像素被片段着色器丢弃 */
    @serialize @oav({ block: 'diffuse' })
    u_alphaThreshold = 0;

    /** 法线纹理 */
    @serialize @oav({ block: 'normalMethod' })
    s_normal = Texture2D.defaultNormal;

    /** 镜面反射光泽图 */
    @serialize @oav({ block: 'specular' })
    s_specular = Texture2D.default;

    /** 镜面反射颜色 */
    @serialize @oav({ block: 'specular' })
    u_specular = new Color3();

    /** 高光系数 */
    @serialize @oav({ block: 'specular' })
    u_glossiness = 50;

    /** 环境纹理 */
    @serialize @oav({ block: 'ambient' })
    s_ambient = Texture2D.default;

    /** 环境光颜色 */
    @serialize @oav({ block: 'ambient' })
    u_ambient = new Color4();

    /** 环境映射贴图 */
    @serialize @oav({ component: 'OAVPick', block: 'envMap', componentParam: { accepttype: 'texturecube', datatype: 'texturecube' } })
    s_envMap = TextureCube.default;

    /** 反射率 */
    @serialize @oav({ block: 'envMap' })
    u_reflectivity = 1;

    /** 出现雾效果的最近距离 */
    @serialize @oav({ block: 'fog' })
    u_fogMinDistance = 0;

    /** 最远距离 */
    @serialize @oav({ block: 'fog' })
    u_fogMaxDistance = 100;

    /** 雾的颜色 */
    @serialize @oav({ block: 'fog' })
    u_fogColor = new Color3();

    /** 雾的密度 */
    @serialize @oav({ block: 'fog' })
    u_fogDensity = 0.1;

    /** 雾模式 */
    @serialize @oav({ block: 'fog', component: 'OAVEnum', componentParam: { enumClass: FogMode } })
    u_fogMode = FogMode.NONE;

    constructor()
    {
        super();
        // standard 着色器配置：通过 reactive 代理一层替换各子状态（renderPipeline 字段在接口中为
        // readonly，属编译期约束；reactive 返回的代理顶层可写，故一层替换合法且能触发响应式更新）。
        const r_pipeline = reactive(this.renderPipeline);
        r_pipeline.vertex = { wgsl: standardVertexWGSL };
        r_pipeline.fragment = { wgsl: standardFragmentWGSL, targets: [{}] };
        r_pipeline.primitive = { topology: 'triangle-list', cullFace: 'back', frontFace: 'cw' };
        r_pipeline.depthStencil = { depthWriteEnabled: true, depthCompare: 'less' };
    }

    beforeRender(renderObject: RenderObject)
    {
        super.beforeRender(renderObject);

        const ro = renderObject as any;
        const bindingResources = ro.bindingResources ||= {};
        const r_bindingResources = reactive(bindingResources);

        // 数据 uniform → material_uniforms（WGSL var<uniform> material_uniforms）
        r_bindingResources.material_uniforms = {
            value: {
                u_PointSize: this.u_PointSize,
                u_diffuse: this.u_diffuse,
                u_alphaThreshold: this.u_alphaThreshold,
                u_specular: this.u_specular,
                u_glossiness: this.u_glossiness,
                u_ambient: this.u_ambient,
                u_reflectivity: this.u_reflectivity,
                u_fogMinDistance: this.u_fogMinDistance,
                u_fogMaxDistance: this.u_fogMaxDistance,
                u_fogColor: this.u_fogColor,
                u_fogDensity: this.u_fogDensity,
                u_fogMode: this.u_fogMode,
            },
        };

        // 纹理 → bindingResources[key] = { texture, sampler }（key 与 WGSL 变量名一致）
        r_bindingResources.s_diffuse = buildTextureSampler(this.s_diffuse);
        r_bindingResources.s_normal = buildTextureSampler(this.s_normal);
        r_bindingResources.s_specular = buildTextureSampler(this.s_specular);
        r_bindingResources.s_ambient = buildTextureSampler(this.s_ambient);
        r_bindingResources.s_envMap = buildTextureSampler(this.s_envMap);
    }

    /**
     * 是否加载完成
     */
    override get isLoaded()
    {
        return this.s_diffuse.isLoaded && this.s_normal.isLoaded && this.s_specular.isLoaded
            && this.s_ambient.isLoaded && this.s_envMap.isLoaded;
    }

    /**
     * 已加载完成或者加载完成时立即调用
     */
    override onLoadCompleted(callback: () => void)
    {
        const textures = [this.s_diffuse, this.s_normal, this.s_specular, this.s_ambient, this.s_envMap];
        let loadingNum = 0;
        for (const texture of textures)
        {
            if (!texture.isLoaded)
            {
                loadingNum++;
                texture.on('loadCompleted', () =>
                {
                    loadingNum--;
                    if (loadingNum === 0) callback();
                });
            }
        }
        if (loadingNum === 0) callback();
    }
}

// 注册默认材质
Material.setDefault('Default-Material', new StandardMaterial());
