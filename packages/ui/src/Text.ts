import { AddComponentMenu, Camera, Component, createNodeMenu, createPrimitive, Object3D, RegisterComponent, registerPrimitive, Scene, Texture2D } from 'feng3d';
import { reactive } from '@feng3d/reactivity';
import { Vector4 } from '@feng3d/math';
import { oav } from '@feng3d/objectview';
import { decoratorRegisterClass } from '@feng3d/polyfill';
import { serialize } from '@feng3d/serialization';
import { watcher } from '@feng3d/watcher';
import { RenderObject } from '@feng3d/webgpu';
import { CanvasRenderer } from './core/CanvasRenderer';
import { Transform2D } from './core/Transform2D';
import { drawText } from './text/drawText';
import { TextStyle } from './text/TextStyle';

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
        Text: Text;
    }

    export interface MixinsPrimitiveObject3D
    {
        Text: Object3D;
    }
}

/**
 * 文本组件
 *
 * 用于显示文字。
 */
@AddComponentMenu('UI/Text')
@RegisterComponent()
@decoratorRegisterClass()
export class Text extends Component
{
    /**
     * 文本内容。
     */
    @oav()
    @serialize
    text = 'Hello 🌷 world\nHello 🌷 world';

    /**
     * 是否根据文本自动调整宽高。
     */
    @oav({ tooltip: '是否根据文本自动调整宽高。' })
    @serialize
    autoSize = true;

    @oav()
    @serialize
    style = new TextStyle();

    /**
     * 显示图片的区域，(0, 0, 1, 1)表示完整显示图片。
     */
    private _uvRect = new Vector4(0, 0, 1, 1);

    private _image = new Texture2D();
    private _canvas: HTMLCanvasElement;
    private _invalid = true;

    constructor()
    {
        super();
        watcher.watch(this as Text, 'text', this.invalidate, this);
        watcher.watch(this as Text, 'style', this._styleChanged, this);
    }

    beforeRender(renderObject: UIRenderObject, scene: Scene, camera: Camera)
    {
        super.beforeRender(renderObject, scene, camera);

        let canvas = this._canvas;

        if (!this._canvas || this._invalid)
        {
            canvas = this._canvas = drawText(this._canvas, this.text, this.style);
            this._image['_pixels'] = canvas; this._image.wrapS;
            this._image.invalidate();
            this._invalid = false;
        }

        if (this.autoSize)
        {
            this.transform2D.size.x = canvas.width;
            this.transform2D.size.y = canvas.height;
        }

        // 调整缩放使得更改尺寸时文字不被缩放。
        this._uvRect.z = this.transform2D.size.x / canvas.width;
        this._uvRect.w = this.transform2D.size.y / canvas.height;

        //
        renderObject.uniforms.s_texture = this._image;
        renderObject.uniforms.u_uvRect = this._uvRect;
    }

    invalidate()
    {
        this._invalid = true;
    }

    private _styleChanged(newValue: TextStyle, oldValue: TextStyle)
    {
        if (oldValue) oldValue.off('changed', this.invalidate, this);
        if (newValue) newValue.on('changed', this.invalidate, this);
    }
}

registerPrimitive('Text', (g) =>
{
    const transform2D = new Transform2D(); reactive(g).components.push(transform2D); transform2D.setObject3D(g); transform2D.init();
    const cr = new CanvasRenderer(); reactive(g).components.push(cr); cr.setObject3D(g); cr.init();

    transform2D.size.x = 160;
    transform2D.size.y = 30;
    const text = new Text(); reactive(g).components.push(text); text.setObject3D(g); text.init();
});

// 在 Hierarchy 界面新增右键菜单项
createNodeMenu.push(
    {
        path: 'UI/Text',
        priority: -2,
        click: () =>
            createPrimitive('Text')
    }
);

