module feng3d
{

    /**
     * 灯光
     * @author feng 2016-12-12
     */
    export class Light extends Object3DComponent
    {

        /**
         * 灯光类型
         */
        public lightType: LightType;

        /**
         * 颜色
         */
        public color = new Color();

        /**
         * 光照强度
         */
        public intensity: number = 1;

        /**
         * 是否生成阴影（未实现）
         */
        public castsShadows = false;

        private _shadowMap: Texture2D = new Texture2D();
        public get shadowMap()
        {
            return this._shadowMap;
        }

        constructor()
        {
            super();
        }
    }
}