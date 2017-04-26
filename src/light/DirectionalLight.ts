module feng3d
{
    /**
     * 方向光源
     * @author feng 2016-12-13
     */
    export class DirectionalLight extends Light
    {
        /**
         * 光照方向
         */
        public get direction()
        {
            return this.parentComponent.sceneTransform.forward;
        }

        /**
         * 构建
         */
        constructor()
        {
            super();
            this.lightType = LightType.Directional;
        }
    }
}