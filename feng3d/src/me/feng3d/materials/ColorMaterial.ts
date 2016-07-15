module me.feng3d {

    /**
     * 颜色材质
     * @author feng 2016-05-02
     */
    export class ColorMaterial extends Material {

        /**
         * 颜色
         */
        color: number;

        /**
         * 透明度
         */
        alpha: number;

        /**
         * 构建颜色材质
         * @param color 颜色
         * @param alpha 透明的
         */
        constructor(color: number = 0xcccccc, alpha: number = 1) {

            super();
            this.color = color;
            this.alpha = alpha;

            //  this.mapUniformBuffer();
        }
    }
}