namespace feng3d
{

    /**
     * 点光源
     * @author feng 2016-12-13
     */
    export class PointLight extends Light
    {
        static get pointLights()
        {
            return this._pointLights;
        }
        private static _pointLights: PointLight[] = [];

        /**
         * 光照范围
         */
        range = 600;

        /**
         * 灯光位置
         */
        get position()
        {
            return this.gameObject.transform.scenePosition;
        }

        /**
         * 构建
         */
        constructor(gameObject:GameObject)
        {
            super(gameObject);
            this.lightType = LightType.Point;
            PointLight._pointLights.push(this);
        }
    }
}