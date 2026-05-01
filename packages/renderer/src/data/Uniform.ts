import { LazyObject } from '@feng3d/polyfill';

declare global
{
    interface MixinsUniforms { }
}

export type LazyUniforms = LazyObject<Uniforms>;

export interface Uniforms extends MixinsUniforms
{
}
