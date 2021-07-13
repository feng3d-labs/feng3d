import { LazyObject } from "@feng3d/polyfill";

export type LazyUniforms = LazyObject<Uniforms>;

export interface Uniforms extends GlobalMixins.Uniforms
{
}

declare global
{
    namespace GlobalMixins
    {
        interface Uniforms
        {

        }
    }
}