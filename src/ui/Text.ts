import { Camera3D, CanvasTexture2D, Scene3D, createNodeMenu } from '@feng3d/core';
import { RegisterComponent } from '@feng3d/ecs';
import { Vector4 } from '@feng3d/math';
import { oav } from '../../objectview/ObjectView';
import { RenderAtomic } from '@feng3d/renderer';
import { SerializeProperty } from '@feng3d/serialization';
import { watcher } from '@feng3d/watcher';
import { Component2D } from './core/Component2D';
import { Node2D } from './core/Node2D';
import { TextStyle } from './text/TextStyle';
import { drawText } from './text/drawText';

declare module '@feng3d/ecs' { interface ComponentMap { Text: Text; } }

declare module './core/Node2D' { export interface PrimitiveNode2D { Text: Node2D; } }

/**
 * 文本组件
 *
 * 用于显示文字。
 */
@RegisterComponent({ name: 'Text', menu: 'UI/Text' })
export class Text extends Component2D
{
    /**
     * 文本内容。
     */
    @oav()
    @SerializeProperty()
    text = 'Hello 🌷 world\nHello 🌷 world';

    /**
     * 是否根据文本自动调整宽高。
     */
    @oav({ tooltip: '是否根据文本自动调整宽高。' })
    @SerializeProperty()
    autoSize = true;

    @oav()
    @SerializeProperty()
    style = new TextStyle();

    /**
     * 显示图片的区域，(0, 0, 1, 1)表示完整显示图片。
     */
    private _uvRect = new Vector4(0, 0, 1, 1);

    private _image = new CanvasTexture2D();
    private _canvas: HTMLCanvasElement;
    private _invalid = true;

    constructor()
    {
        super();
        watcher.watch(this as Text, 'text', this.invalidate, this);
        watcher.watch(this as Text, 'style', this._styleChanged, this);
    }

    beforeRender(renderAtomic: RenderAtomic, scene: Scene3D, camera: Camera3D)
    {
        super.beforeRender(renderAtomic, scene, camera);

        let canvas = this._canvas;

        if (!this._canvas || this._invalid)
        {
            canvas = this._canvas = drawText(this._canvas, this.text, this.style);
            this._image.canvas = canvas;
            this._invalid = false;
        }

        if (this.autoSize)
        {
            this.entity.size.x = canvas.width;
            this.entity.size.y = canvas.height;
        }

        // 调整缩放使得更改尺寸时文字不被缩放。
        this._uvRect.z = this.entity.size.x / canvas.width;
        this._uvRect.w = this.entity.size.y / canvas.height;

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

Node2D.registerPrimitive('Text', (g) =>
{
    g.addComponent('CanvasRenderer');

    g.size.x = 160;
    g.size.y = 30;
    g.addComponent('Text');
});

// 在 Hierarchy 界面新增右键菜单项
createNodeMenu.push(
    {
        path: 'UI/Text',
        priority: -2,
        click: () =>
            Node2D.createPrimitive('Text')
    }
);

