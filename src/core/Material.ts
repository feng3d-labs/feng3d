import { EventEmitter } from '@feng3d/event';
import { Constructor, gPartial, Lazy } from '@feng3d/polyfill';
import { oav } from '../objectview/ObjectView';
import { RenderAtomic } from '../renderer/data/RenderAtomic';
import { DrawMode, RenderParams } from '../renderer/data/RenderParams';
import { Shader } from '../renderer/data/Shader';
import { Serializable } from '../serialization/Serializable';
import { $set } from '../serialization/Serialization';
import { SerializeProperty } from '../serialization/SerializeProperty';
import { AssetData } from './AssetData';

export interface MaterialMap { }
export interface UniformsMap { }

declare module '../serialization/Serializable' { interface SerializableMap extends MaterialMap, UniformsMap { } }

declare module './AssetData' { interface DefaultAssetDataMap extends DefaultMaterialMap { } }

/**
 * 默认材质
 */
export interface DefaultMaterialMap { }

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

    /**
     * 渲染模式，默认 TRIANGLES，每三个顶点绘制一个三角形。
     *
     * * POINTS 绘制单个点。
     * * LINE_LOOP 绘制循环连线。
     * * LINE_STRIP 绘制连线
     * * LINES 每两个顶点绘制一条线段。
     * * TRIANGLES 每三个顶点绘制一个三角形。
     * * TRIANGLE_STRIP 绘制三角形条带。
     * * TRIANGLE_FAN  绘制三角扇形。
     *
     * A GLenum specifying the type primitive to render. Possible values are:
     * @see https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/drawElements
     */
    @SerializeProperty()
    @oav({ component: 'OAVEnum', tooltip: '渲染模式，默认RenderMode.TRIANGLES', componentParam: { enumClass: ['POINTS', 'LINE_LOOP', 'LINE_STRIP', 'LINES', 'TRIANGLES', 'TRIANGLE_STRIP', 'TRIANGLE_FAN'] } })
    drawMode: DrawMode = 'TRIANGLES';

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
        renderAtomic.drawCall.drawMode = this.drawMode;
        renderAtomic.shaderMacro.IS_POINTS_MODE = this.drawMode === 'POINTS';
    }

    /**
     * 设置默认材质
     *
     * 资源名称与材质名称相同，且无法在检查器界面中编辑。
     *
     * @param name 材质名称
     * @param material 材质数据
     */
    static setDefault<K extends keyof DefaultMaterialMap>(name: K, material: Lazy<DefaultMaterialMap[K]>)
    {
        AssetData.addDefaultAssetData(name, material as any);
    }

    /**
     * 获取材质
     *
     * @param name 材质名称
     */
    static getDefault<K extends keyof DefaultMaterialMap>(name: K): DefaultMaterialMap[K]
    {
        return AssetData.getDefaultAssetData(name);
    }
}
