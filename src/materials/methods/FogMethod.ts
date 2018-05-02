namespace feng3d
{
    export class FogMethod extends RenderDataHolder
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
            //
            this.createUniformData("u_fogColor", () => this.fogColor);
            this.createUniformData("u_fogMinDistance", () => this.minDistance);
            this.createUniformData("u_fogMaxDistance", () => this.maxDistance);
            this.createUniformData("u_fogDensity", () => this.density);
            this.createUniformData("u_fogMode", () => this.mode);
            this.createBoolMacro("B_HAS_FOG_METHOD", this.enable);
            this.createAddMacro("A_V_GLOBAL_POSITION_NEED", 1);
        }

        private enableChanged()
        {
            this.createBoolMacro("B_HAS_FOG_METHOD", this.enable);
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