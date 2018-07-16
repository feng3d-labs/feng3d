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