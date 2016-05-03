module me.feng3d {

    /**
     * 3D上下文缓冲中心
     */
    export class Context3DBufferCenter {

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