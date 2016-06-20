module me.feng3d {

    /**
     * 3D上下文缓冲中心
     * @author feng 2016-06-20
     */
    export class Context3DBufferCenter {

        /**
         * 3D上下文缓冲中心字典
         */
        private static map = new Map<WebGLRenderingContext, Context3DBufferCenter>();

        /**
         * 3D上下文
         */
        private context3D: WebGLRenderingContext;

        /**
         * 缓冲字典
         */
        private bufferMap = new Map<ArrayBufferView | ArrayBuffer, WebGLBuffer>();

        /**
         * 获取3D上下文缓冲中心
         * @param context3D 3D上下文
         */
        static getInstance(context3D: WebGLRenderingContext) {

            var context3DBufferCenter = this.map.get(context3D);
            if (context3DBufferCenter == null) {
                context3DBufferCenter = new Context3DBufferCenter(context3D);
                this.map.push(context3D, context3DBufferCenter);
            }
            return context3DBufferCenter;
        }

        /**
         * 构建3D上下文缓冲中心
         * @param context3D 3D上下文
         */
        constructor(context3D: WebGLRenderingContext) {
            this.context3D = context3D;
        }

        /**
         * 获取索引缓冲
         */
        getIndexBuffer(indices: Uint16Array) {

            var indexBuffer = this.getBuffer(indices, WebGLRenderingContext.ELEMENT_ARRAY_BUFFER);
            return indexBuffer;
        }

        /**
         * 获取顶点属性缓冲
         * @param data  数据 
         */
        getVABuffer(data: Float32Array): WebGLBuffer {
            var buffer = this.getBuffer(data, WebGLRenderingContext.ARRAY_BUFFER);
            return buffer;
        }

        /**
         * 获取缓冲
         * @param data  数据
         */
        getBuffer(data: ArrayBufferView | ArrayBuffer, target: number) {

            var context3D = this.context3D;
            var buffer = this.bufferMap.get(data);
            if (!buffer) {

                buffer = context3D.createBuffer();
                this.bufferMap.push(data, buffer);
            }

            if (!version.equal(data, buffer)) {
                context3D.bindBuffer(target, buffer);
                context3D.bufferData(target, data, WebGLRenderingContext.STATIC_DRAW);
                version.setVersion(buffer, version.getVersion(data));

                //升级buffer和数据版本号一致
                var dataVersion = Math.max(0, version.getVersion(data));
                version.setVersion(data, dataVersion);
                version.setVersion(buffer, dataVersion);
            }

            return buffer;
        }
    }
}