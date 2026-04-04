import { RegisterComponent } from '@feng3d/ecs';
import { Color4, Vector4 } from '@feng3d/math';
import { oav } from '@feng3d/objectview';
import { RenderAtomic, Texture2D } from '@feng3d/renderer';
import { SerializeProperty } from '@feng3d/serialization';

import { AssetData, Camera3D, Scene3D, createNodeMenu } from '@feng3d/core';
import { Component2D } from './core/Component2D';
import { Node2D } from './core/Node2D';

declare module '@feng3d/ecs' { interface ComponentMap { Image: Image } }

declare module '@feng3d/renderer'
{
    interface Uniforms
    {
        /**
         * 漫反射贴图
         */
        s_texture: Texture2D;

        u_color: Color4;

        u_uvRect: Vector4;
    }
}

/**
 * 图片组件
 *
 * 用于显示图片
 */
@RegisterComponent({ name: 'Image', menu: 'UI/Image' })
export class Image extends Component2D
{
    /**
     * The source texture of the Image element.
     *
     * 图像元素的源纹理。
     */
    @oav()
    @SerializeProperty()
    image = AssetData.getDefaultAssetData('Default-Texture');

    /**
     * Tinting color for this Image.
     *
     * 为该图像着色。
     */
    @oav()
    @SerializeProperty()
    color = new Color4();

    /**
     * 使图片显示实际尺寸
     */
    @oav({ tooltip: '使图片显示实际尺寸', componentParam: { label: 'ReSize' } })
    setNativeSize()
    {
        this.entity.size = this.image.getSize();
    }

    beforeRender(renderAtomic: RenderAtomic, scene: Scene3D, camera: Camera3D)
    {
        super.beforeRender(renderAtomic, scene, camera);

        renderAtomic.uniforms.s_texture = this.image;
        renderAtomic.uniforms.u_color = this.color;
    }
}

declare module './core/Node2D'
{
    interface PrimitiveNode2D
    {
        Image: Node2D;
    }
}

Node2D.registerPrimitive('Image', (g) =>
{
    g.addComponent('CanvasRenderer');

    g.size.x = 100;
    g.size.y = 100;
    g.addComponent('Image');
});

// 在 Hierarchy 界面新增右键菜单项
createNodeMenu.push(
    {
        path: 'UI/Image',
        priority: -2,
        click: () =>
            Node2D.createPrimitive('Image')
    }
);

