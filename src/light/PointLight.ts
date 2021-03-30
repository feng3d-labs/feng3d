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

        @AddEntityMenu("Light/Point Light")
        static create(name = "Point Light")
        {
            var pointlight = new Entity().addComponent(PointLight);
            pointlight.name = name;
            return pointlight;
        }

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

    Entity.registerPrimitive("Point light", (g) =>
    {
        g.addComponent(PointLight);
    });

    export interface PrimitiveEntity
    {
        "Point light": Entity;
    }
}