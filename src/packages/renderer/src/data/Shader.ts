import { gPartial } from '@feng3d/polyfill';
import { ShaderMacro } from '../shader/Macro';

/**
 * shader
 */
export class Shader
{
    /**
     * 着色器名称
     */
    shaderName: string;

    /**
     * shader 中的 宏
     */
    shaderMacro: ShaderMacro = {} as any;

    /**
     * 顶点着色器代码
     */
    vertex: string;

    /**
     * 片段着色器代码
     */
    fragment: string;

    constructor(source?: gPartial<Shader>)
    {
        Object.assign(this, source);
    }
}
