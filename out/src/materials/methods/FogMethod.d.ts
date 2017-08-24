declare namespace feng3d {
    class FogMethod extends RenderDataHolder {
        /**
         * 出现雾效果的最近距离
         */
        minDistance: number;
        private _minDistance;
        /**
         * 最远距离
         */
        maxDistance: number;
        private _maxDistance;
        /**
         * 雾的颜色
         */
        fogColor: Color;
        private _fogColor;
        density: number;
        private _density;
        /**
         * 雾模式
         */
        mode: FogMode;
        private _mode;
        /**
         * @param fogColor      雾颜色
         * @param minDistance   雾近距离
         * @param maxDistance   雾远距离
         * @param density       雾浓度
         */
        constructor(fogColor?: Color, minDistance?: number, maxDistance?: number, density?: number, mode?: FogMode);
    }
    /**
     * 雾模式
     */
    enum FogMode {
        NONE = 0,
        EXP = 1,
        EXP2 = 2,
        LINEAR = 3,
    }
}
