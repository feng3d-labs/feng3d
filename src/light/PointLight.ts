module feng3d
{

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
        @serialize()
        range = 600;

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