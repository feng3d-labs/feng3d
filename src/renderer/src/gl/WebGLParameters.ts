/**
 * The WebGLRenderingContext.getParameter() method of the WebGL API returns a value for the passed parameter name.
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/getParameter
 */
export interface WebGLParameters extends WebGL2Parameters { }

interface WebGL2Parameters extends WebGL1Parameters
{
    /**
     * 	See bindBuffer.
     */
    COPY_READ_BUFFER_BINDING: WebGLBuffer | null;
    /**
     * 	See bindBuffer.
     */
    COPY_WRITE_BUFFER_BINDING: WebGLBuffer | null;
    /**
     * 	gl.BACK, gl.NONE or gl.COLOR_ATTACHMENT{0-15}. See also drawBuffers.
     */
    DRAW_BUFFERi: GLenum;

    /**
     * 	null corresponds to a binding to the default framebuffer. See also bindFramebuffer.
     */
    DRAW_FRAMEBUFFER_BINDING: WebGLFramebuffer | null;

    /**
     * 	gl.FASTEST, gl.NICEST or gl.DONT_CARE. See also hint.
     */
    FRAGMENT_SHADER_DERIVATIVE_HINT: GLenum;
    MAX_3D_TEXTURE_SIZE: GLint;
    MAX_ARRAY_TEXTURE_LAYERS: GLint;
    MAX_CLIENT_WAIT_TIMEOUT_WEBGL: GLint64;
    MAX_COLOR_ATTACHMENTS: GLint;
    MAX_COMBINED_FRAGMENT_UNIFORM_COMPONENTS: GLint64;
    MAX_COMBINED_UNIFORM_BLOCKS: GLint;
    MAX_COMBINED_VERTEX_UNIFORM_COMPONENTS: GLint64;
    MAX_DRAW_BUFFERS: GLint;
    MAX_ELEMENT_INDEX: GLint64
    MAX_ELEMENTS_INDICES: GLint
    MAX_ELEMENTS_VERTICES: GLint
    MAX_FRAGMENT_INPUT_COMPONENTS: GLint
    MAX_FRAGMENT_UNIFORM_BLOCKS: GLint
    MAX_FRAGMENT_UNIFORM_COMPONENTS: GLint
    MAX_PROGRAM_TEXEL_OFFSET: GLint
    MAX_SAMPLES: GLint
    MAX_SERVER_WAIT_TIMEOUT: GLint64
    MAX_TEXTURE_LOD_BIAS: GLfloat
    MAX_TRANSFORM_FEEDBACK_INTERLEAVED_COMPONENTS: GLint
    MAX_TRANSFORM_FEEDBACK_SEPARATE_ATTRIBS: GLint
    MAX_TRANSFORM_FEEDBACK_SEPARATE_COMPONENTS: GLint
    MAX_UNIFORM_BLOCK_SIZE: GLint64
    MAX_UNIFORM_BUFFER_BINDINGS: GLint
    MAX_VARYING_COMPONENTS: GLint
    MAX_VERTEX_OUTPUT_COMPONENTS: GLint
    MAX_VERTEX_UNIFORM_BLOCKS: GLint
    MAX_VERTEX_UNIFORM_COMPONENTS: GLint
    MIN_PROGRAM_TEXEL_OFFSET: GLint
    /**
     * See pixelStorei.
     */
    PACK_ROW_LENGTH: GLint
    /**
     * See pixelStorei.
     */
    PACK_SKIP_PIXELS: GLint
    /**
     * See pixelStorei.
     */
    PACK_SKIP_ROWS: GLint
    /**
     * 	See bindBuffer.
     */
    PIXEL_PACK_BUFFER_BINDING: WebGLBuffer | null
    /**
     * 	See bindBuffer.
     */
    PIXEL_UNPACK_BUFFER_BINDING: WebGLBuffer | null
    RASTERIZER_DISCARD: GLboolean
    READ_BUFFER: GLenum
    /**
     * 	null corresponds to a binding to the default framebuffer. See also bindFramebuffer.
     */
    READ_FRAMEBUFFER_BINDING: WebGLFramebuffer | null
    SAMPLE_ALPHA_TO_COVERAGE: GLboolean
    SAMPLE_COVERAGE: GLboolean
    /**
     * 	See bindSampler.
     */
    SAMPLER_BINDING: WebGLSampler | null
    /**
     * 	See bindTexture.
     */
    TEXTURE_BINDING_2D_ARRAY: WebGLTexture | null
    /**
     * 	See bindTexture.
     */
    TEXTURE_BINDING_3D: WebGLTexture | null
    TRANSFORM_FEEDBACK_ACTIVE: GLboolean
    /**
     * 	See bindTransformFeedback.
     */
    TRANSFORM_FEEDBACK_BINDING: WebGLTransformFeedback | null
    /**
     * 	See bindBuffer.
     */
    TRANSFORM_FEEDBACK_BUFFER_BINDING: WebGLBuffer | null
    TRANSFORM_FEEDBACK_PAUSED: GLboolean
    /**
     * 	See bindBuffer.
     */
    UNIFORM_BUFFER_BINDING: WebGLBuffer | null
    /**
     * 	See pixelStorei.
     */
    UNIFORM_BUFFER_OFFSET_ALIGNMENT: GLint
    /**
     * See pixelStorei.
     */
    UNPACK_IMAGE_HEIGHT: GLint
    /**
     * See pixelStorei.
     */
    UNPACK_ROW_LENGTH: GLint
    /**
     * See pixelStorei.
     */
    UNPACK_SKIP_IMAGES: GLint
    /**
     * 	See pixelStorei.
     */
    UNPACK_SKIP_PIXELS: GLint
    /**
     * See pixelStorei.
     */
    UNPACK_SKIP_ROWS: GLint
    /**
     * 	See bindVertexArray.
     */
    VERTEX_ARRAY_BINDING: WebGLVertexArrayObject | null;
}

