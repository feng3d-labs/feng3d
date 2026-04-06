import { globalEmitter } from '@feng3d/event';
import { oav } from '@feng3d/objectview';
import { decoratorRegisterClass, gPartial } from '@feng3d/polyfill';
import { RenderAtomic, RenderMode, RenderParams, Shader, shaderlib } from '@feng3d/renderer';
import { serialization, serialize } from '@feng3d/serialization';
import { watcher } from '@feng3d/watcher';
import { AssetData } from '../core/AssetData';
import { Feng3dObject } from '../core/Feng3dObject';
import { HideFlags } from '../core/HideFlags';
import { Texture2D } from '../textures/Texture2D';
import { TextureCube } from '../textures/TextureCube';
import { StandardUniforms } from './StandardMaterial';

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
export class Material extends Feng3dObject
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

    //
    private renderAtomic = new RenderAtomic();

    @oav({ component: 'OAVFeng3dPreView' })
    private preview = '';

    /**
     * shader名称
     */
    @oav({ component: 'OAVMaterialName' })
    @serialize
    shaderName: ShaderNames;

    @oav()
    @serialize
    name = '';

    /**
     * Uniform数据
     */
    @serialize
    @oav({ component: 'OAVObjectView' })
    uniforms: UniformsLike;

    /**
     * 渲染参数
     */
    @serialize
    @oav({ block: '渲染参数', component: 'OAVObjectView' })
    renderParams: RenderParams;

    constructor()
    {
        super();
        globalEmitter.on('asset.shaderChanged', this._onShaderChanged, this);
        watcher.watch(this as Material, 'shaderName', this._onShaderChanged, this);
        watcher.watch(this as Material, 'uniforms', this._onUniformsChanged, this);
        watcher.watch(this as Material, 'renderParams', this._onRenderParamsChanged, this);
        this.shaderName = 'standard';
        this.uniforms = new StandardUniforms();
        this.renderParams = new RenderParams();
    }

    beforeRender(renderAtomic: RenderAtomic)
    {
        Object.assign(renderAtomic.uniforms, this.renderAtomic.uniforms);

        renderAtomic.shader = this.renderAtomic.shader;
        renderAtomic.renderParams = this.renderAtomic.renderParams;
        renderAtomic.shaderMacro.IS_POINTS_MODE = this.renderParams.renderMode === RenderMode.POINTS;
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
        const Cls = shaderlib.shaderConfig.shaders[this.shaderName].cls;
        if (Cls)
        {
            if (!this.uniforms || this.uniforms.constructor !== Cls)
            {
                const newuniforms = new Cls();
                this.uniforms = newuniforms;
            }
        }
        else
        {
            this.uniforms = <any>{};
        }

        const renderParams = shaderlib.shaderConfig.shaders[this.shaderName].renderParams;
        renderParams && serialization.setValue(this.renderParams, renderParams);

        this.renderAtomic.shader = new Shader({ shaderName: this.shaderName });
    }

    private _onUniformsChanged()
    {
        this.renderAtomic.uniforms = this.uniforms as any;
    }

    private _onRenderParamsChanged()
    {
        this.renderAtomic.renderParams = this.renderParams;
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
        serialization.setValue(newMaterial, { name, hideFlags: HideFlags.NotEditable });
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

Material.setDefault('Default-Material', { shaderName: 'standard' });
