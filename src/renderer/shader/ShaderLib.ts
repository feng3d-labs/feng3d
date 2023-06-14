import { globalEmitter } from '@feng3d/event';
import { shaderMacroUtils } from './ShaderMacroUtils';

export const shaderConfig: ShaderConfig = { shaders: {}, modules: {} };

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

    private _shaderCache: { [shaderName: string]: { vertex: string, fragment: string, vertexMacroVariables: string[], fragmentMacroVariables: string[] } } = {};

    /**
     * 获取shaderCode
     */
    getShader(shaderName: string)
    {
        if (this._shaderCache[shaderName])
        {
            return this._shaderCache[shaderName];
        }

        const shader = shaderlib.shaderConfig.shaders[shaderName];
        //
        const vertex = shaderlib.uninclude(shader.vertex);
        //
        const fragment = shaderlib.uninclude(shader.fragment);
        const vertexMacroVariables = shaderMacroUtils.getMacroVariablesFromCode(vertex);
        const fragmentMacroVariables = shaderMacroUtils.getMacroVariablesFromCode(fragment);

        this._shaderCache[shaderName] = { vertex, fragment, vertexMacroVariables, fragmentMacroVariables };

        return this._shaderCache[shaderName];
    }

    /**
     * 展开 include
     */
    uninclude(shaderCode: string)
    {
        // #include 正则表达式
        const includeRegExp = /#include<(.+)>/g;
        //
        let match = includeRegExp.exec(shaderCode);
        while (match)
        {
            let moduleshader = this.shaderConfig.modules[match[1]];
            if (!moduleshader)
            {
                console.error(`无法找到着色器 ${match[1]}`);
            }
            moduleshader = this.uninclude(moduleshader);
            shaderCode = shaderCode.replace(match[0], moduleshader);
            includeRegExp.lastIndex = 0;
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

    /**
     * 清除缓存
     */
    clearCache()
    {
        this._shaderCache = {};
    }
}

/**
 * shader 库
 */
export const shaderlib = new ShaderLib();

declare module '@feng3d/event'
{
    interface GlobalEvents
    {
        /**
         * shader资源发生变化
         */
        'asset.shaderChanged': any;
    }
}

globalEmitter.on('asset.shaderChanged', () =>
{
    shaderlib.clearCache();
});
