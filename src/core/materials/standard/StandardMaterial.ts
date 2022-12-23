import { Color3 } from '../../../math/Color3';
import { Color4 } from '../../../math/Color4';
import { oav } from '../../../objectview/ObjectView';
import { shaderlib } from '../../../renderer/shader/ShaderLib';
import { Serializable } from '../../../serialization/Serializable';
import { SerializeProperty } from '../../../serialization/SerializeProperty';
import { Texture2D } from '../../textures/Texture2D';
import { TextureCube } from '../../textures/TextureCube';
import { Material } from '../Material';
import standardFragment from './standard_fragment_glsl';
import standardVertex from './standard_vertex_glsl';

declare global
{
    export interface MixinsDefaultMaterial
    {
        'Default-Material': Material;
    }

    export interface MixinsMaterialMap
    {
        standard: StandardMaterial
    }
}

@Serializable()
export class StandardMaterial extends Material
{
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

@Serializable()
export class StandardUniforms
{
    __class__: 'StandardUniforms';

    /**
     * 点绘制时点的尺寸
     */
    @SerializeProperty
    @oav()
    u_PointSize = 1;

    /**
     * 漫反射纹理
     */
    @SerializeProperty
    @oav({ block: 'diffuse' })
    s_diffuse = Texture2D.default;

    /**
     * 基本颜色
     */
    @SerializeProperty
    @oav({ block: 'diffuse' })
    u_diffuse = new Color4(1, 1, 1, 1);

    /**
     * 透明阈值，透明度小于该值的像素被片段着色器丢弃
     */
    @SerializeProperty
    @oav({ block: 'diffuse' })
    u_alphaThreshold = 0;

    /**
     * 法线纹理
     */
    @SerializeProperty
    @oav({ block: 'normalMethod' })
    s_normal = Texture2D.defaultNormal;

    /**
     * 镜面反射光泽图
     */
    @SerializeProperty
    @oav({ block: 'specular' })
    s_specular = Texture2D.default;

    /**
     * 镜面反射颜色
     */
    @SerializeProperty
    @oav({ block: 'specular' })
    u_specular = new Color3();

    /**
     * 高光系数
     */
    @SerializeProperty
    @oav({ block: 'specular' })
    u_glossiness = 50;

    /**
     * 环境纹理
     */
    @SerializeProperty
    @oav({ block: 'ambient' })
    s_ambient = Texture2D.default;

    /**
     * 环境光颜色
     */
    @SerializeProperty
    @oav({ block: 'ambient' })
    u_ambient = new Color4();

    /**
     * 环境映射贴图
     */
    @SerializeProperty
    @oav({ component: 'OAVPick', block: 'envMap', componentParam: { accepttype: 'texturecube', datatype: 'texturecube' } })
    s_envMap = TextureCube.default;

    /**
     * 反射率
     */
    @SerializeProperty
    @oav({ block: 'envMap' })
    u_reflectivity = 1;

    /**
     * 出现雾效果的最近距离
     */
    @SerializeProperty
    @oav({ block: 'fog' })
    u_fogMinDistance = 0;

    /**
     * 最远距离
     */
    @SerializeProperty
    @oav({ block: 'fog' })
    u_fogMaxDistance = 100;

    /**
     * 雾的颜色
     */
    @SerializeProperty
    @oav({ block: 'fog' })
    u_fogColor = new Color3();

    /**
     * 雾的密度
     */
    @SerializeProperty
    @oav({ block: 'fog' })
    u_fogDensity = 0.1;

    /**
     * 雾模式
     */
    @SerializeProperty
    @oav({ block: 'fog', component: 'OAVEnum', componentParam: { enumClass: FogMode } })
    u_fogMode = FogMode.NONE;
}

shaderlib.shaderConfig.shaders.standard = {
    vertex: standardVertex,
    fragment: standardFragment,
    cls: StandardUniforms
};


Material.setDefault('Default-Material', new StandardMaterial());