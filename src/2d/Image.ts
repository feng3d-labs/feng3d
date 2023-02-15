import { Camera3D } from '../3d/cameras/Camera3D';
import { Scene3D } from '../3d/core/Scene3D';
import { createNodeMenu } from '../core/CreateNodeMenu';
import { RegisterComponent } from '../ecs/Component';
import { Color4 } from '../math/Color4';
import { oav } from '../objectview/ObjectView';
import { RenderAtomic } from '../renderer/data/RenderAtomic';
import { Vec4 } from '../renderer/data/Uniforms';
import { SerializeProperty } from '../serialization/SerializeProperty';
import { Texture2D } from '../textures/Texture2D';
import { Component2D } from './core/Component2D';
import { Node2D } from './core/Node2D';

declare module '../ecs/Component' { interface ComponentMap { Image: Image } }

declare module '../renderer/data/Uniforms'
{
    interface Uniforms
    {
        /**
         * 漫反射贴图
         */
        s_texture: Texture2D;

        u_color: Vec4;

        u_uvRect: Vec4;
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
    image = Texture2D.default;

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
        const size = this.image.getSize();
        this.node2d.size.x = size.x;
        this.node2d.size.y = size.y;
    }

    beforeRender(renderAtomic: RenderAtomic, scene: Scene3D, camera: Camera3D)
    {
        super.beforeRender(renderAtomic, scene, camera);

        renderAtomic.uniforms.s_texture = this.image;
        renderAtomic.uniforms.u_color = this.color.toArray() as Vec4;
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

