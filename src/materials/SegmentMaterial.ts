module feng3d {

    /**
	 * 线段材质
	 * @author feng 2016-10-15
	 */
    export class SegmentMaterial extends Material {

        /**
         * 构建线段材质
         */
        constructor() {

            super();
            this.shaderName = "segment";
            this.renderMode = RenderMode.LINES;
        }
    }
}