module me.feng3d {

    /**
     * 渲染程序
     * @author feng 2016-05-17
     */
    export class ShaderProgram {

        /**
         * 顶点渲染程序代码
         */
        code: string;

        /**
         * 渲染类型
         */
        type: ShaderType;

        /**
         * 构建渲染程序
         * @param code 代码
         * @param type 渲染类型
         */
        constructor(code: string, type: ShaderType) {

            this.code = code;
            this.type = type;
        }

        /**
         * 获取渲染程序
         */
        static getInstance(code: string, type: ShaderType) {

            return new ShaderProgram(code, type);
        }

        /**
         * 获取程序属性列表
         */
        getAttributes() {

            var attributeReg = /attribute\s+(\w+)\s+(\w+)/g;
            var result = attributeReg.exec(this.code);

            var attributes: ProgramAttribute[] = [];
            while (result) {
                var attribute = new ProgramAttribute();
                attribute.type = result[1];
                attribute.name = result[2];
                result = attributeReg.exec(this.code);
            }

            return attributes;
        }

        /**
         * 获取程序常量列表
         */
        getUniforms() {

            var uniforms: ProgramUniform[] = [];

            var uniformReg = /uniform\s+(\w+)\s+(\w+)/g;
            var result = uniformReg.exec(this.code);

            while (result) {
                var attribute = new ProgramAttribute();
                attribute.type = result[1];
                attribute.name = result[2];
                result = uniformReg.exec(this.code);
            }

            return uniforms;
        }

    }
}