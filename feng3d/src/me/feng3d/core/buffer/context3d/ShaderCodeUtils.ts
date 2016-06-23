module me.feng3d {

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
    }
}