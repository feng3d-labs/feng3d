module feng3d {

    /**
     * 鼠标拾取渲染器
     * @author feng 2017-02-06
     */
    export class MouseRenderer extends Renderer {

        private shaderName = "mouse";
        private shaderProgram: WebGLProgram;

        /**
         * 激活渲染程序
         */
        protected activeShaderProgram(context3D: Context3D, vertexCode: string, fragmentCode: string) {

            vertexCode = ShaderLib.getShaderCode(this.shaderName + ".vertex");
            fragmentCode = ShaderLib.getShaderCode(this.shaderName + ".fragment");
            return super.activeShaderProgram(context3D, vertexCode, fragmentCode);
        }
    }
}