interface WebGL1Parameters extends WebGLParameters_EXT
{
    ACTIVE_TEXTURE: GLenum;

    ALIASED_LINE_WIDTH_RANGE: Float32Array & [number, number];

    ALIASED_POINT_SIZE_RANGE: Float32Array & [number, number];
    ALPHA_BITS: GLint;
    ARRAY_BUFFER_BINDING: WebGLBuffer;
    BLEND: GLboolean;
    BLEND_COLOR: Float32Array & [number, number, number, number];
    BLEND_DST_ALPHA: GLenum;
    BLEND_DST_RGB: GLenum;
    BLEND_EQUATION: GLenum;
    BLEND_EQUATION_ALPHA: GLenum;
    BLEND_EQUATION_RGB: GLenum;
    BLEND_SRC_ALPHA: GLenum;
    BLEND_SRC_RGB: GLenum;
    BLUE_BITS: GLint;
    COLOR_CLEAR_VALUE: Float32Array & [number, number, number, number];
    COLOR_WRITEMASK: [GLboolean, GLboolean, GLboolean, GLboolean];

    CULL_FACE: GLboolean

    /**
     * gl.FRONT, gl.BACK or gl.FRONT_AND_BACK. See also cullFace
     */
    CULL_FACE_MODE: GLenum

    /**
     * See useProgram.
     */
    CURRENT_PROGRAM: WebGLProgram | null;

