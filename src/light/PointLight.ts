module feng3d
{

    /**
     * 点光源
     * @author feng 2016-12-13
     */
    export class PointLight extends Light
    {

        /**
         * 最小半径
         */
        public radius: number;

        /**
         * 可照射最大距离
         */
        public fallOff: number;

        /**
         * 构建
         */
        constructor()
        {
            super();
            this.type = LightType.Point;
        }
    }
}