import { Camera } from '../core/cameras/Camera';
import { RegisterComponent, Component } from '../ecs/Component';
import { Node3D } from '../core/core/Node3D';
import { AddComponentMenu } from '../core/Menu';
import { createNodeMenu } from '../core/menu/CreateNodeMenu';
import { Scene } from '../core/scene/Scene';
import { Texture2D } from '../core/textures/Texture2D';
import { Color4 } from '../math/Color4';
import { oav } from '../objectview/ObjectView';
import { RenderAtomic } from '../renderer/data/RenderAtomic';
import { Serializable } from '../serialization/Serializable';
import { SerializeProperty } from '../serialization/SerializeProperty';
import { CanvasRenderer } from './core/CanvasRenderer';
import { Node2D } from './core/Node2D';

declare global
{
    export interface MixinsComponentMap
    {
        Image: Image
    }

    export interface MixinsPrimitiveNode3D
    {
        Image: Node3D;
    }
}

/**
 * 图片组件
 *
 * 用于显示图片
 */
@AddComponentMenu('UI/Image')
@RegisterComponent()
@Serializable()
export class Image extends Component
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
        const imagesize = this.image.getSize();
        this.transform2D.size.x = imagesize.x;
        this.transform2D.size.y = imagesize.y;
    }

    beforeRender(renderAtomic: RenderAtomic, scene: Scene, camera: Camera)
    {
        super.beforeRender(renderAtomic, scene, camera);

        renderAtomic.uniforms.s_texture = this.image;
        renderAtomic.uniforms.u_color = this.color;
    }
}

Node3D.registerPrimitive('Image', (g) =>
{
    const transform2D = g.addComponent(Node2D);
    g.addComponent(CanvasRenderer);

    transform2D.size.x = 100;
    transform2D.size.y = 100;
    g.addComponent(Image);
});

// 在 Hierarchy 界面新增右键菜单项
createNodeMenu.push(
    {
        path: 'UI/Image',
        priority: -2,
        click: () =>
            Node3D.createPrimitive('Image')
    }
);

