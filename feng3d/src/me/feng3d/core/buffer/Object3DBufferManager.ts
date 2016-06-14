module me.feng3d {

    /**
     * 3D对象缓冲管理者
     */
    export class Object3DBufferManager {

        map = new Map<WebGLRenderingContext, Map<Object3D, Object3DBuffer>>();

        getBuffer(context3D: WebGLRenderingContext, object3D: Object3D) {

            var glMap = this.map.get(context3D);
            if (glMap == null) {
                glMap = new Map<Object3D, Object3DBuffer>();
                this.map.push(context3D, glMap);
            }

            var buffer = glMap.get(object3D);

            if (buffer == null) {
                buffer = new Object3DBuffer(context3D, object3D);
                glMap.push(object3D, buffer);
            }

            return buffer;
        }
    }

    export var object3DBufferManager = new Object3DBufferManager();
}