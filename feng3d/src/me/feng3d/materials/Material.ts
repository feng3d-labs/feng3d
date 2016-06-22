module me.feng3d {

    /**
     * 材质
     * @author feng 2016-05-02
     */
    export class Material extends Component {


        vertexShaderStr = //
        `
attribute vec3 vaPosition;

uniform mat4 uMVMatrix;
uniform mat4 uPMatrix;

void main(void) {
    gl_Position = uPMatrix * uMVMatrix * vec4(vaPosition, 1.0);
}`;
        fragmentShaderStr = //
        `
void main(void) {
    gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0);
}`;

        pass: MaterialPass;

        /**
         * 构建材质
         */
        constructor() {
            super();
            this.pass = new MaterialPass();
            this.context3DBuffer.mapProgramBuffer(this.vertexShaderStr, this.fragmentShaderStr);
        }

        /**
         * Context3D数据缓冲
         */
        get context3DBuffer(): Context3DBuffer {
            return this.getOrCreateComponentByClass(Context3DBuffer);
        }
    }
}