import { Material, StandardMaterial, Texture2D } from '@feng3d/core';
import { Color4, Vector4 } from '@feng3d/math';
import { oav } from '@feng3d/objectview';
import { decoratorRegisterClass } from '@feng3d/polyfill';
import { serialize } from '@feng3d/serialization';

declare global
{
    export interface MixinsUniformsTypes
    {
        ui: UIUniforms
    }

    export interface MixinsUniforms extends UIUniforms
    {
    }

    export interface MixinsDefaultMaterial
    {
        'Default-UIMaterial': Material;
    }
}

@decoratorRegisterClass()
export class UIUniforms
{
    __class__: 'UIUniforms';

    /**
     * UI几何体尺寸，在shader中进行对几何体缩放。
     */
    u_rect = new Vector4(0, 0, 100, 100);

    /**
     * 颜色
     */
    @serialize
    @oav()
    u_color = new Color4();

    /**
     * 纹理数据
     */
    @oav()
    @serialize
    s_texture = Texture2D.default;

    /**
     * 控制图片的显示区域。
     */
    u_uvRect = new Vector4(0, 0, 1, 1);
}

// TODO: UI 材质尚未重构为 Material 子类，暂用 StandardMaterial 占位注册
Material.setDefault('Default-UIMaterial', new StandardMaterial());
