/**
 * The WebGLRenderingContext.getParameter() method of the WebGL API returns a value for the passed parameter name.
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/getParameter
 */
export interface WebGLParameters extends WebGL1Parameters { }

/**
 * You can query the following pname parameters when using a WebGLRenderingContext.
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/getParameter
 */
export type ParameterName = keyof WebGLParameters;

interface WebGL1Parameters
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
