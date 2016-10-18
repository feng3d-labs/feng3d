module feng3d {

    /**
     * 渲染代码工具
     * @author feng 2016-06-22
     */
    export class ShaderCodeUtils {

        /**
         * 获取程序属性列表
         */
        static getAttributes(code: string) {

            var attributeReg = /attribute\s+(\w+)\s+(\w+)/g;
            var result = attributeReg.exec(code);

            var attributes: { [name: string]: { type: string } } = {};//属性{类型，名称}
            while (result) {
                attributes[result[2]] = { type: result[1] };
                result = attributeReg.exec(code);
            }

            return attributes;
        }

        /**
         * 获取程序常量列表
         */
        static getUniforms(code: string) {

            var uniforms: { [name: string]: { type: string } } = {};

            var uniformReg = /uniform\s+(\w+)\s+(\w+)/g;
            var result = uniformReg.exec(code);

            while (result) {

                uniforms[result[2]] = { type: result[1] };
                result = uniformReg.exec(code);
            }

            return uniforms;
        }

        /**
         * 获取属性gpu地址
         */
        static getAttribLocations(context3D: WebGLRenderingContext,vertexCode:string,fragmentCode:string) {

            var attributes: { [name: string]: { type: string, location?: number } } = ShaderCodeUtils.getAttributes(vertexCode);
            //获取属性在gpu中地址
            var shaderProgram = context3DPool.getWebGLProgram(context3D, vertexCode, fragmentCode);
            for (var name in attributes) {
                if (attributes.hasOwnProperty(name)) {
                    var element = attributes[name];
                    element.location = context3D.getAttribLocation(shaderProgram, name);
                    context3D.enableVertexAttribArray(element.location);
                }
            }
            return attributes;
        }
    }
}