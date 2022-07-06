namespace feng3d
{
    export interface ComponentMap { Rect: feng2d.Rect; }
}


namespace feng2d
{
    /**
     * 矩形纯色组件
     * 
     * 用于填充UI中背景等颜色。
     */
    @feng3d.AddComponentMenu("UI/Rect")
    @feng3d.RegisterComponent()
    export class Rect extends feng3d.Component
    {
        /**
         * 填充颜色。
         */
        @feng3d.oav()
        @feng3d.serialize
        color = new feng3d.Color4();

        beforeRender(renderAtomic: feng3d.RenderAtomic, scene: feng3d.Scene, camera: feng3d.Camera)
        {
            super.beforeRender(renderAtomic, scene, camera);

            renderAtomic.uniforms.u_color = this.color;
        }
    }
}

namespace feng3d
{
    GameObject.registerPrimitive("Rect", (g) =>
    {
        var transform2D = g.addComponent("Transform2D");
        g.addComponent("CanvasRenderer");

        transform2D.size.x = 100;
        transform2D.size.y = 100;
        g.addComponent("Rect")
    });

    export interface PrimitiveGameObject
    {
        Rect: GameObject;
    }
}