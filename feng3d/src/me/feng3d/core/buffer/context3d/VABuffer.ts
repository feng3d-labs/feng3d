module me.feng3d {

	/**
	 * 顶点数据缓冲
	 * @author feng 2014-8-14
	 */
    export class VABuffer extends Context3DBuffer {

        /** 顶点数据 */
        data: Float32Array;

        size: number;

		/**
		 * 创建顶点数据缓存
		 * @param dataTypeId 数据编号
		 * @param updateFunc 数据更新回调函数
		 */
        constructor(dataTypeId: string) {
            super();
        }

		/**
		 * @inheritDoc
		 */
        public doBuffer(context3D: WebGLRenderingContext) {

            var buffer = context3DBufferCenter.getVABuffer(context3D, this.data, context3D.ARRAY_BUFFER);

            // this.vertexPositionAttribute = context3D.getAttribLocation(this.shaderProgram, "aVertexPosition");
            // this.gl.enableVertexAttribArray(this.vertexPositionAttribute);
        }

        /**
         * 绑定缓冲
         */
        bindBuffer(context3D: WebGLRenderingContext) {


        }

		/**
		 * 更新数据
		 * @param data 				顶点数据
		 * @param numVertices 		要在缓存区中存储的顶点数量。
		 * @param size              与每个顶点关联的 32 位（4 字节）数据值的数量。
		 */
        public update(data: Float32Array, numVertices: number, size: number) {
            assert(1 <= size && size <= 4);

            this.data = data;
            this.size = size;
        }
    }
}
