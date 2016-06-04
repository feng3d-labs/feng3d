module me.feng3d {

	/**
	 * 顶点数据缓冲
	 * @author feng 2014-8-14
	 */
    export class VABuffer {

        /** 顶点数据 */
        data: Float32Array;

        /** 与每个顶点关联的 32 位（4 字节）数据值的数量。 */
        size: number;

        getBuffer(context3D: WebGLRenderingContext) {

            var buffer = Context3DBufferCenter.getInstance(context3D)//
                .getVABuffer(this.data);
            return buffer;
        }
    }
}
