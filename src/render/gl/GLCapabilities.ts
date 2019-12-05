namespace feng3d
{
    /**
     * WEBGL 功能
     * 
     * @see http://html5test.com
     */
    export class GLCapabilities
    {
        /**
         * 是否为 WebGL2
         */
        isWebGL2: boolean;

        maxTextures: number;
        maxVertexTextures: number;
        maxTextureSize: number;
        maxCubemapSize: number;
        maxAttributes: number;
        maxVertexUniforms: number;
        maxVaryings: number;
        maxFragmentUniforms: number;

        vertexTextures: boolean;
        floatFragmentTextures: boolean;
        floatVertexTextures: boolean;

        maxPrecision: "highp" | "mediump" | "lowp";

        maxSamples: number;

        constructor(gl: GL)
        {
            function getMaxPrecision(precision)
            {
                if (precision === 'highp')
                {
                    if (gl.getShaderPrecisionFormat(gl.VERTEX_SHADER, gl.HIGH_FLOAT).precision > 0 &&
                        gl.getShaderPrecisionFormat(gl.FRAGMENT_SHADER, gl.HIGH_FLOAT).precision > 0)
                    {
                        return 'highp';
                    }
                    precision = 'mediump';
                }
                if (precision === 'mediump')
                {
                    if (gl.getShaderPrecisionFormat(gl.VERTEX_SHADER, gl.MEDIUM_FLOAT).precision > 0 &&
                        gl.getShaderPrecisionFormat(gl.FRAGMENT_SHADER, gl.MEDIUM_FLOAT).precision > 0)
                    {
                        return 'mediump';
                    }
                }
                return 'lowp';
            }

            this.isWebGL2 = (typeof WebGL2RenderingContext !== 'undefined' && gl instanceof WebGL2RenderingContext);

            this.maxPrecision = getMaxPrecision('highp');

            this.maxTextures = gl.getParameter(gl.MAX_TEXTURE_IMAGE_UNITS);
            this.maxVertexTextures = gl.getParameter(gl.MAX_VERTEX_TEXTURE_IMAGE_UNITS);
            this.maxTextureSize = gl.getParameter(gl.MAX_TEXTURE_SIZE);
            this.maxCubemapSize = gl.getParameter(gl.MAX_CUBE_MAP_TEXTURE_SIZE);

            this.maxAttributes = gl.getParameter(gl.MAX_VERTEX_ATTRIBS);
            this.maxVertexUniforms = gl.getParameter(gl.MAX_VERTEX_UNIFORM_VECTORS);
            this.maxVaryings = gl.getParameter(gl.MAX_VARYING_VECTORS);
            this.maxFragmentUniforms = gl.getParameter(gl.MAX_FRAGMENT_UNIFORM_VECTORS);

            this.vertexTextures = this.maxVertexTextures > 0;
            this.floatFragmentTextures = this.isWebGL2 || !!gl.getExtension('OES_texture_float');
            this.floatVertexTextures = this.vertexTextures && this.floatFragmentTextures;

            this.maxSamples = this.isWebGL2 ? gl.getParameter(gl.MAX_SAMPLES) : 0;
        }

    }

}