import { gPartial } from '../../polyfill/Types';
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
