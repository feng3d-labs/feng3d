import { EventEmitter } from '../event/EventEmitter';
import { oav } from '../objectview/ObjectView';
import { Constructor, gPartial } from '../polyfill/Types';
import { RenderAtomic } from '../renderer/data/RenderAtomic';
import { RenderParams } from '../renderer/data/RenderParams';
import { Shader } from '../renderer/data/Shader';
import { Serializable } from '../serialization/Serializable';
import { $set } from '../serialization/Serialization';
import { SerializeProperty } from '../serialization/SerializeProperty';
import { AssetData } from './AssetData';
import { Texture2D } from '../textures/Texture2D';
import { TextureCube } from '../textures/TextureCube';

export interface MaterialMap { }
export interface UniformsMap { }

declare module '../serialization/Serializable' { interface SerializableMap extends MaterialMap, UniformsMap { } }

/**
 * 注册材质
 *
 * 使用 @RegisterMaterial 注册材质，配合扩展 MaterialMap 接口后可使用 Material.create 方法构造材质。
 *
 * 将同时使用 @Serializable 进行注册为可序列化。
 *
 * @param material 材质名称，默认使用类名称。
 *
 * @see Serializable
 */
export function RegisterMaterial<K extends keyof MaterialMap>(material: K)
{
    return (constructor: Constructor<MaterialMap[K]>) =>
    {
        Serializable(material)(constructor as any);
    };
}

/**
 * 材质
 */
export abstract class Material extends EventEmitter
{
    init(param: gPartial<this>)
    {
        $set(this, param);

        return this;
    }

    @oav({ component: 'OAVFeng3dPreView' })
    private preview = '';

    /**
     * shader名称
     */
    @oav({ component: 'OAVMaterialName' })
    get shaderName()
    {
        return this.shader.shaderName;
    }

    @oav()
    @SerializeProperty()
    name = '';

    /**
     * Uniform数据
     */
    @SerializeProperty()
    @oav({ component: 'OAVObjectView' })
    uniforms = {};

    /**
     * 渲染参数
     */
    @SerializeProperty()
    @oav({ block: '渲染参数', component: 'OAVObjectView' })
    renderParams = new RenderParams();

    @SerializeProperty()
    shader = new Shader();

    constructor(param?: gPartial<Material>)
    {
        super();
        $set(this, param);
        console.assert(this.constructor.name !== 'Material', `无法之间构建 Material`);
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

    /**
     * 设置默认材质
     *
     * 资源名称与材质名称相同，且无法在检查器界面中编辑。
     *
     * @param name 材质名称
     * @param material 材质数据
     */
    static setDefault<K extends keyof DefaultMaterialMap>(name: K, material: Material)
    {
        this._defaultMaterials[<any>name] = material;
        material.name = name;
        AssetData.addAssetData(name, material);
    }

    /**
     * 获取材质
     *
     * @param name 材质名称
     */
    static getDefault<K extends keyof DefaultMaterialMap>(name: K)
    {
        return this._defaultMaterials[name];
    }
    private static _defaultMaterials: DefaultMaterialMap = <any>{};
}

/**
 * 默认材质
 */
export interface DefaultMaterialMap
{
}

