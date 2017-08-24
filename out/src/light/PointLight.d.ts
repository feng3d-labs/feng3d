declare namespace feng3d {
    /**
     * 点光源
     * @author feng 2016-12-13
     */
    class PointLight extends Light {
        static readonly pointLights: PointLight[];
        private static _pointLights;
        /**
         * 光照范围
         */
        range: number;
        /**
         * 灯光位置
         */
        readonly position: Vector3D;
        /**
         * 构建
         */
        constructor(gameObject: GameObject);
    }
}
