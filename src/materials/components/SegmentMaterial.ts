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
         * 构建颜色材质
         * @param color 颜色
         * @param alpha 透明的
         */
        constructor(color: Color = null) {

            super();
        }

        /**
         * 处理被添加组件事件
         */
        protected onBeAddedComponent(event: ComponentEvent): void {

            this.mapShaderParam(ShaderParamID.renderMode, this.renderMode);
        }
    }
}