    DEPTH_BITS: GLint;
    DEPTH_CLEAR_VALUE: GLfloat;
    DEPTH_FUNC: GLenum;
    DEPTH_RANGE: Float32Array & [number, number];
    DEPTH_TEST: GLboolean
    DEPTH_WRITEMASK: GLboolean
    DITHER: GLboolean
    ELEMENT_ARRAY_BUFFER_BINDING: WebGLBuffer
    /**
     * null corresponds to a binding to the default framebuffer. See also bindFramebuffer.
     */
    FRAMEBUFFER_BINDING: WebGLFramebuffer | null;
    /**
     * 	gl.CW or gl.CCW. See also frontFace.
     */
    FRONT_FACE: GLenum;
    /**
     * 	gl.FASTEST, gl.NICEST or gl.DONT_CARE. See also hint.
     */
    GENERATE_MIPMAP_HINT: GLenum;
    GREEN_BITS: GLint
    IMPLEMENTATION_COLOR_READ_FORMAT: GLenum
    IMPLEMENTATION_COLOR_READ_TYPE: GLenum
    LINE_WIDTH: GLfloat
    MAX_COMBINED_TEXTURE_IMAGE_UNITS: GLint
    MAX_CUBE_MAP_TEXTURE_SIZE: GLint
    MAX_FRAGMENT_UNIFORM_VECTORS: GLint
    MAX_RENDERBUFFER_SIZE: GLint
    MAX_TEXTURE_IMAGE_UNITS: GLint
    MAX_TEXTURE_SIZE: GLint
    MAX_VARYING_VECTORS: GLint
    MAX_VERTEX_ATTRIBS: GLint
    MAX_VERTEX_TEXTURE_IMAGE_UNITS: GLint
    MAX_VERTEX_UNIFORM_VECTORS: GLint
    MAX_VIEWPORT_DIMS: Int32Array & [number, number];
    PACK_ALIGNMENT: GLint
    POLYGON_OFFSET_FACTOR: GLfloat
    POLYGON_OFFSET_FILL: GLboolean
    POLYGON_OFFSET_UNITS: GLfloat
    RED_BITS: GLint
    /**
     * 	See bindRenderbuffer.
     */
    RENDERBUFFER_BINDING: WebGLRenderbuffer | null
    RENDERER: string
    SAMPLE_BUFFERS: GLint
    SAMPLE_COVERAGE_INVERT: GLboolean
    SAMPLE_COVERAGE_VALUE: GLfloat
    SAMPLES: GLint
    SCISSOR_BOX: Int32Array & [number, number, number, number];
    SCISSOR_TEST: GLboolean
    SHADING_LANGUAGE_VERSION: string
    STENCIL_BACK_FAIL: GLenum
    STENCIL_BACK_FUNC: GLenum
    STENCIL_BACK_PASS_DEPTH_FAIL: GLenum
    STENCIL_BACK_PASS_DEPTH_PASS: GLenum
    STENCIL_BACK_REF: GLint
    STENCIL_BACK_VALUE_MASK: GLuint
    STENCIL_BACK_WRITEMASK: GLuint
    STENCIL_BITS: GLint
    STENCIL_CLEAR_VALUE: GLint
    STENCIL_FAIL: GLenum
    STENCIL_FUNC: GLenum
    STENCIL_PASS_DEPTH_FAIL: GLenum
    STENCIL_PASS_DEPTH_PASS: GLenum
    STENCIL_REF: GLint
    STENCIL_TEST: GLboolean
    STENCIL_VALUE_MASK: GLuint
    STENCIL_WRITEMASK: GLuint
    SUBPIXEL_BITS: GLint
    TEXTURE_BINDING_2D: WebGLTexture | null
    TEXTURE_BINDING_CUBE_MAP: WebGLTexture | null
    UNPACK_ALIGNMENT: GLint
    UNPACK_COLORSPACE_CONVERSION_WEBGL: GLenum
    UNPACK_FLIP_Y_WEBGL: GLboolean
    UNPACK_PREMULTIPLY_ALPHA_WEBGL: GLboolean
    VENDOR: string
    VERSION: string
    VIEWPORT: Int32Array & [GLint, GLint, GLint, GLint];
}

interface WebGLParameters_EXT extends WebGLParameters_EXT_texture_filter_anisotropic { }

interface WebGLParameters_EXT_texture_filter_anisotropic
{
    /**
     * 	Maximum available anisotropy.
     */
    MAX_TEXTURE_MAX_ANISOTROPY_EXT: GLfloat;
}
