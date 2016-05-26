module me.feng3d {

    /**
     * 3D对象缓冲管理者
     */
    export class Object3DBufferManager {

        map = new Map<WebGLRenderingContext, Map<Object3D, Object3DBuffer>>();

        getBuffer(gl: WebGLRenderingContext, object3D: Object3D) {

            var glMap = this.map.get(gl);
            if (glMap == null) {
                glMap = new Map<Object3D, Object3DBuffer>();
                this.map.push(gl, glMap);
            }

            var buffer = glMap.get(object3D);

            if (buffer == null) {
                buffer = new Object3DBuffer();
                glMap.push(object3D, buffer);

                var geometry = object3D.getComponentByClass(Geometry);
                var positionData = geometry.getVAData(GLAttribute.position);
                // Create a buffer for the square's vertices.
                var squareVerticesBuffer = buffer.squareVerticesBuffer = gl.createBuffer();
                gl.bindBuffer(gl.ARRAY_BUFFER, squareVerticesBuffer);
                gl.bufferData(gl.ARRAY_BUFFER, positionData, gl.STATIC_DRAW);

                // var vaBuffer = new VABuffer(GLAttribute.position);

                var indices = geometry.indices;
                var indexBuffer = buffer.indexBuffer = gl.createBuffer();
                gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
                gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);

                buffer.count = indices.length;
            }

            return buffer;
        }
    }

    export var object3DBufferManager = new Object3DBufferManager();
}