module me.feng3d {

    /**
     * 颜色材质
     * @author feng 2016-05-02
     */
    export class ColorMaterial extends Material {

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
uniform vec4 diffuseInput_fc_vector;
void main(void) {

    gl_FragColor = diffuseInput_fc_vector;
}`;

        /**
         * 颜色
         */
        private _color: Color;

        /** 
         * 漫反射颜色数据RGBA 
         */
        private diffuseInputData: number[] = [0, 0, 0, 0];

        /**
         * 构建颜色材质
         * @param color 颜色
         * @param alpha 透明的
         */
        constructor(color: Color = null, alpha: number = 1) {

            super();
            this.color = color || new Color();
            this.alpha = alpha;
            // this.mapProgram(this.vertexShaderStr, this.fragmentShaderStr);
            this.mapUniformMatrix4fv
        }

        /** 
         * 漫反射alpha 
         */
        public get alpha(): number {
            return this.diffuseInputData[3];
        }

        public set alpha(value: number) {
            this.diffuseInputData[3] = value;
        }

        /** 
         * 颜色 
         */
        public get color(): Color {
            return this._color;
        }

        public set color(value: Color) {
            this._color = value;
        }
    }
}