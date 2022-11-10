import { EventEmitter, globalEmitter } from '@feng3d/event';
import { oav } from '@feng3d/objectview';
import { gPartial } from '@feng3d/polyfill';
import { RenderAtomic, RenderParams, Shader, shaderlib } from '@feng3d/renderer';
import { decoratorRegisterClass, serialization, serialize } from '@feng3d/serialization';
import { AssetData } from '../core/AssetData';
import { Texture2D } from '../textures/Texture2D';
import { TextureCube } from '../textures/TextureCube';

declare global
{
    interface MixinsDefaultMaterial
    {

    }
    interface MixinsUniformsTypes
    {

    }
}

export interface UniformsTypes extends MixinsUniformsTypes { }
export type ShaderNames = keyof UniformsTypes;
export type UniformsLike = UniformsTypes[keyof UniformsTypes];

/**
 * 材质
 */
@decoratorRegisterClass()
export class Material extends EventEmitter
{
    __class__: 'Material';

    static create<K extends keyof UniformsTypes>(shaderName: K, uniforms?: gPartial<UniformsTypes[K]>, renderParams?: gPartial<RenderParams>)
    {
        const material = new Material();
        material.init(shaderName, uniforms, renderParams);

        return material;
    }

    init<K extends keyof UniformsTypes>(shaderName: K, uniforms?: gPartial<UniformsTypes[K]>, renderParams?: gPartial<RenderParams>)
    {
        this.shaderName = shaderName;
        //
        uniforms && serialization.setValue(this.uniforms, <any>uniforms);
        renderParams && serialization.setValue(this.renderParams, renderParams);

        return this;
    }

    @oav({ component: 'OAVFeng3dPreView' })
    private preview = '';

    /**
     * shader名称
     */
    @oav({ component: 'OAVMaterialName' })
    @serialize
    get shaderName()
    {
        if (!this._shaderName)
        {
            this._shaderName = 'standard' as any;
        }

        return this._shaderName;
    }
    set shaderName(v)
    {
        this._shaderName = v;
    }
    private _shaderName: ShaderNames;

    @oav()
    @serialize
    name = '';

    /**
     * Uniform数据
     */
    @serialize
    @oav({ component: 'OAVObjectView' })
    get uniforms()
    {
        const Cls = shaderlib.shaderConfig.shaders[this.shaderName].cls;
        if (Cls)
        {
            if (!this._uniforms || this._uniforms.constructor !== Cls)
            {
                this._uniforms = new Cls();
            }
        }

        if (!this._uniforms)
        {
            this._uniforms = <any>{};
        }

        return this._uniforms;
    }
    set uniforms(v)
    {
        this._uniforms = v;
    }
    private _uniforms: UniformsLike;

    /**
     * 渲染参数
     */
    @serialize
    @oav({ block: '渲染参数', component: 'OAVObjectView' })
    get renderParams()
    {
        if (!this._renderParams)
        {
            const renderParams = shaderlib.shaderConfig.shaders[this.shaderName]?.renderParams;
            this._renderParams = new RenderParams(renderParams);
        }

        return this._renderParams;
    }
    set renderParams(v)
    {
        this._renderParams = v;
    }
    private _renderParams: RenderParams;

    protected get shader()
    {
        if (!this._shader || this._shader.shaderName !== this.shaderName)
        {
            this._shader = new Shader({ shaderName: this.shaderName });
        }

        return this._shader;
    }
    private _shader: Shader;

    constructor(param?: gPartial<Material>)
    {
        super();
        serialization.setValue(this, param);
        globalEmitter.on('asset.shaderChanged', this._onShaderChanged, this);
    }

    beforeRender(renderAtomic: RenderAtomic)
    {
        Object.assign(renderAtomic.uniforms, this.uniforms);

        renderAtomic.shader = this.shader;
        renderAtomic.renderParams = this.renderParams;
        renderAtomic.shaderMacro.IS_POINTS_MODE = this.renderParams.renderMode === 'POINTS';
    }

    /**
     * 是否加载完成
     */
    get isLoaded()
    {
        const uniforms = this.uniforms;
        for (const key in uniforms)
        {
            const texture = uniforms[key];
            if (texture instanceof Texture2D || texture instanceof TextureCube)
            {
                if (!texture.isLoaded) return false;
            }
        }

        return true;
    }

    /**
     * 已加载完成或者加载完成时立即调用
     * @param callback 完成回调
     */
    onLoadCompleted(callback: () => void)
    {
        let loadingNum = 0;
        const uniforms = this.uniforms;
        for (const key in uniforms)
        {
            const texture = uniforms[key];
            if (texture instanceof Texture2D || texture instanceof TextureCube)
            {
                if (!texture.isLoaded)
                {
                    loadingNum++;
                    // eslint-disable-next-line no-loop-func
                    texture.on('loadCompleted', () =>
                    {
                        loadingNum--;
                        if (loadingNum === 0) callback();
                    });
                }
            }
        }
        if (loadingNum === 0) callback();
    }

    private _onShaderChanged()
    {
        this._shader = null;
    }

    /**
     * 设置默认材质
     *
     * 资源名称与材质名称相同，且无法在检查器界面中编辑。
     *
     * @param name 材质名称
     * @param material 材质数据
     */
    static setDefault<K extends keyof DefaultMaterial>(name: K, material: gPartial<Material>)
    {
        const newMaterial = this._defaultMaterials[<any>name] = new Material();
        serialization.setValue(newMaterial, material);
        serialization.setValue(newMaterial, { name });
        AssetData.addAssetData(name, newMaterial);
    }

    /**
     * 获取材质
     *
     * @param name 材质名称
     */
    static getDefault<K extends keyof DefaultMaterial>(name: K)
    {
        return this._defaultMaterials[name];
    }
    private static _defaultMaterials: DefaultMaterial = <any>{};
}

/**
 * 默认材质
 */
export interface DefaultMaterial extends MixinsDefaultMaterial
{
}

Material.setDefault('Default-Material', { shaderName: 'standard' as any });
