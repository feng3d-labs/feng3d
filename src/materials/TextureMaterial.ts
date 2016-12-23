module feng3d {

    /**
     * 纹理材质
     * @author feng 2016-12-23
     */
    export class TextureMaterial extends Material {

        public texture: Texture2D;

        /**
		 * 激活
		 * @param renderData	渲染数据
		 */
        public activate(renderData: RenderAtomic) {

            super.activate(renderData);
            //
            renderData.fragmentMacro.DIFFUSE_INPUT_TYPE = 2;
        }

        /**
		 * 释放
		 * @param renderData	渲染数据
		 */
        public deactivate(renderData: RenderAtomic) {

            renderData.fragmentMacro.DIFFUSE_INPUT_TYPE = 0;
            super.deactivate(renderData);
        }
    }
}