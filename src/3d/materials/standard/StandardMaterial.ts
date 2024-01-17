import { Color3, Color4 } from '@feng3d/math';
import { oav } from '@feng3d/objectview';
import { shaderlib } from '@feng3d/renderer';
import { Texture2DLike } from '@feng3d/renderer/src/textures/Texture2D';
import { Serializable, SerializeProperty } from '@feng3d/serialization';
import { AssetData } from '../../../core/AssetData';
import { Material } from '../../../core/Material';
import standardFragment from './standard.fragment.glsl';
import standardVertex from './standard.vertex.glsl';

declare module '../../../core/Material'
{
    interface DefaultMaterialMap { 'Default-Material': Material; }
    interface UniformsMap { StandardUniforms: StandardUniforms }
    interface MaterialMap { StandardMaterial: StandardMaterial }
}

@Serializable('StandardMaterial')
export class StandardMaterial extends Material
{
    declare __class__: 'StandardMaterial';

    uniforms = new StandardUniforms();

    constructor()
    {
        super();
        this.shader.shaderName = 'standard';
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

@Serializable('StandardUniforms')
export class StandardUniforms
{
    declare __class__: 'StandardUniforms';

    /**
     * 点绘制时点的尺寸
     */
    @SerializeProperty()
    @oav()
    u_PointSize = 1;

    /**
     * 漫反射纹理
     */
    @SerializeProperty()
    @oav({ block: 'diffuse' })
    s_diffuse: Texture2DLike = AssetData.getDefaultAssetData('Default-Texture');

    /**
     * 基本颜色
     */
    @SerializeProperty()
    @oav({ block: 'diffuse' })
    u_diffuse = new Color4(1, 1, 1, 1);

    /**
     * 透明阈值，透明度小于该值的像素被片段着色器丢弃
     */
    @SerializeProperty()
    @oav({ block: 'diffuse' })
    u_alphaThreshold = 0;

    /**
     * 法线纹理
     */
    @SerializeProperty()
    @oav({ block: 'normalMethod' })
    s_normal: Texture2DLike = AssetData.getDefaultAssetData('Default-NormalTexture');

    /**
     * 镜面反射光泽图
     */
    @SerializeProperty()
    @oav({ block: 'specular' })
    s_specular: Texture2DLike = AssetData.getDefaultAssetData('Default-Texture');

    /**
     * 镜面反射颜色
     */
    @SerializeProperty()
    @oav({ block: 'specular' })
    u_specular = new Color3();

    /**
     * 高光系数
     */
    @SerializeProperty()
    @oav({ block: 'specular' })
    u_glossiness = 50;

    /**
     * 环境纹理
     */
    @SerializeProperty()
    @oav({ block: 'ambient' })
    s_ambient = AssetData.getDefaultAssetData('Default-Texture');

    /**
     * 环境光颜色
     */
    @SerializeProperty()
    @oav({ block: 'ambient' })
    u_ambient = new Color4();

    /**
     * 环境映射贴图
     */
    @SerializeProperty()
    @oav({ component: 'OAVPick', block: 'envMap', componentParam: { accepttype: 'texturecube', datatype: 'texturecube' } })
    s_envMap = AssetData.getDefaultAssetData('Default-TextureCube');

    /**
     * 反射率
     */
    @SerializeProperty()
    @oav({ block: 'envMap' })
    u_reflectivity = 1;

    /**
     * 出现雾效果的最近距离
     */
    @SerializeProperty()
    @oav({ block: 'fog' })
    u_fogMinDistance = 0;

    /**
     * 最远距离
     */
    @SerializeProperty()
    @oav({ block: 'fog' })
    u_fogMaxDistance = 100;

    /**
     * 雾的颜色
     */
    @SerializeProperty()
    @oav({ block: 'fog' })
    u_fogColor = new Color3();

    /**
     * 雾的密度
     */
    @SerializeProperty()
    @oav({ block: 'fog' })
    u_fogDensity = 0.1;

    /**
     * 雾模式
     */
    @SerializeProperty()
    @oav({ block: 'fog', component: 'OAVEnum', componentParam: { enumClass: FogMode } })
    u_fogMode = FogMode.NONE;
}

shaderlib.shaderConfig.shaders.standard = {
    vertex: standardVertex,
    fragment: standardFragment,
};

Material.setDefault('Default-Material', () => new StandardMaterial());
