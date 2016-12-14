module feng3d {

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
precision mediump float;
uniform vec4 diffuseInput_fc_vector;
void main(void) {

    gl_FragColor = diffuseInput_fc_vector;
}`;

        private _color: Color;

        /** 
         * 颜色 
         */
        public get color(): Color {
            return this._color;
        }

        public set color(value: Color) {
            this._color = value;
        }

        /**
         * 构建颜色材质
         * @param color 颜色
         * @param alpha 透明的
         */
        constructor(color: Color = null) {

            super();
            this.color = color || new Color();

            this.programBuffer = new ProgramRenderData();
            this.programBuffer.vertexCode = this.vertexShaderStr;
            this.programBuffer.fragmentCode = this.fragmentShaderStr;
        }

        /**
		 * 激活
		 * @param renderData	渲染数据
		 */
        public activate(renderData: RenderAtomic) {

            renderData.programBuffer = this.programBuffer;
            renderData.uniforms[RenderDataID.diffuseInput_fc_vector] = new Vector3D(this._color.r, this._color.g, this._color.b, this._color.a);
            //
            super.activate(renderData);
        }

        /**
		 * 释放
		 * @param renderData	渲染数据
		 */
        public deactivate(renderData: RenderAtomic) {

            renderData.programBuffer = null;
            delete renderData.uniforms[RenderDataID.diffuseInput_fc_vector];
            super.deactivate(renderData);
        }
    }
}