namespace feng3d
{
    export class FogMethod extends RenderDataHolder
    {
        /**
		 * 出现雾效果的最近距离
		 */
        public get minDistance()
        {
            return this._minDistance;
        }
        public set minDistance(value)
        {
            this._minDistance = value;
        }
        private _minDistance = 0;
		/**
		 * 最远距离
		 */
        public get maxDistance()
        {
            return this._maxDistance;
        }
        public set maxDistance(value)
        {
            this._maxDistance = value;
        }
        private _maxDistance = 100;
        /**
		 * 雾的颜色
		 */
        public get fogColor()
        {
            return this._fogColor;
        }
        public set fogColor(value)
        {
            this._fogColor = value;
        }
        private _fogColor: Color;
        public get density()
        {
            return this._density;
        }
        public set density(value)
        {
            this.density = value;
        }
        private _density: number;
        /**
         * 雾模式
         */
        public get mode()
        {
            return this._mode;
        }
        public set mode(value)
        {
            this._mode = value;
        }
        private _mode: FogMode;

        /**
         * @param fogColor      雾颜色
         * @param minDistance   雾近距离
         * @param maxDistance   雾远距离
         * @param density       雾浓度
         */
        constructor(fogColor: Color = new Color(), minDistance = 0, maxDistance = 100, density = 0.1, mode = FogMode.LINEAR)
        {
            super();
            this._fogColor = fogColor;
            this._minDistance = minDistance;
            this._maxDistance = maxDistance;
            this._density = density;
            this._mode = mode;
            //
            this.createUniformData("u_fogColor", this._fogColor);
            this.createUniformData("u_fogMinDistance", this._minDistance);
            this.createUniformData("u_fogMaxDistance", this._maxDistance);
            this.createUniformData("u_fogDensity", this._density);
            this.createUniformData("u_fogMode", this._mode);
            this.createBoolMacro("HAS_FOG_METHOD", true);
            this.createAddMacro("V_GLOBAL_POSITION_NEED", 1);
        }
    }

    /**
     * 雾模式
     */
    export enum FogMode
    {
        NONE = 0,
        EXP = 1,
        EXP2 = 2,
        LINEAR = 3
    }
}