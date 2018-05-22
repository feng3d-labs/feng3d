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
                cls?: new (...arg) => any,
                /**
                 * 处理了 include 的 shader
                 */
                shader?: Shader,
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

        constructor()
        {
            feng3dDispatcher.on("assets.shaderChanged", this.onShaderChanged, this);
        }

        /**
         * 获取shaderCode
         */
        getShader(shaderName: string)
        {
            var shader = this.shaderConfig.shaders[shaderName];
            if (!shader) return;

            if (!shader.shader)
            {
                var vertex = this.uninclude(shader.vertex);
                var fragment = this.uninclude(shader.fragment);
                shader.shader = new Shader(vertex, fragment);
            }
            return shader.shader;
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

        private onShaderChanged()
        {
            for (const key in this.shaderConfig.shaders)
            {
                if (this.shaderConfig.shaders.hasOwnProperty(key))
                {
                    const element = this.shaderConfig.shaders[key];
                    element.shader = null;
                }
            }
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

    //ShaderLib1
    export class ShaderLib1
    {

    }
}