namespace feng3d
{
    export interface ComponentMap { Text: feng2d.Text; }
}

namespace feng2d
{
    /**
     * 文本组件
     * 
     * 用于显示文字。
     */
    @feng3d.AddComponentMenu("UI/Text")
    @feng3d.RegisterComponent()
    export class Text extends feng3d.Component
    {
        /**
         * 文本内容。
         */
        @feng3d.oav()
        @feng3d.serialize
        @feng3d.watch("invalidate")
        text = "Hello 🌷 world\nHello 🌷 world";

        /**
         * 是否根据文本自动调整宽高。
         */
        @feng3d.oav({ tooltip: "是否根据文本自动调整宽高。" })
        @feng3d.serialize
        autoSize = true;

        @feng3d.oav()
        @feng3d.serialize
        @feng3d.watch("_styleChanged")
        style = new TextStyle();

        /**
         * 显示图片的区域，(0, 0, 1, 1)表示完整显示图片。
         */
        private _uvRect = new feng3d.Vector4(0, 0, 1, 1);

        private _image = new feng3d.Texture2D();
        private _canvas: HTMLCanvasElement;
        private _invalid = true;

        beforeRender(renderAtomic: feng3d.RenderAtomic, scene: feng3d.Scene, camera: feng3d.Camera)
        {
            super.beforeRender(renderAtomic, scene, camera);

            var canvas = this._canvas;

            if (!this._canvas || this._invalid)
            {
                canvas = this._canvas = drawText(this._canvas, this.text, this.style);
                this._image["_pixels"] = canvas; this._image.wrapS
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

        private _styleChanged(property: string, oldValue: TextStyle, newValue: TextStyle)
        {
            if (oldValue) oldValue.off("changed", this.invalidate, this);
            if (newValue) newValue.on("changed", this.invalidate, this);
        }
    }
}

namespace feng3d
{

    GameObject.registerPrimitive("Text", (g) =>
    {
        var transform2D = g.addComponent(feng2d.Transform2D);
        g.addComponent(feng2d.CanvasRenderer);

        transform2D.size.x = 160;
        transform2D.size.y = 30;
        g.addComponent(feng2d.Text)
    });

    export interface PrimitiveGameObject
    {
        Text: GameObject;
    }

    // 在 Hierarchy 界面新增右键菜单项
    createNodeMenu.push(
        {
            path: "UI/Text",
            priority: -2,
            click: () =>
            {
                return GameObject.createPrimitive("Text");
            }
        }
    );

}