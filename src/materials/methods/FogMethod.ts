namespace feng3d
{
    export class FogMethod extends EventDispatcher
    {
        /**
         * 是否生效
         */
        @watch("enableChanged")
        @serialize()
        @oav()
        enable = false;

        /**
		 * 出现雾效果的最近距离
		 */
        @serialize()
        @oav()
        minDistance = 0;

		/**
		 * 最远距离
		 */
        @serialize()
        @oav()
        maxDistance = 100;

        /**
		 * 雾的颜色
		 */
        @serialize()
        @oav()
        fogColor: Color;

        @serialize()
        @oav()
        density: number;

        /**
         * 雾模式
         */
        @serialize()
        @oav()
        mode: FogMode;

        /**
         * @param fogColor      雾颜色
         * @param minDistance   雾近距离
         * @param maxDistance   雾远距离
         * @param density       雾浓度
         */
        constructor(fogColor = new Color(), minDistance = 0, maxDistance = 100, density = 0.1, mode = FogMode.LINEAR)
        {
            super();
            this.fogColor = fogColor;
            this.minDistance = minDistance;
            this.maxDistance = maxDistance;
            this.density = density;
            this.mode = mode;
        }

        private enableChanged()
        {
        }

        preRender(renderAtomic: RenderAtomic)
        {
            //
            renderAtomic.uniforms.u_fogColor = () => this.fogColor;
            renderAtomic.uniforms.u_fogMinDistance = () => this.minDistance;
            renderAtomic.uniforms.u_fogMaxDistance = () => this.maxDistance;
            renderAtomic.uniforms.u_fogDensity = () => this.density;
            renderAtomic.uniforms.u_fogMode = () => this.mode;

            renderAtomic.shaderMacro.B_HAS_FOG_METHOD = this.enable;
            renderAtomic.shaderMacro.A_V_GLOBAL_POSITION_NEED = 1;
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