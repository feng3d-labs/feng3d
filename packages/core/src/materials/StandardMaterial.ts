import { Color3, Color4 } from '@feng3d/math';
import { oav } from '@feng3d/objectview';
import { decoratorRegisterClass } from '@feng3d/polyfill';
import { reactive } from '@feng3d/reactivity';
import { serialize } from '@feng3d/serialization';
import { standardFragmentWGSL } from '../shaders/standard.fragment.wgsl';
import { standardVertexWGSL } from '../shaders/standard.vertex.wgsl';
import { buildSampler, buildTextureView } from '../render/webgpu/MaterialPipeline';
import { Texture2D } from '../textures/Texture2D';
import { TextureCube } from '../textures/TextureCube';
import { Material } from './Material';

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
 * 使用 standard 着色器（漫反射纹理 + 环境光）。uniform 数据通过 {@link Material.uniforms}
 * 自动传递，纹理通过 {@link Material.textureViews} 与 {@link Material.samplers} 自动传递，
 * 子类无需重写 beforeRender。
 */
@decoratorRegisterClass()
export class StandardMaterial extends Material
{
    /**
     * 材质 uniform 数据。
     *
     * 各字段同时作为本类的实例属性（getter/setter 代理到此对象），便于外部直接访问。
     */
    readonly uniforms = {
        u_PointSize: 1,
        u_diffuse: new Color4(1, 1, 1, 1),
        u_alphaThreshold: 0,
        u_specular: new Color3(),
        u_glossiness: 50,
        u_ambient: new Color4(),
        u_reflectivity: 1,
        u_fogMinDistance: 0,
        u_fogMaxDistance: 100,
        u_fogColor: new Color3(),
        u_fogDensity: 0.1,
        u_fogMode: FogMode.NONE,
    };

    /** 点绘制时点的尺寸 */
    @serialize @oav()
    get u_PointSize() { return this.uniforms.u_PointSize; }
    set u_PointSize(v) { this.uniforms.u_PointSize = v; }

    /** 漫反射纹理 */
    @serialize @oav({ block: 'diffuse' })
    get s_diffuse() { return this._s_diffuse; }
    set s_diffuse(v) { this._s_diffuse = v; this._updateTexture('s_diffuse', v); }
    private _s_diffuse = Texture2D.default;

    /** 基本颜色 */
    @serialize @oav({ block: 'diffuse' })
    get u_diffuse() { return this.uniforms.u_diffuse; }
    set u_diffuse(v) { this.uniforms.u_diffuse = v; }

    /** 透明阈值，透明度小于该值的像素被片段着色器丢弃 */
    @serialize @oav({ block: 'diffuse' })
    get u_alphaThreshold() { return this.uniforms.u_alphaThreshold; }
    set u_alphaThreshold(v) { this.uniforms.u_alphaThreshold = v; }

    /** 法线纹理 */
    @serialize @oav({ block: 'normalMethod' })
    get s_normal() { return this._s_normal; }
    set s_normal(v) { this._s_normal = v; this._updateTexture('s_normal', v); }
    private _s_normal = Texture2D.defaultNormal;

    /** 镜面反射光泽图 */
    @serialize @oav({ block: 'specular' })
    get s_specular() { return this._s_specular; }
    set s_specular(v) { this._s_specular = v; this._updateTexture('s_specular', v); }
    private _s_specular = Texture2D.default;

    /** 镜面反射颜色 */
    @serialize @oav({ block: 'specular' })
    get u_specular() { return this.uniforms.u_specular; }
    set u_specular(v) { this.uniforms.u_specular = v; }

    /** 高光系数 */
    @serialize @oav({ block: 'specular' })
    get u_glossiness() { return this.uniforms.u_glossiness; }
    set u_glossiness(v) { this.uniforms.u_glossiness = v; }

    /** 环境纹理 */
    @serialize @oav({ block: 'ambient' })
    get s_ambient() { return this._s_ambient; }
    set s_ambient(v) { this._s_ambient = v; this._updateTexture('s_ambient', v); }
    private _s_ambient = Texture2D.default;

    /** 环境光颜色 */
    @serialize @oav({ block: 'ambient' })
    get u_ambient() { return this.uniforms.u_ambient; }
    set u_ambient(v) { this.uniforms.u_ambient = v; }

    /** 环境映射贴图 */
    @serialize @oav({ component: 'OAVPick', block: 'envMap', componentParam: { accepttype: 'texturecube', datatype: 'texturecube' } })
    get s_envMap() { return this._s_envMap; }
    set s_envMap(v) { this._s_envMap = v; this._updateTexture('s_envMap', v); }
    private _s_envMap = TextureCube.default;

    /** 反射率 */
    @serialize @oav({ block: 'envMap' })
    get u_reflectivity() { return this.uniforms.u_reflectivity; }
    set u_reflectivity(v) { this.uniforms.u_reflectivity = v; }

    /** 出现雾效果的最近距离 */
    @serialize @oav({ block: 'fog' })
    get u_fogMinDistance() { return this.uniforms.u_fogMinDistance; }
    set u_fogMinDistance(v) { this.uniforms.u_fogMinDistance = v; }

    /** 最远距离 */
    @serialize @oav({ block: 'fog' })
    get u_fogMaxDistance() { return this.uniforms.u_fogMaxDistance; }
    set u_fogMaxDistance(v) { this.uniforms.u_fogMaxDistance = v; }

    /** 雾的颜色 */
    @serialize @oav({ block: 'fog' })
    get u_fogColor() { return this.uniforms.u_fogColor; }
    set u_fogColor(v) { this.uniforms.u_fogColor = v; }

    /** 雾的密度 */
    @serialize @oav({ block: 'fog' })
    get u_fogDensity() { return this.uniforms.u_fogDensity; }
    set u_fogDensity(v) { this.uniforms.u_fogDensity = v; }

    /** 雾模式 */
    @serialize @oav({ block: 'fog', component: 'OAVEnum', componentParam: { enumClass: FogMode } })
    get u_fogMode() { return this.uniforms.u_fogMode; }
    set u_fogMode(v) { this.uniforms.u_fogMode = v; }

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

        // 初始化纹理绑定（textureViews / samplers）
        this._updateTexture('s_diffuse', this._s_diffuse);
        this._updateTexture('s_normal', this._s_normal);
        this._updateTexture('s_specular', this._s_specular);
        this._updateTexture('s_ambient', this._s_ambient);
        this._updateTexture('s_envMap', this._s_envMap);
    }

    /**
     * 更新单个纹理的绑定（textureView + sampler）。
     *
     * WGSL 约定：`var <key>: texture_*` + `var <key>Sampler: sampler`。
     */
    private _updateTexture(key: string, texture: Texture2D | TextureCube)
    {
        this.textureViews[key] = buildTextureView(texture);
        this.samplers[`${key}Sampler`] = buildSampler(texture);
    }

    /**
     * 是否加载完成
     */
    override get isLoaded()
    {
        return this._s_diffuse.isLoaded && this._s_normal.isLoaded && this._s_specular.isLoaded
            && this._s_ambient.isLoaded && this._s_envMap.isLoaded;
    }

    /**
     * 已加载完成或者加载完成时立即调用
     */
    override onLoadCompleted(callback: () => void)
    {
        const textures = [this._s_diffuse, this._s_normal, this._s_specular, this._s_ambient, this._s_envMap];
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
