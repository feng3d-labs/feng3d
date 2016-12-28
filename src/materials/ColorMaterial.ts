module feng3d {

    /**
     * 颜色材质
     * @author feng 2016-05-02
     */
    export class ColorMaterial extends Material {

        /** 
         * 颜色 
         */
        public color: Color;

        /**
         * 构建颜色材质
         * @param color 颜色
         * @param alpha 透明的
         */
        constructor(color: Color = null) {

            super();
            this.color = color || new Color();
        }

        /**
		 * 激活
		 * @param renderData	渲染数据
		 */
        public activate(renderData: RenderAtomic) {

            super.activate(renderData);
            //
            renderData.uniforms[RenderDataID.u_diffuseInput] = new Vector3D(this.color.r, this.color.g, this.color.b, this.color.a);
            renderData.fragmentMacro.DIFFUSE_INPUT_TYPE = 1;
        }

        /**
		 * 释放
		 * @param renderData	渲染数据
		 */
        public deactivate(renderData: RenderAtomic) {

            delete renderData.uniforms[RenderDataID.u_diffuseInput];
            renderData.fragmentMacro.DIFFUSE_INPUT_TYPE = 0;
            super.deactivate(renderData);
        }
    }
}