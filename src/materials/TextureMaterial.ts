module feng3d {

    /**
     * 纹理材质
     * @author feng 2016-12-23
     */
    export class TextureMaterial extends Material {

        private _texture: Texture2D;

        public get texture() {
            return this._texture;
        }

        public set texture(value: Texture2D) {
            if (this._texture != null) {
                this.removeComponent(this._texture);
            }
            this._texture = value;
            if (this._texture != null) {
                this.addComponent(this._texture);
            }
        }

        /**
		 * 激活
		 * @param renderData	渲染数据
		 */
        public activate(renderData: RenderAtomic) {

            super.activate(renderData);
            //
            renderData.fragmentMacro.DIFFUSE_INPUT_TYPE = 2;
            renderData.fragmentMacro.NEED_UV++;
            renderData.fragmentMacro.NEED_UV_V++;
        }

        /**
		 * 释放
		 * @param renderData	渲染数据
		 */
        public deactivate(renderData: RenderAtomic) {

            renderData.fragmentMacro.DIFFUSE_INPUT_TYPE = 0;
            renderData.fragmentMacro.NEED_UV--;
            renderData.fragmentMacro.NEED_UV_V--;
            super.deactivate(renderData);
        }
    }
}