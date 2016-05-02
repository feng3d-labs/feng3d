module me.feng3d {

    /**
     * 颜色材质
     * @author feng 2016-05-02
     */
    export class ColorMaterial extends Material {

        vertexShaderStr = //
        `
attribute vec3 aVertexPosition;

uniform mat4 uMVMatrix;
uniform mat4 uPMatrix;

void main(void) {
    gl_Position = uPMatrix * uMVMatrix * vec4(aVertexPosition, 1.0);
}`;
        fragmentShaderStr = //
        `
void main(void) {
    gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0);
}`;

        color: number;

        /**
         * 构建颜色材质
         * @param color 颜色
         */
        constructor(color: number = 0xcccccc) {

            super();
            this.color = color;
        }


    }
}