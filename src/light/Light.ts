namespace feng3d
{

    export interface LightRaw
    {
        /**
         * 灯光类型
         */
        lightType?: LightType;

        /**
         * 颜色
         */
        color?: Color3 | Color3Raw;

        /**
         * 光照强度
         */
        intensity?: number;

        /**
         * 是否生成阴影（未实现）
         */
        castsShadows?: boolean;

    }

    /**
     * 灯光
     * @author feng 2016-12-12
     */
    export class Light extends Behaviour
    {
        /**
         * 灯光类型
         */
        @serialize
        lightType: LightType;

        /**
         * 颜色
         */
        @oav()
        @serialize
        color = new Color3();

        /**
         * 光照强度
         */
        @oav()
        @serialize
        intensity = 1;

        /**
         * 是否生成阴影（未实现）
         */
        @oav()
        @serialize
        castsShadows = false;

        private _shadowMap: Texture2D = new Texture2D();
        get shadowMap()
        {
            return this._shadowMap;
        }

        init(gameObject: GameObject)
        {
            super.init(gameObject);
        }
    }
}