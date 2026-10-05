import { AddComponentMenu, Camera, Component, createNodeMenu, createPrimitive, Object3D, RegisterComponent, registerPrimitive, Scene, Texture2D } from 'feng3d';
import { reactive } from '@feng3d/reactivity';
import { Color4 } from '@feng3d/math';
import { oav } from '@feng3d/objectview';
import { decoratorRegisterClass } from '@feng3d/polyfill';
import { serialize } from '@feng3d/serialization';
import { RenderObject } from '@feng3d/webgpu';
import { CanvasRenderer } from './core/CanvasRenderer';
import { Transform2D } from './core/Transform2D';

/**
 * 承载 UI uniform 的渲染对象。
 *
 * RenderObject 本身未声明 uniforms 字段；UI 组件在 WebGPU 迁移过渡期仍按 uniforms 写入，
 * 这里通过扩展类型安全地访问该字段。
 */
type UIRenderObject = RenderObject & { uniforms: Record<string, unknown> };

declare global
{
    export interface MixinsComponentMap
    {
        Image: Image
    }

    export interface MixinsPrimitiveObject3D
    {
        Image: Object3D;
    }
}

/**
 * 图片组件
 *
 * 用于显示图片
 */
@AddComponentMenu('UI/Image')
@RegisterComponent()
@decoratorRegisterClass()
export class Image extends Component
{
    /**
     * The source texture of the Image element.
     *
     * 图像元素的源纹理。
     */
    @oav()
    @serialize
    image = Texture2D.default;

    /**
     * Tinting color for this Image.
     *
     * 为该图像着色。
     */
    @oav()
    @serialize
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

    beforeRender(renderObject: UIRenderObject, scene: Scene, camera: Camera)
    {
        super.beforeRender(renderObject, scene, camera);

        renderObject.uniforms.s_texture = this.image;
        renderObject.uniforms.u_color = this.color;
    }
}

registerPrimitive('Image', (g) =>
{
    const transform2D = new Transform2D(); reactive(g).components.push(transform2D); transform2D.setObject3D(g); transform2D.init();
    const cr = new CanvasRenderer(); reactive(g).components.push(cr); cr.setObject3D(g); cr.init();

    transform2D.size.x = 100;
    transform2D.size.y = 100;
    const img = new Image(); reactive(g).components.push(img); img.setObject3D(g); img.init();
});

// 在 Hierarchy 界面新增右键菜单项
createNodeMenu.push(
    {
        path: 'UI/Image',
        priority: -2,
        click: () =>
            createPrimitive('Image')
    }
);

