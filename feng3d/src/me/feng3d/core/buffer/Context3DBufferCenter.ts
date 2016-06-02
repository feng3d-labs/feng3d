module me.feng3d {

    /**
     * 3D上下文缓冲中心
     */
    export class Context3DBufferCenter {
        map = new Map<WebGLRenderingContext, Context3DBufferSet>();

        getContext3DBufferSet(context3D: WebGLRenderingContext) {

            var context3DBufferSet = this.map.get(context3D);
            if (context3DBufferSet == null) {
                context3DBufferSet = new Context3DBufferSet(context3D);
                this.map.push(context3D, context3DBufferSet);
            }
            return context3DBufferSet;
        }
    }

    export class Context3DBufferSet {

        context3D: WebGLRenderingContext;

        constructor(context3D: WebGLRenderingContext) {
            this.context3D = context3D;
        }

        private indexbufferMap = new Map<Uint16Array, WebGLBuffer>();

        /**
         * 获取索引缓冲
         */
        getIndexBuffer(indices: Uint16Array) {

            var context3D = this.context3D;

            var indexBuffer = this.indexbufferMap.get(indices);
            if (!indexBuffer) {

                indexBuffer = context3D.createBuffer();
                this.indexbufferMap.push(indices, indexBuffer);
            }
            if (getVersion(indexBuffer) != getVersion(indices)) {
                context3D.bindBuffer(context3D.ELEMENT_ARRAY_BUFFER, indexBuffer);
                context3D.bufferData(context3D.ELEMENT_ARRAY_BUFFER, indices, context3D.STATIC_DRAW);
                
            }

            var indexBuffer = context3D.createBuffer();

            return indexBuffer;
        }

        /**
         * 获取顶点属性缓冲
         */
        getVABuffer(data: Float32Array, target: number): WebGLBuffer {

            var context3D = this.context3D;

            var buffer = context3D.createBuffer();
            context3D.bindBuffer(context3D.ARRAY_BUFFER, buffer);
            context3D.bufferData(context3D.ARRAY_BUFFER, data, context3D.STATIC_DRAW);

            return buffer;
        }
    }

    class IndexBufferCenter {

    }

    /**
     * 3D上下文缓冲中心
     */
    export var context3DBufferCenter = new Context3DBufferCenter();
}