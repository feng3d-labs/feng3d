module feng3d
{

    /**
     * 方向光源
     * @author feng 2016-12-13
     */
    export class DirectionalLight extends Light
    {
        /**
         * 构建
         */
        constructor()
        {
            super();
            this.type = LightType.Directional;
        }
    }
}