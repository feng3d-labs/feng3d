declare namespace feng3d {
    /**
     * 方向光源
     * @author feng 2016-12-13
     */
    class DirectionalLight extends Light {
        static readonly directionalLights: DirectionalLight[];
        private static _directionalLights;
        private _direction;
        private _sceneDirection;
        /**
         * 构建
         */
        constructor(gameObject: GameObject);
        readonly sceneDirection: Vector3D;
        /**
         * 光照方向
         */
        direction: Vector3D;
        protected onScenetransformChanged(): void;
        /**
         * 销毁
         */
        dispose(): void;
    }
}
