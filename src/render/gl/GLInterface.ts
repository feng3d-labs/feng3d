/**
 * WebGL渲染程序
 */
interface WebGLProgram
{
    /**
     * WebGL渲染上下文
     */
    gl: WebGLRenderingContext;
    /**
     * 顶点shader
     */
    vertexShader: WebGLShader;
    /**
     * 片段shader
     */
    fragmentShader: WebGLShader;
    /**
     * 属性信息列表
     */
    attributes: { [name: string]: WebGLActiveInfo };
    /**
     * uniform信息列表
     */
    uniforms: { [name: string]: WebGLActiveInfo };
    /**
     * 销毁
     */
    destroy();
}

/**
 * WebGL渲染程序有效信息
 */
interface WebGLActiveInfo
{
    /**
     * 属性地址
     */
    location: number;
    /**
     * uniform基础名称，例如 arr[10] 基础名称为 arr
     */
    uniformBaseName: string;
    /**
     * uniform地址
     */
    uniformLocation: WebGLUniformLocation | WebGLUniformLocation[];
    /**
     * texture索引
     */
    textureID: number;
}

interface WebGLRenderingContext
{
    /**
     * Create the linked program object
     * @param gl GL context
     * @param vshader a vertex shader program (string)
     * @param fshader a fragment shader program (string)
     * @return created program object, or null if the creation has failed
     */
    createProgram(vshader: string, fshader: string): WebGLProgram;
}