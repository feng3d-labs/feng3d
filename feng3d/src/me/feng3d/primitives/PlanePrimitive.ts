module me.feng3d {
    /**
     * 平面基元
     * @author feng 2016-04-30
     */
    export class PlanePrimitive {
        /**
         * 宽度
         */
        public width: number;
        /**
         * 高度
         */
        public height: number;
        /**
         * 横向分割数
         */
        public segmentsW: number;
        /**
         * 纵向分割数
         */
        public segmentsH: number;
        /**
         * 正面朝向 true:Y+ false:Z+
         */
        public yUp: boolean;
        /**
         * 是否双面
         */
        public doubleSided: boolean;

        /**
         * 构建平面基元
		 * @param width 宽度
		 * @param height 高度
		 * @param segmentsW 横向分割数
		 * @param segmentsH 纵向分割数
		 * @param yUp 正面朝向 true:Y+ false:Z+
		 * @param doubleSided 是否双面 
         */
        constructor(width = 100, height = 100, segmentsW = 1, segmentsH = 1, yUp = true, doubleSided = false) {

            this.segmentsW = segmentsW;
            this.segmentsH = segmentsH;
            this.yUp = yUp;
            this.width = width;
            this.height = height;
            this.doubleSided = doubleSided;
        }
    }
}