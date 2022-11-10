import { RenderAtomic } from '../data/RenderAtomic';
import { Shader } from '../data/Shader';
import { shaderlib } from '../shader/ShaderLib';

/**
 * WebGLShader处理器
 */
export class WebGLShaders
{
    private gl: WebGLRenderingContext;

    private compileShaderResults: { [key: string]: CompileShaderResult } = {};

    constructor(gl: WebGLRenderingContext)
    {
        this.gl = gl;
    }

    activeShader(renderAtomic: RenderAtomic)
    {
        const shaderMacro = renderAtomic.getShaderMacro();
        const shader = renderAtomic.getShader();
        shader.shaderMacro = shaderMacro;
        const shaderResult = this.activeShaderProgram(shader);
        if (!shaderResult)
        {
            throw new Error(`缺少着色器，无法渲染!`);
        }
        //
        this.gl.useProgram(shaderResult.program);

        return shaderResult;
    }

    /**
     * 激活渲染程序
     */
    activeShaderProgram(shader: Shader)
    {
        const { shaderName } = shader;

        const { vertex, fragment } = this.updateShaderCode(shader);

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
     * @param gl GL上下文
     * @param type 着色器类型
     * @param code 着色器代码
     * @return 编译后的着色器对象
     */
    private compileShaderCode(gl: WebGLRenderingContext, type: number, code: string)
    {
        const shader = gl.createShader(type);
        if (!shader)
        {
            throw 'unable to create shader';
        }

        gl.shaderSource(shader, code);
        gl.compileShader(shader);

        // 检查编译结果
        const compiled = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
        if (!compiled)
        {
            const error = gl.getShaderInfoLog(shader);
            gl.deleteShader(shader);
            throw `Failed to compile shader: ${error}`;
        }

        return shader;
    }

    private createLinkProgram(gl: WebGLRenderingContext, vertexShader: WebGLShader, fragmentShader: WebGLShader)
    {
        // 创建程序对象
        const program = gl.createProgram();
        if (!program)
        {
            throw '创建 WebGLProgram 失败！';
        }

        // 添加着色器
        gl.attachShader(program, vertexShader);
        gl.attachShader(program, fragmentShader);

        // 链接程序
        gl.linkProgram(program);

        // 检查结果
        const linked = gl.getProgramParameter(program, gl.LINK_STATUS);
        if (!linked)
        {
            const error = gl.getProgramInfoLog(program);
            gl.deleteProgram(program);
            gl.deleteShader(fragmentShader);
            gl.deleteShader(vertexShader);
            throw `Failed to link program: ${error}`;
        }

        return program;
    }

    /**
     * 更新渲染代码
     */
    private updateShaderCode(shader: Shader)
    {
        const { shaderName, shaderMacro } = shader;

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
        const { gl } = this;

        // 创建着色器程序
        // 编译顶点着色器
        const vertexShader = this.compileShaderCode(gl, gl.VERTEX_SHADER, vshader);

        // 编译片段着色器
        const fragmentShader = this.compileShaderCode(gl, gl.FRAGMENT_SHADER, fshader);

        // 创建着色器程序
        const shaderProgram = this.createLinkProgram(gl, vertexShader, fragmentShader);

        // 获取属性信息
        const numAttributes = gl.getProgramParameter(shaderProgram, gl.ACTIVE_ATTRIBUTES);
        const attributes: { [name: string]: AttributeInfo } = {};
        let i = 0;
        while (i < numAttributes)
        {
            const activeInfo = gl.getActiveAttrib(shaderProgram, i++);
            attributes[activeInfo.name] = { name: activeInfo.name, size: activeInfo.size, type: activeInfo.type, location: gl.getAttribLocation(shaderProgram, activeInfo.name) };
        }
        // 获取uniform信息
        const numUniforms = gl.getProgramParameter(shaderProgram, gl.ACTIVE_UNIFORMS);
        const uniforms: { [name: string]: UniformInfo } = {};
        i = 0;
        let textureID = 0;
        while (i < numUniforms)
        {
            const activeInfo = gl.getActiveUniform(shaderProgram, i++);
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
                uniforms[name] = { name: paths[0], paths, size: activeInfo.size, type: activeInfo.type, location: gl.getUniformLocation(shaderProgram, name), textureID };
                if (activeInfo.type === gl.SAMPLER_2D || activeInfo.type === gl.SAMPLER_CUBE)
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
    uniforms: { [name: string]: UniformInfo };
}

/**
 * WebGL渲染程序有效信息
 */
export interface UniformInfo
{
    /**
     * uniform名称
     */
    name: string;

    size: number;
    type: number;
    /**
     * uniform地址
     */
    location: WebGLUniformLocation;
    /**
     * texture索引
     */
    textureID: number;

    /**
     * Uniform数组索引，当Uniform数据为数组数据时生效
     */
    paths: string[];
}

export interface AttributeInfo
{
    /**
     * 名称
     */
    name: string;

    size: number;
    type: number;

    /**
     * 属性地址
     */
    location: number;
}
