namespace feng3d
{
    /**
     * A GLenum specifying the test function. The default function is gl.ALWAYS. 
     * 
     * https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/stencilFunc
     */
    export enum StencilFunc
    {
        /**
         * Never pass.
         */
        NEVER = "NEVER",
        /**
         * Pass if (ref & mask) <  (stencil & mask).
         */
        LESS = "LESS",

        /**
         * Pass if (ref & mask) = (stencil & mask).
         */
        EQUAL = "EQUAL",

        /**
         * Pass if (ref & mask) <= (stencil & mask).
         */
        LEQUAL = "LEQUAL",

        /**
         * Pass if (ref & mask) > (stencil & mask).
         */
        GREATER = "GREATER",

        /**
         * Pass if (ref & mask) != (stencil & mask).
         */
        NOTEQUAL = "NOTEQUAL",

        /**
         * Pass if (ref & mask) >= (stencil & mask).
         */
        GEQUAL = "GEQUAL",

        /**
         * Always pass.
         */
        ALWAYS = "ALWAYS",
    }
}