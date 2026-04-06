import { AddComponentMenu, Camera, Component, createNodeMenu, GameObject, RegisterComponent, Scene, Texture2D } from '@feng3d/core';
import { Vector4 } from '@feng3d/math';
import { oav } from '@feng3d/objectview';
import { decoratorRegisterClass } from '@feng3d/polyfill';
import { RenderAtomic } from '@feng3d/renderer';
import { serialize } from '@feng3d/serialization';
import { watcher } from '@feng3d/watcher';
import { CanvasRenderer } from './core/CanvasRenderer';
import { Transform2D } from './core/Transform2D';
import { drawText } from './text/drawText';
import { TextStyle } from './text/TextStyle';

declare global
{
    export interface MixinsComponentMap
    {
        Text: Text;
    }

    export interface MixinsPrimitiveGameObject
    {
        Text: GameObject;
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

    beforeRender(renderAtomic: RenderAtomic, scene: Scene, camera: Camera)
    {
        super.beforeRender(renderAtomic, scene, camera);

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
        renderAtomic.uniforms.s_texture = this._image;
        renderAtomic.uniforms.u_uvRect = this._uvRect;
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

GameObject.registerPrimitive('Text', (g) =>
{
    const transform2D = g.addComponent(Transform2D);
    g.addComponent(CanvasRenderer);

    transform2D.size.x = 160;
    transform2D.size.y = 30;
    g.addComponent(Text);
});

// 在 Hierarchy 界面新增右键菜单项
createNodeMenu.push(
    {
        path: 'UI/Text',
        priority: -2,
        click: () =>
            GameObject.createPrimitive('Text')
    }
);

