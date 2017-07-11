namespace feng3d
{

    /**
     * 灯光
     * @author feng 2016-12-12
     */
    export class Light extends Component
    {
        static get lights()
        {
            return this._lights;
        }
        private static _lights: Light[] = [];

        /**
         * 灯光类型
         */
        lightType: LightType;

        /**
         * 颜色
         */
        color = new Color();

        /**
         * 光照强度
         */
        intensity = 1;

        /**
         * 是否生成阴影（未实现）
         */
        castsShadows = false;

        private _shadowMap: Texture2D = new Texture2D();
        get shadowMap()
        {
            return this._shadowMap;
        }

        constructor(gameObject: GameObject)
        {
            super(gameObject);
            Light._lights.push(this);
        }
    }
}