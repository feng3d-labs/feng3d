/**
 * 着色器库 (WebGL 兼容层)
 *
 * 用于存储和管理着色器代码
 */
export class ShaderLib
{
    /**
     * 着色器映射表
     */
    private static _shaders: Map<string, string> = new Map();

    /**
     * 注册着色器
     */
    static register(name: string, code: string): void
    {
        ShaderLib._shaders.set(name, code);
    }

    /**
     * 获取着色器
     */
    static get(name: string): string | undefined
    {
        return ShaderLib._shaders.get(name);
    }

    /**
     * 检查着色器是否存在
     */
    static has(name: string): boolean
    {
        return ShaderLib._shaders.has(name);
    }

    /**
     * 移除着色器
     */
    static remove(name: string): boolean
    {
        return ShaderLib._shaders.delete(name);
    }

    /**
     * 清空所有着色器
     */
    static clear(): void
    {
        ShaderLib._shaders.clear();
    }
}

/**
 * 全局着色器库实例
 */
export const shaderLib = new ShaderLib();