import { WebGLUniformTypeUtils } from '../const/WebGLUniformType';
import { Shader } from '../data/Shader';
import { ShaderMacro } from '../shader/Macro';
import { shaderlib } from '../shader/ShaderLib';
import { WebGLRenderer } from '../WebGLRenderer';
import { ShaderType } from './WebGLEnums';
import { WebGLRenderAtomic } from './WebGLRenderAtomic';
import { WebGLUniform } from './WebGLUniforms';

/**
 * WebGLShader处理器
 */
export class WebGLShaders
{
    private _webGLRenderer: WebGLRenderer;

    private compileShaderResults: { [key: string]: CompileShaderResult } = {};

    constructor(webGLRenderer: WebGLRenderer)
    {
        this._webGLRenderer = webGLRenderer;
    }

    activeShader(renderAtomic: WebGLRenderAtomic)
    {
        const { webGLContext } = this._webGLRenderer;

        const shaderMacro = renderAtomic.shaderMacro;
        const shader = renderAtomic.shader;
        const shaderResult = this.activeShaderProgram(shader, shaderMacro);
        if (!shaderResult)
        {
            throw new Error(`缺少着色器，无法渲染!`);
        }
        //
        webGLContext.useProgram(shaderResult.program);

        return shaderResult;
    }

    /**
     * 激活渲染程序
     */
    activeShaderProgram(shader: Shader, shaderMacro: ShaderMacro)
    {
        const { shaderName } = shader;

        const { vertex, fragment } = this.updateShaderCode(shader, shaderMacro);

        const shaderKey = vertex + fragment;
        let result = this.compileShaderResults[shaderKey];
        if (result) return result;

        // 渲染程序
        try
        {
            result = this.compileShaderResults[shaderKey] = this.compileShaderProgram(vertex, fragment);
        }
        catch (error)
        {
            console.error(`${shaderName} 编译失败！\n${error}`);

            return null;
        }

        return result;
    }

    /**
     * 编译着色器代码
     * @param type 着色器类型
     * @param code 着色器代码
     * @return 编译后的着色器对象
     */
    private compileShaderCode(type: ShaderType, code: string)
    {
        const { webGLContext } = this._webGLRenderer;

        const shader = webGLContext.createShader(type);

        webGLContext.shaderSource(shader, code);
        webGLContext.compileShader(shader);

        // 检查编译结果
        const compiled = webGLContext.getShaderParameter(shader, 'COMPILE_STATUS');
        if (!compiled)
        {
            const error = webGLContext.getShaderInfoLog(shader);
            webGLContext.deleteShader(shader);
            throw `Failed to compile shader: ${error}`;
        }

        return shader;
    }

    private createLinkProgram(webGLRenderer: WebGLRenderer, vertexShader: WebGLShader, fragmentShader: WebGLShader)
    {
        const { webGLContext } = webGLRenderer;

        // 创建程序对象
        const program = webGLContext.createProgram();

        // 添加着色器
        webGLContext.attachShader(program, vertexShader);
        webGLContext.attachShader(program, fragmentShader);

        // 链接程序
        webGLContext.linkProgram(program);

        // 检查结果
        const linked = webGLContext.getProgramParameter(program, 'LINK_STATUS');
        if (!linked)
        {
            const error = webGLContext.getProgramInfoLog(program);
            webGLContext.deleteProgram(program);
            webGLContext.deleteShader(fragmentShader);
            webGLContext.deleteShader(vertexShader);
            throw `Failed to link program: ${error}`;
        }

        return program;
    }

    /**
     * 更新渲染代码
     */
    private updateShaderCode(shader: Shader, shaderMacro: ShaderMacro)
    {
        const { shaderName } = shader;

        if (!shaderName) return shader;

        // 获取着色器代码
        const result = shaderlib.getShader(shaderName);

        const vMacroCode = this.getMacroCode(result.vertexMacroVariables, shaderMacro);
        const vertex = vMacroCode + result.vertex;
        const fMacroCode = this.getMacroCode(result.fragmentMacroVariables, shaderMacro);
        const fragment = fMacroCode + result.fragment;

        return { vertex, fragment };
    }

    private compileShaderProgram(vshader: string, fshader: string): CompileShaderResult
    {
        const { webGLContext } = this._webGLRenderer;

        // 创建着色器程序
        // 编译顶点着色器
        const vertexShader = this.compileShaderCode('VERTEX_SHADER', vshader);

        // 编译片段着色器
        const fragmentShader = this.compileShaderCode('FRAGMENT_SHADER', fshader);

        // 创建着色器程序
        const shaderProgram = this.createLinkProgram(this._webGLRenderer, vertexShader, fragmentShader);

        // 获取属性信息
        const numAttributes = webGLContext.getProgramParameter(shaderProgram, 'ACTIVE_ATTRIBUTES');
        const attributes: { [name: string]: AttributeInfo } = {};
        let i = 0;
        while (i < numAttributes)
        {
            const activeInfo = webGLContext.getActiveAttrib(shaderProgram, i++);
            const location = webGLContext.getAttribLocation(shaderProgram, activeInfo.name);
            attributes[activeInfo.name] = { activeInfo, location };
        }
        // 获取uniform信息
        const numUniforms = webGLContext.getProgramParameter(shaderProgram, 'ACTIVE_UNIFORMS');
        const uniforms: { [name: string]: WebGLUniform } = {};
        i = 0;
        let textureID = 0;
        while (i < numUniforms)
        {
            const activeInfo = webGLContext.getActiveUniform(shaderProgram, i++);
            const reg = /(\w+)/g;

            let name = activeInfo.name;
            const names = [name];
            if (activeInfo.size > 1)
            {
                console.assert(name.substr(-3, 3) === '[0]');
                const baseName = name.substring(0, name.length - 3);
                for (let j = 1; j < activeInfo.size; j++)
                {
                    names[j] = `${baseName}[${j}]`;
                }
            }

            for (let j = 0; j < names.length; j++)
            {
                name = names[j];
                let result: RegExpExecArray = reg.exec(name);
                const paths: string[] = [];
                while (result)
                {
                    paths.push(result[1]);
                    result = reg.exec(name);
                }
                const location = webGLContext.getUniformLocation(shaderProgram, name);
                const type = WebGLUniformTypeUtils.getType(activeInfo.type);
                const isTexture = WebGLUniformTypeUtils.isTexture(type);
                uniforms[name] = { activeInfo, location, type, paths, textureID };

                if (isTexture)
                {
                    textureID++;
                }
            }
        }

        return { program: shaderProgram, vertex: vertexShader, fragment: fragmentShader, attributes, uniforms };
    }

    private getMacroCode(variables: string[], valueObj: Object)
    {
        let macroHeader = '';
        variables.forEach((macroName) =>
        {
            const value = valueObj[macroName];
            if (typeof value === 'boolean')
            {
                value && (macroHeader += `#define ${macroName}\n`);
            }
            else if (typeof value === 'number')
            {
                macroHeader += `#define ${macroName} ${value}\n`;
            }
        });

        return macroHeader.length > 0 ? (`${macroHeader}\n`) : macroHeader;
    }
}

export interface CompileShaderResult
{
    program: WebGLProgram, vertex: WebGLShader, fragment: WebGLShader
    /**
     * 属性信息列表
     */
    attributes: { [name: string]: AttributeInfo };
    /**
     * uniform信息列表
     */
    uniforms: { [name: string]: WebGLUniform };
}

export interface AttributeInfo
{
    /**
     * WebGL激活信息。
     */
    activeInfo: WebGLActiveInfo;

    /**
     * 属性地址
     */
    location: number;
}
