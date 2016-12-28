module feng3d {

    /**
	 * 线段材质
	 * @author feng 2016-10-15
	 */
    export class SegmentMaterial extends Material {

        /**
        * 渲染模式
        */
        renderMode = RenderMode.LINES;

        /**
         * 构建线段材质
         */
        constructor() {

            super();
            this.renderData.shaderName = "segment";
        }

        /**
         * 激活
         * @param renderData	渲染数据
         */
        public activate(renderData: RenderAtomic, camera: Camera3D) {

            //
            renderData.shaderParams.renderMode = this.renderMode;
            //
            super.activate(renderData, camera);
        }

        /**
		 * 释放
		 * @param renderData	渲染数据
		 */
        public deactivate(renderData: RenderAtomic) {

            renderData.shaderParams.renderMode = RenderMode.DEFAULT;
            super.deactivate(renderData);
        }
    }
}