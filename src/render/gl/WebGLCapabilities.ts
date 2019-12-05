namespace feng3d
{
    /**
     * WEBGL 功能
     */
    export class WebGLCapabilities
    {
        logarithmicDepthBuffer: boolean;
        maxTextures: any;
        maxVertexTextures: any;
        maxTextureSize: any;
        maxCubemapSize: any;
        maxAttributes: any;
        maxVertexUniforms: any;
        maxVaryings: any;
        maxFragmentUniforms: any;
        vertexTextures: boolean;
        floatFragmentTextures: boolean;
        floatVertexTextures: boolean;
        maxPrecision: string;

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
            this.floatFragmentTextures = !!gl.getExtension('OES_texture_float');
            this.floatVertexTextures = this.vertexTextures && this.floatFragmentTextures;
        }

    }

}