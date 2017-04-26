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
        public range = 600;

        /**
         * 灯光位置
         */
        public get position()
        {
            return this.parentComponent.scenePosition;
        }

        /**
         * 构建
         */
        constructor()
        {
            super();
            this.lightType = LightType.Point;
        }
    }
}