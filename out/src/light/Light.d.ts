declare namespace feng3d {
    /**
     * 灯光
     * @author feng 2016-12-12
     */
    class Light extends Component {
        static readonly lights: Light[];
        private static _lights;
        /**
         * 灯光类型
         */
        lightType: LightType;
        /**
         * 颜色
         */
        color: Color;
        /**
         * 光照强度
         */
        intensity: number;
        /**
         * 是否生成阴影（未实现）
         */
        castsShadows: boolean;
        private _shadowMap;
        readonly shadowMap: Texture2D;
        constructor(gameObject: GameObject);
    }
}
