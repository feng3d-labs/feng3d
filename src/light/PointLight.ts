namespace feng3d
{
    
    export interface ComponentMap { PointLight: PointLight; }
    
    /**
     * 点光源
     */
    export class PointLight extends Light
    {
        __class__: "feng3d.PointLight" = "feng3d.PointLight";
        
        lightType = LightType.Point;

        /**
         * 光照范围
         */
        @oav()
        @serialize
        @watch("invalidRange")
        range = 10;

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
}