module feng3d
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
            this.invalidateRenderData();
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
            this.invalidateRenderData();
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
            this.invalidateRenderData();
        }
        private _fogColor: Color;
        public get density()
        {
            return this._density;
        }
        public set density(value)
        {
            this.density = value;
            this.invalidateRenderData();
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
            this.invalidateRenderData();
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
            this.invalidateRenderData();
        }

        /**
		 * 更新渲染数据
		 */
        public updateRenderData(renderContext: RenderContext, renderData: RenderAtomic)
        {
            renderData.shaderMacro.boolMacros.HAS_FOG_METHOD = true;
            renderData.uniforms[RenderDataID.u_fogColor] = this._fogColor;
            renderData.uniforms[RenderDataID.u_fogMinDistance] = this._minDistance;
            renderData.uniforms[RenderDataID.u_fogMaxDistance] = this._maxDistance;
            renderData.uniforms[RenderDataID.u_fogDensity] = this._density;
            renderData.uniforms[RenderDataID.u_fogMode] = this._mode;
            //
            renderData.shaderMacro.addMacros.V_GLOBAL_POSITION_NEED++;
            //
            super.updateRenderData(renderContext, renderData);
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