namespace feng3d
{

    export interface ComponentMap { PointLight: PointLight; }

    /**
     * 点光源
     */
    @AddComponentMenu("Rendering/PointLight")
    @RegisterComponent()
    export class PointLight extends Light
    {
        __class__: "feng3d.PointLight";

        lightType = LightType.Point;

        /**
         * 光照范围
         */
        @oav()
        @serialize
        get range()
        {
            return this._range;
        }
        set range(v)
        {
            if (this._range == v) return;
            this._range = v;
            this.invalidRange();
        }
        private _range = 10;

        /**
         * 阴影图尺寸
         */
        get shadowMapSize()
        {
            return this.shadowMap.getSize().multiply(new Vector2(1 / 4, 1 / 2));
        }

        constructor()
        {
            super();
            this.shadowCamera.lens = new PerspectiveLens(90, 1, 0.1, this.range);
        }

        private invalidRange()
        {
            if (this.shadowCamera)
                this.shadowCamera.lens.far = this.range;
        }
    }

    GameObject.registerPrimitive("Point Light", (g) =>
    {
        g.addComponent(PointLight);
    });

    export interface PrimitiveGameObject
    {
        "Point Light": GameObject;
    }

    // 在 Hierarchy 界面新增右键菜单项
    createNodeMenu.push(
        {
            path: "Light/Point Light",
            priority: -1,
            click: () =>
            {
                return GameObject.createPrimitive("Point Light");
            }
        }
    );

}