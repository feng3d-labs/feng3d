module feng3d {

    /**
     * 2D纹理
     * @author feng 2016-12-20
     */
    export class Texture2D extends RenderDataHolder {

        public autoGenerateMip: boolean;

        public pixels?: ImageData | HTMLVideoElement | HTMLImageElement | HTMLCanvasElement;

        /**
		 * 激活
		 * @param renderData	渲染数据
		 */
        public activate(renderData: RenderAtomic) {

            super.activate(renderData);
            //
            renderData.uniforms[RenderDataID.texture_fs] = this.pixels;
        }

        /**
		 * 释放
		 * @param renderData	渲染数据
		 */
        public deactivate(renderData: RenderAtomic) {

            renderData.uniforms[RenderDataID.texture_fs] = null;
            //
            super.deactivate(renderData);
        }
    }
}