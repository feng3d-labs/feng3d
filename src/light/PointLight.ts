namespace feng3d
{
    export interface ComponentRawMap
    {
        PointLight: PointLightRaw
    }

    export interface PointLightRaw extends LightRaw
    {
        __class__?: "feng3d.PointLight";

        /**
         * 光照范围
         */
        range?: number;
    }

    /**
     * 点光源
     * @author feng 2016-12-13
     */
    export class PointLight extends Light
    {
        /**
         * 光照范围
         */
        @oav()
        @serialize
        range = 10;

        /**
         * 构建
         */
        init(gameObject: GameObject)
        {
            super.init(gameObject);
            this.lightType = LightType.Point;
        }
    }
}