namespace feng3d
{
    export var shaderConfig: ShaderConfig;
    /**
     * shader 库
     */
    export var shaderlib: ShaderLib;

    /**
     * 着色器库，由shader.ts初始化
     */
    export interface ShaderConfig
    {
        shaders: {
            [shaderName: string]: {
                /**
                 * 从glsl读取的vertex shader
                 */
                vertex: string,
                /**
                 * 从glsl读取的fragment shader
                 */
                fragment: string,
                /**
                 * 处理了 include 的 shader
                 */
                uninclude?: {
                    vertex: string,
                    fragment: string,
                },
            }
        },
        /**
         * shader 模块
         */
        modules: {
            [moduleName: string]: string
        }
    }

    /**
     * 渲染代码库
     * @author feng 2016-12-16
     */
    export class ShaderLib
    {
        get shaderConfig()
        {
            this._shaderConfig = this._shaderConfig || shaderConfig;
            return this._shaderConfig;
        }
        set shaderConfig(v)
        {
            this._shaderConfig = v;
        }
        private _shaderConfig: ShaderConfig;

        /**
         * 获取shaderCode
         */
        getShaderCode(shaderName: string)
        {
            var shader = this.shaderConfig.shaders[shaderName];
            if (!shader) return;

            if (!shader.uninclude)
            {
                shader.uninclude = <any>{};
                var uninclude = shader.uninclude;
                uninclude.vertex = this.uninclude(shader.vertex);
                uninclude.fragment = this.uninclude(shader.fragment);
            }
            return this.shaderConfig.shaders[shaderName].uninclude;
        }

        /**
         * 展开 include
         */
        private uninclude(shaderCode: string)
        {
            //#include 正则表达式
            var includeRegExp = /#include<(.+)>/g;
            //
            var match = includeRegExp.exec(shaderCode);
            while (match != null)
            {
                var moduleshader = this.shaderConfig.modules[match[1]];
                moduleshader = this.uninclude(moduleshader);
                shaderCode = shaderCode.replace(match[0], moduleshader);
                match = includeRegExp.exec(shaderCode);
            }
            return shaderCode;
        }

        /**
         * 获取shader列表
         */
        getShaderNames()
        {
            return Object.keys(this.shaderConfig.shaders);
        }


    }

    shaderlib = new ShaderLib();
}