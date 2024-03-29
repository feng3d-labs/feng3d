import { Material, RegisterMaterial } from '../../core/Material';
import { Color4 } from '../../math/Color4';
import { Vector4 } from '../../math/geom/Vector4';
import { oav } from '../../objectview/ObjectView';
import { shaderConfig } from '../../renderer/shader/ShaderLib';
import { Serializable } from '../../serialization/Serializable';
import { SerializeProperty } from '../../serialization/SerializeProperty';
import { Texture2D } from '../../textures/Texture2D';

declare module '../../core/Material'
{
    interface MaterialMap { UIMaterial: UIMaterial }
    interface UniformsMap { UIUniforms: UIUniforms }
    interface DefaultMaterialMap
    {
        'Default-UIMaterial': Material;
    }
}

@RegisterMaterial('UIMaterial')
export class UIMaterial extends Material
{
    uniforms = new UIUniforms();

    constructor()
    {
        super();
        this.shader.shaderName = 'ui';

        this.renderParams.enableBlend = true;
        this.renderParams.depthtest = false;
    }
}

@Serializable('UIUniforms')
export class UIUniforms
{
    declare __class__: 'UIUniforms';

    /**
     * UI几何体尺寸，在shader中进行对几何体缩放。
     */
    u_rect = new Vector4(0, 0, 100, 100);

    /**
     * 颜色
     */
    @SerializeProperty()
    @oav()
    u_color = new Color4();

    /**
     * 纹理数据
     */
    @oav()
    @SerializeProperty()
    s_texture = Texture2D.default;

    /**
     * 控制图片的显示区域。
     */
    u_uvRect = new Vector4(0, 0, 1, 1);
}

shaderConfig.shaders['ui'] = {
    vertex: `
    attribute vec2 a_position;
    attribute vec2 a_uv;
    
    uniform vec4 u_uvRect;
    uniform vec4 u_rect;
    uniform mat4 u_modelMatrix;
    uniform mat4 u_viewProjection;
    
    varying vec2 v_uv;
    varying vec2 v_position;

    void main() 
    {
        vec2 position = u_rect.xy + a_position * u_rect.zw;
        gl_Position = u_viewProjection * u_modelMatrix * vec4(position, 0.0, 1.0);
        v_uv = u_uvRect.xy + a_uv * u_uvRect.zw;
        v_position = position.xy;
    }
    `,
    fragment: `
    precision mediump float;

    uniform sampler2D s_texture;
    varying vec2 v_uv;
    varying vec2 v_position;
    
    uniform vec4 u_color;
    
    void main() 
    {
        vec4 color = texture2D(s_texture, v_uv);
        gl_FragColor = color * u_color;
    }
    
    `,
};

Material.setDefault('Default-UIMaterial', new UIMaterial());
