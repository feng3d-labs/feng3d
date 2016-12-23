module feng3d {

    /**
     * 材质
     * @author feng 2016-05-02
     */
    export class Material extends RenderDataHolder {

        protected shaderName: string = "default";

        private _pass: MaterialPassBase;

        /**
        * 渲染模式
        */
        renderMode = RenderMode.TRIANGLES;

        /**
         * 渲染通道
         */
        public get pass(): MaterialPassBase {

            return this._pass;
        }

        public set pass(value: MaterialPassBase) {

            this._pass && this.removeComponent(this._pass);
            this._pass = value;
            this._pass && this.addComponent(this._pass);
        }

        /**
         * 构建材质
         */
        constructor() {

            super();
            this.pass = new MaterialPassBase();
        }

        /**
		 * 激活
		 * @param renderData	渲染数据
		 */
        public activate(renderData: RenderAtomic) {

            //
            super.activate(renderData);
            //
            renderData.shaderName = this.shaderName;
            renderData.fragmentMacro.DIFFUSE_INPUT_TYPE = 0;
        }

        /**
		 * 释放
		 * @param renderData	渲染数据
		 */
        public deactivate(renderData: RenderAtomic) {

            renderData.shaderName = null;
            renderData.fragmentMacro.DIFFUSE_INPUT_TYPE = 0;
            super.deactivate(renderData);
        }
    }
}