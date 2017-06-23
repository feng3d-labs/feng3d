interface WebGLTexture
{
    /**
     * 唯一标识符
     */
    uuid: string;
}
interface WebGLBuffer
{
    /**
     * 唯一标识符
     */
    uuid: string;
}
/**
 * WebGL渲染程序
 */
interface WebGLProgram
{
    /**
     * 版本号
     */
    version: number;
    vertexCode: string;
    fragmentCode: string;
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
    attributes: WebGLActiveInfo[];
    /**
     * uniform信息列表
     */
    uniforms: WebGLActiveInfo[];
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

    programs: { [uuid: string]: WebGLProgram };

    /**
     * 获取纹理各向异性过滤扩展
     */
    anisotropicExt: EXTTextureFilterAnisotropic;

    /**
     * 纹理各向异性过滤最大值
     */
    maxAnisotropy: number;
}

namespace feng3d
{
    export var GL = WebGL2RenderingContext || WebGLRenderingContext;
    export interface GL extends WebGL2RenderingContext
    {
        /**
         * 唯一标识符
         */
        uuid: string;

        webgl2: boolean;

        proxy: GLProxy;
    }
}