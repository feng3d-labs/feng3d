module me.feng3d {

    /**
     * 颜色材质
     * @author feng 2016-05-02
     */
    export class ColorMaterial extends Material {

        color: number;

        /**
         * 构建颜色材质
         * @param color 颜色
         */
        constructor(color: number = 0xcccccc) {

            super();
            this.color = color;
        }
    }
}