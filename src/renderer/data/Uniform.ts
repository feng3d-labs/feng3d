declare global
{
    interface MixinsUniforms { }
}

export interface Uniforms extends MixinsUniforms
{
    [key: string]: any;
}
