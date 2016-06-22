module me.feng3d {

    /**
     * 渲染程序缓存
     * @author feng 2016-05-09
     */
    export class ProgramBuffer {

        private _vertexCode: string;
        private _fragmentCode: string;

        private _shaderProgram: WebGLProgram;

        /**
         * 顶点渲染程序代码
         */
        get vertexCode(): string {

            return this._vertexCode;
        }

        set vertexCode(value: string) {

            this._vertexCode = value;
            this.invalidCode();
        }

        /**
         * 片段渲染程序代码
         */
        get fragmentCode(): string {

            return this._fragmentCode;
        }

        set fragmentCode(value: string) {

            this._fragmentCode = value;
            this.invalidCode();
        }

        /**
         * 使失效
         */
        private invalidCode() {

        }

        active(context3D: WebGLRenderingContext) {

            var shaderProgram = this.getShaderProgram(context3D);
            context3D.useProgram(shaderProgram);
        }

        /**
         * 渲染程序
         */
        getShaderProgram(context3D: WebGLRenderingContext): WebGLProgram {

            return this._shaderProgram = this._shaderProgram || context3DPool.getWebGLProgram(context3D, this._vertexCode, this._fragmentCode);
        }

        /**
         * 获取属性gpu地址
         */
        getAttribLocations(context3D: WebGLRenderingContext) {

            var attributes: { [name: string]: { type: string, location?: number } } = ShaderCodeUtils.getAttributes(this._vertexCode);
            //获取属性在gpu中地址
            var shaderProgram = this.getShaderProgram(context3D);
            for (var name in attributes) {
                if (attributes.hasOwnProperty(name)) {
                    var element = attributes[name];
                    element.location = context3D.getAttribLocation(shaderProgram, name);
                    context3D.enableVertexAttribArray(element.location);
                }
            }
            return attributes;
        }

        /**
         * 获取属性列表
         */
        getAttributes() {

            var attributes: { [name: string]: { type: string } } = ShaderCodeUtils.getAttributes(this._vertexCode);
            return attributes;
        }

        /**
         * 获取常量
         */
        getUniforms() {

            var uniforms: { [name: string]: { type: string } } = ShaderCodeUtils.getUniforms(this._vertexCode);
            return uniforms;
        }
    }
}