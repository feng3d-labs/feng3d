module me.feng3d {

    /**
     * 3D上下文缓冲中心
     */
    export class Context3DBufferCenter {

        /**
         * 获取索引缓冲
         */
        getIndexBuffer(context3D: WebGLRenderingContext, indices: Uint16Array) {

            var indexBuffer = context3D.createBuffer();
            context3D.bindBuffer(context3D.ELEMENT_ARRAY_BUFFER, indexBuffer);
            context3D.bufferData(context3D.ELEMENT_ARRAY_BUFFER, indices, context3D.STATIC_DRAW);

            return indexBuffer;
        }

        /**
         * 获取顶点属性缓冲
         */
        getVABuffer(context3D: WebGLRenderingContext, data: Float32Array, target: number): WebGLBuffer {

            var buffer = context3D.createBuffer();
            context3D.bindBuffer(context3D.ARRAY_BUFFER, buffer);
            context3D.bufferData(context3D.ARRAY_BUFFER, data, context3D.STATIC_DRAW);

            return buffer;
        }
    }

    /**
     * 3D上下文缓冲中心
     */
    export var context3DBufferCenter = new Context3DBufferCenter();
}