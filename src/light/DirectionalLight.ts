namespace feng3d
{

    export interface ComponentRawMap
    {
        DirectionalLight: DirectionalLightRaw
    }

    export interface DirectionalLightRaw extends LightRaw
    {
        __class__?: "feng3d.DirectionalLight";
    }

    /**
     * 方向光源
     * @author feng 2016-12-13
     */
    export class DirectionalLight extends Light
    {
        /**
         * 构建
         */
        init(gameObject: GameObject)
        {
            super.init(gameObject);
            this.lightType = LightType.Directional;
        }
    }
}