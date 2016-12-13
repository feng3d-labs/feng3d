module feng3d {

    /**
     * 材质
     * @author feng 2016-05-02
     */
    export class Material extends RenderDataHolder {

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
        private _pass: MaterialPassBase;

        /**
        * 渲染模式
        */
        renderMode = RenderMode.TRIANGLES;

        /**
         * 渲染通道
         */
        public get pass(): MaterialPassBase {

            return this._pass;
        }

        public set pass(value: MaterialPassBase) {

            this._pass && this.removeComponent(this._pass);
            this._pass = value;
            this._pass && this.addComponent(this._pass);
        }

        /**
         * 构建材质
         */
        constructor() {

            super();
            this.pass = new MaterialPassBase();
            this.mapProgram(this.vertexShaderStr, this.fragmentShaderStr);
        }
    }
}