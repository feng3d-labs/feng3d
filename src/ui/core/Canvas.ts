namespace feng3d { export interface ComponentMap { Canvas: feng2d.Canvas } }

namespace feng2d
{
    /**
     * Element that can be used for screen rendering.
     * 
     * 能够被用于屏幕渲染的元素
     */
    @feng3d.RegisterComponent()
    export class Canvas extends feng3d.Behaviour
    {
        /**
         * Is the Canvas in World or Overlay mode?
         * 
         * 画布是在世界或覆盖模式?
         */
        @feng3d.serialize
        @feng3d.oav({ component: "OAVEnum", tooltip: "画布是在世界或覆盖模式", componentParam: { enumClass: UIRenderMode } })
        renderMode = UIRenderMode.ScreenSpaceOverlay;

        /**
         * 获取鼠标射线（与鼠标重叠的摄像机射线）
         */
        mouseRay = new feng3d.Ray3(new feng3d.Vector3(), new feng3d.Vector3(0, 0, 1));

        /**
         * 投影矩阵
         * 
         * 渲染前自动更新
         */
        projection = new feng3d.Matrix4x4();

        /**
         * 最近距离
         */
        @feng3d.serialize
        @feng3d.oav()
        near = -1000;

        /**
         * 最远距离
         */
        @feng3d.serialize
        @feng3d.oav()
        far = 10000;

        init()
        {
            // this.transform.hideFlags = this.transform.hideFlags | HideFlags.Hide;
            // this.gameObject.hideFlags = this.gameObject.hideFlags | HideFlags.DontTransform;
        }

        /**
         * 更新布局     
         * 
         * @param width 画布宽度
         * @param height 画布高度
         */
        layout(width: number, height: number)
        {
            this.transform2D.size.x = width;
            this.transform2D.size.y = height;

            this.transform2D.pivot.set(0, 0);

            this.transform.x = 0;
            this.transform.y = 0;
            this.transform.z = 0;

            this.transform.rx = 0;
            this.transform.ry = 0;
            this.transform.rz = 0;

            this.transform.sx = 1;
            this.transform.sy = 1;
            this.transform.sz = 1;

            var near = this.near;
            var far = this.far;
            this.projection.identity().appendTranslation(0, 0, -(far + near) / 2).appendScale(2 / width, -2 / height, 2 / (far - near)).appendTranslation(-1, 1, 0);
        }

        /**
         * 计算鼠标射线
         * 
         * @param view 
         */
        calcMouseRay3D(view: feng3d.View)
        {
            this.mouseRay.origin.set(view.mousePos.x, view.mousePos.y, 0);
        }
    }
}

namespace feng3d
{
    GameObject.registerPrimitive("Canvas", (g) =>
    {
        g.addComponent(feng2d.Transform2D);
        g.addComponent(feng2d.Canvas);
    });

    export interface PrimitiveGameObject
    {
        Canvas: GameObject;
    }
}