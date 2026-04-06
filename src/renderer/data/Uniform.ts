import { LazyObject } from '../../polyfill/Types';

declare global
{
    interface MixinsUniforms { }
}

export type LazyUniforms = LazyObject<Uniforms>;

export interface Uniforms extends MixinsUniforms
{
}
