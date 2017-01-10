//参考 
//https://www.khronos.org/registry/webgl/specs/latest/2.0/
//https://github.com/DefinitelyTyped/DefinitelyTyped/blob/master/webgl-ext/index.d.ts

interface HTMLCanvasElement {
    getContext(contextId: "webgl2"): WebGL2RenderingContext;
}

declare type GLenum = number;

interface WebGL2RenderingContext extends WebGLRenderingContext {
    READ_BUFFER: number;
    UNPACK_ROW_LENGTH: number;
    UNPACK_SKIP_ROWS: number;
    UNPACK_SKIP_PIXELS: number;
    PACK_ROW_LENGTH: number;
    PACK_SKIP_ROWS: number;
    PACK_SKIP_PIXELS: number;
    COLOR: number;
    DEPTH: number;
    STENCIL: number;
    RED: number;
    RGB8: number;
    RGBA8: number;
    RGB10_A2: number;
    TEXTURE_BINDING_3D: number;
    UNPACK_SKIP_IMAGES: number;
    UNPACK_IMAGE_HEIGHT: number;
    TEXTURE_3D: number;
    TEXTURE_WRAP_R: number;
    MAX_3D_TEXTURE_SIZE: number;
    UNSIGNED_INT_2_10_10_10_REV: number;
    MAX_ELEMENTS_VERTICES: number;
    MAX_ELEMENTS_INDICES: number;
    TEXTURE_MIN_LOD: number;
    TEXTURE_MAX_LOD: number;
    TEXTURE_BASE_LEVEL: number;
    TEXTURE_MAX_LEVEL: number;
    MIN: number;
    MAX: number;
    DEPTH_COMPONENT24: number;
    MAX_TEXTURE_LOD_BIAS: number;
    TEXTURE_COMPARE_MODE: number;
    TEXTURE_COMPARE_FUNC: number;
    CURRENT_QUERY: number;
    QUERY_RESULT: number;
    QUERY_RESULT_AVAILABLE: number;
    STREAM_READ: number;
    STREAM_COPY: number;
    STATIC_READ: number;
    STATIC_COPY: number;
    DYNAMIC_READ: number;
    DYNAMIC_COPY: number;
    MAX_DRAW_BUFFERS: number;
    DRAW_BUFFER0: number;
    DRAW_BUFFER1: number;
    DRAW_BUFFER2: number;
    DRAW_BUFFER3: number;
    DRAW_BUFFER4: number;
    DRAW_BUFFER5: number;
    DRAW_BUFFER6: number;
    DRAW_BUFFER7: number;
    DRAW_BUFFER8: number;
    DRAW_BUFFER9: number;
    DRAW_BUFFER10: number;
    DRAW_BUFFER11: number;
    DRAW_BUFFER12: number;
    DRAW_BUFFER13: number;
    DRAW_BUFFER14: number;
    DRAW_BUFFER15: number;
    MAX_FRAGMENT_UNIFORM_COMPONENTS: number;
    MAX_VERTEX_UNIFORM_COMPONENTS: number;
    SAMPLER_3D: number;
    SAMPLER_2D_SHADOW: number;
    FRAGMENT_SHADER_DERIVATIVE_HINT: number;
    PIXEL_PACK_BUFFER: number;
    PIXEL_UNPACK_BUFFER: number;
    PIXEL_PACK_BUFFER_BINDING: number;
    PIXEL_UNPACK_BUFFER_BINDING: number;
    FLOAT_MAT2x3: number;
    FLOAT_MAT2x4: number;
    FLOAT_MAT3x2: number;
    FLOAT_MAT3x4: number;
    FLOAT_MAT4x2: number;
    FLOAT_MAT4x3: number;
    SRGB: number;
    SRGB8: number;
    SRGB8_ALPHA8: number;
    COMPARE_REF_TO_TEXTURE: number;
    RGBA32F: number;
    RGB32F: number;
    RGBA16F: number;
    RGB16F: number;
    VERTEX_ATTRIB_ARRAY_INTEGER: number;
    MAX_ARRAY_TEXTURE_LAYERS: number;
    MIN_PROGRAM_TEXEL_OFFSET: number;
    MAX_PROGRAM_TEXEL_OFFSET: number;
    MAX_VARYING_COMPONENTS: number;
    TEXTURE_2D_ARRAY: number;
    TEXTURE_BINDING_2D_ARRAY: number;
    R11F_G11F_B10F: number;
    UNSIGNED_INT_10F_11F_11F_REV: number;
    RGB9_E5: number;
    UNSIGNED_INT_5_9_9_9_REV: number;
    TRANSFORM_FEEDBACK_BUFFER_MODE: number;
    MAX_TRANSFORM_FEEDBACK_SEPARATE_COMPONENTS: number;
    TRANSFORM_FEEDBACK_VARYINGS: number;
    TRANSFORM_FEEDBACK_BUFFER_START: number;
    TRANSFORM_FEEDBACK_BUFFER_SIZE: number;
    TRANSFORM_FEEDBACK_PRIMITIVES_WRITTEN: number;
    RASTERIZER_DISCARD: number;
    MAX_TRANSFORM_FEEDBACK_INTERLEAVED_COMPONENTS: number;
    MAX_TRANSFORM_FEEDBACK_SEPARATE_ATTRIBS: number;
    INTERLEAVED_ATTRIBS: number;
    SEPARATE_ATTRIBS: number;
    TRANSFORM_FEEDBACK_BUFFER: number;
    TRANSFORM_FEEDBACK_BUFFER_BINDING: number;
    RGBA32UI: number;
    RGB32UI: number;
    RGBA16UI: number;
    RGB16UI: number;
    RGBA8UI: number;
    RGB8UI: number;
    RGBA32I: number;
    RGB32I: number;
    RGBA16I: number;
    RGB16I: number;
    RGBA8I: number;
    RGB8I: number;
    RED_INTEGER: number;
    RGB_INTEGER: number;
    RGBA_INTEGER: number;
    SAMPLER_2D_ARRAY: number;
    SAMPLER_2D_ARRAY_SHADOW: number;
    SAMPLER_CUBE_SHADOW: number;
    UNSIGNED_INT_VEC2: number;
    UNSIGNED_INT_VEC3: number;
    UNSIGNED_INT_VEC4: number;
    INT_SAMPLER_2D: number;
    INT_SAMPLER_3D: number;
    INT_SAMPLER_CUBE: number;
    INT_SAMPLER_2D_ARRAY: number;
    UNSIGNED_INT_SAMPLER_2D: number;
    UNSIGNED_INT_SAMPLER_3D: number;
    UNSIGNED_INT_SAMPLER_CUBE: number;
    UNSIGNED_INT_SAMPLER_2D_ARRAY: number;
    DEPTH_COMPONENT32F: number;
    DEPTH32F_STENCIL8: number;
    FLOAT_32_UNSIGNED_INT_24_8_REV: number;
    FRAMEBUFFER_ATTACHMENT_COLOR_ENCODING: number;
    FRAMEBUFFER_ATTACHMENT_COMPONENT_TYPE: number;
    FRAMEBUFFER_ATTACHMENT_RED_SIZE: number;
    FRAMEBUFFER_ATTACHMENT_GREEN_SIZE: number;
    FRAMEBUFFER_ATTACHMENT_BLUE_SIZE: number;
    FRAMEBUFFER_ATTACHMENT_ALPHA_SIZE: number;
    FRAMEBUFFER_ATTACHMENT_DEPTH_SIZE: number;
    FRAMEBUFFER_ATTACHMENT_STENCIL_SIZE: number;
    FRAMEBUFFER_DEFAULT: number;
    DEPTH_STENCIL_ATTACHMENT: number;
    DEPTH_STENCIL: number;
    UNSIGNED_INT_24_8: number;
    DEPTH24_STENCIL8: number;
    UNSIGNED_NORMALIZED: number;
    DRAW_FRAMEBUFFER_BINDING: number; /* Same as FRAMEBUFFER_BINDING */
    READ_FRAMEBUFFER: number;
    DRAW_FRAMEBUFFER: number;
    READ_FRAMEBUFFER_BINDING: number;
    RENDERBUFFER_SAMPLES: number;
    FRAMEBUFFER_ATTACHMENT_TEXTURE_LAYER: number;
    MAX_COLOR_ATTACHMENTS: number;
    COLOR_ATTACHMENT1: number;
    COLOR_ATTACHMENT2: number;
    COLOR_ATTACHMENT3: number;
    COLOR_ATTACHMENT4: number;
    COLOR_ATTACHMENT5: number;
    COLOR_ATTACHMENT6: number;
    COLOR_ATTACHMENT7: number;
    COLOR_ATTACHMENT8: number;
    COLOR_ATTACHMENT9: number;
    COLOR_ATTACHMENT10: number;
    COLOR_ATTACHMENT11: number;
    COLOR_ATTACHMENT12: number;
    COLOR_ATTACHMENT13: number;
    COLOR_ATTACHMENT14: number;
    COLOR_ATTACHMENT15: number;
    FRAMEBUFFER_INCOMPLETE_MULTISAMPLE: number;
    MAX_SAMPLES: number;
    HALF_FLOAT: number;
    RG: number;
    RG_INTEGER: number;
    R8: number;
    RG8: number;
    R16F: number;
    R32F: number;
    RG16F: number;
    RG32F: number;
    R8I: number;
    R8UI: number;
    R16I: number;
    R16UI: number;
    R32I: number;
    R32UI: number;
    RG8I: number;
    RG8UI: number;
    RG16I: number;
    RG16UI: number;
    RG32I: number;
    RG32UI: number;
    VERTEX_ARRAY_BINDING: number;
    R8_SNORM: number;
    RG8_SNORM: number;
    RGB8_SNORM: number;
    RGBA8_SNORM: number;
    SIGNED_NORMALIZED: number;
    COPY_READ_BUFFER: number;
    COPY_WRITE_BUFFER: number;
    COPY_READ_BUFFER_BINDING: number; /* Same as COPY_READ_BUFFER */
    COPY_WRITE_BUFFER_BINDING: number; /* Same as COPY_WRITE_BUFFER */
    UNIFORM_BUFFER: number;
    UNIFORM_BUFFER_BINDING: number;
    UNIFORM_BUFFER_START: number;
    UNIFORM_BUFFER_SIZE: number;
    MAX_VERTEX_UNIFORM_BLOCKS: number;
    MAX_FRAGMENT_UNIFORM_BLOCKS: number;
    MAX_COMBINED_UNIFORM_BLOCKS: number;
    MAX_UNIFORM_BUFFER_BINDINGS: number;
    MAX_UNIFORM_BLOCK_SIZE: number;
    MAX_COMBINED_VERTEX_UNIFORM_COMPONENTS: number;
    MAX_COMBINED_FRAGMENT_UNIFORM_COMPONENTS: number;
    UNIFORM_BUFFER_OFFSET_ALIGNMENT: number;
    ACTIVE_UNIFORM_BLOCKS: number;
    UNIFORM_TYPE: number;
    UNIFORM_SIZE: number;
    UNIFORM_BLOCK_INDEX: number;
    UNIFORM_OFFSET: number;
    UNIFORM_ARRAY_STRIDE: number;
    UNIFORM_MATRIX_STRIDE: number;
    UNIFORM_IS_ROW_MAJOR: number;
    UNIFORM_BLOCK_BINDING: number;
    UNIFORM_BLOCK_DATA_SIZE: number;
    UNIFORM_BLOCK_ACTIVE_UNIFORMS: number;
    UNIFORM_BLOCK_ACTIVE_UNIFORM_INDICES: number;
    UNIFORM_BLOCK_REFERENCED_BY_VERTEX_SHADER: number;
    UNIFORM_BLOCK_REFERENCED_BY_FRAGMENT_SHADER: number;
    INVALID_INDEX: number;
    MAX_VERTEX_OUTPUT_COMPONENTS: number;
    MAX_FRAGMENT_INPUT_COMPONENTS: number;
    MAX_SERVER_WAIT_TIMEOUT: number;
    OBJECT_TYPE: number;
    SYNC_CONDITION: number;
    SYNC_STATUS: number;
    SYNC_FLAGS: number;
    SYNC_FENCE: number;
    SYNC_GPU_COMMANDS_COMPLETE: number;
    UNSIGNALED: number;
    SIGNALED: number;
    ALREADY_SIGNALED: number;
    TIMEOUT_EXPIRED: number;
    CONDITION_SATISFIED: number;
    WAIT_FAILED: number;
    SYNC_FLUSH_COMMANDS_BIT: number;
    VERTEX_ATTRIB_ARRAY_DIVISOR: number;
    ANY_SAMPLES_PASSED: number;
    ANY_SAMPLES_PASSED_CONSERVATIVE: number;
    SAMPLER_BINDING: number;
    RGB10_A2UI: number;
    INT_2_10_10_10_REV: number;
    TRANSFORM_FEEDBACK: number;
    TRANSFORM_FEEDBACK_PAUSED: number;
    TRANSFORM_FEEDBACK_ACTIVE: number;
    TRANSFORM_FEEDBACK_BINDING: number;
    TEXTURE_IMMUTABLE_FORMAT: number;
    MAX_ELEMENT_INDEX: number;
    TEXTURE_IMMUTABLE_LEVELS: number;

    TIMEOUT_IGNORED: number;

    /* WebGL-specific enums */
    MAX_CLIENT_WAIT_TIMEOUT_WEBGL: number;

    /* WebGL-specific enums */
    MAX_CLIENT_WAIT_TIMEOUT_WEBGL: number;

    /* Buffer objects */
    // WebGL1:
    bufferData(target: GLenum, size: GLsizeiptr, usage: GLenum);
    bufferData(target: GLenum, ArrayBuffer? srcData, usage: GLenum);
    bufferData(target: GLenum, srcData: ArrayBufferView, usage: GLenum);
    bufferSubData(target: GLenum, dstByteOffset: GLintptr, srcData: BufferDataSource);
    // WebGL2:
    bufferData(target: GLenum, srcData: ArrayBufferView, usage: GLenum, srcOffset: GLuint, optional length:GLuint = 0);
    bufferSubData(target: GLenum, dstByteOffset: GLintptr, srcData: ArrayBufferView, srcOffset: GLuint, optional length:GLuint = 0);

    copyBufferSubData(readTarget: GLenum, writeTarget: GLenum, readOffset: GLintptr, writeOffset: GLintptr, size: GLsizeiptr);
    // MapBufferRange, in particular its read-only and write-only modes,
    // can not be exposed safely to JavaScript. GetBufferSubData
    // replaces it for the purpose of fetching data back from the GPU.
    getBufferSubData(target: GLenum, srcByteOffset: GLintptr, dstBuffer: ArrayBufferView, optional dstOffset:GLuint = 0, optional length:GLuint = 0);

    /* Framebuffer objects */
    blitFramebuffer(srcX0: GLint, srcY0: GLint, srcX1: GLint, srcY1: GLint, dstX0: GLint, dstY0: GLint, dstX1: GLint, dstY1: GLint, mask: GLbitfield, filter: GLenum);
    framebufferTextureLayer(target: GLenum, attachment: GLenum, WebGLTexture? texture, level: GLint, layer: GLint);
    invalidateFramebuffer(target: GLenum, sequence < GLenum>attachments);
    invalidateSubFramebuffer(target: GLenum, sequence < GLenum>attachments, x: GLint, y: GLint, width: GLsizei, height: GLsizei);
    readBuffer(src: GLenum);

    /* Renderbuffer objects */
    getInternalformatParameter(target: GLenum, internalformat: GLenum, pname: GLenum): any;
    renderbufferStorageMultisample(target: GLenum, samples: GLsizei, internalformat: GLenum, width: GLsizei, height: GLsizei);

    /* Texture objects */
    texStorage2D(target: GLenum, levels: GLsizei, internalformat: GLenum, width: GLsizei, height: GLsizei);
    texStorage3D(target: GLenum, levels: GLsizei, internalformat: GLenum, width: GLsizei, height: GLsizei, depth: GLsizei);

    // WebGL1 legacy entrypoints:
    texImage2D(target: GLenum, level: GLint, internalformat: GLint, width: GLsizei, height: GLsizei, border: GLint, format: GLenum, type: GLenum, ArrayBufferView? pixels);
    texImage2D(target: GLenum, level: GLint, internalformat: GLint, format: GLenum, type: GLenum, TexImageSource source); // May throw DOMException

    texSubImage2D(target: GLenum, level: GLint, xoffset: GLint, yoffset: GLint, width: GLsizei, height: GLsizei,
        format: GLenum, type: GLenum, ArrayBufferView? pixels);
    texSubImage2D(target: GLenum, level: GLint, xoffset: GLint, yoffset: GLint, format: GLenum, type: GLenum, TexImageSource source); // May throw DOMException

    // WebGL2 entrypoints:
    texImage2D(target: GLenum, level: GLint, internalformat: GLint, width: GLsizei, height: GLsizei, border: GLint, format: GLenum, type: GLenum, pboOffset: GLintptr);
    texImage2D(target: GLenum, level: GLint, internalformat: GLint, width: GLsizei, height: GLsizei, border: GLint, format: GLenum, type: GLenum, TexImageSource source); // May throw DOMException
    texImage2D(target: GLenum, level: GLint, internalformat: GLint, width: GLsizei, height: GLsizei, border: GLint, format: GLenum, type: GLenum, srcData: ArrayBufferView, srcOffset: GLuint);

    texImage3D(target: GLenum, level: GLint, internalformat: GLint, width: GLsizei, height: GLsizei, depth: GLsizei, border: GLint, format: GLenum, type: GLenum, pboOffset: GLintptr);
    texImage3D(target: GLenum, level: GLint, internalformat: GLint, width: GLsizei, height: GLsizei, depth: GLsizei, border: GLint, format: GLenum, type: GLenum, TexImageSource source); // May throw DOMException
    texImage3D(target: GLenum, level: GLint, internalformat: GLint, width: GLsizei, height: GLsizei, depth: GLsizei, border: GLint, format: GLenum, type: GLenum, ArrayBufferView? srcData);
    texImage3D(target: GLenum, level: GLint, internalformat: GLint, width: GLsizei, height: GLsizei, depth: GLsizei, border: GLint, format: GLenum, type: GLenum, srcData: ArrayBufferView, srcOffset: GLuint);

    texSubImage2D(target: GLenum, level: GLint, xoffset: GLint, yoffset: GLint, width: GLsizei, height: GLsizei, format: GLenum, type: GLenum, pboOffset: GLintptr);
    texSubImage2D(target: GLenum, level: GLint, xoffset: GLint, yoffset: GLint, width: GLsizei, height: GLsizei, format: GLenum, type: GLenum, TexImageSource source); // May throw DOMException
    texSubImage2D(target: GLenum, level: GLint, xoffset: GLint, yoffset: GLint, width: GLsizei, height: GLsizei, format: GLenum, type: GLenum, srcData: ArrayBufferView, srcOffset: GLuint);

    texSubImage3D(target: GLenum, level: GLint, xoffset: GLint, yoffset: GLint, zoffset: GLint, width: GLsizei, height: GLsizei, depth: GLsizei, format: GLenum, type: GLenum, pboOffset: GLintptr);
    texSubImage3D(target: GLenum, level: GLint, xoffset: GLint, yoffset: GLint, zoffset: GLint, width: GLsizei, height: GLsizei, depth: GLsizei, format: GLenum, type: GLenum, TexImageSource source); // May throw DOMException
    texSubImage3D(target: GLenum, level: GLint, xoffset: GLint, yoffset: GLint, zoffset: GLint, width: GLsizei, height: GLsizei, depth: GLsizei, format: GLenum, type: GLenum, ArrayBufferView? srcData, optional srcOffset:GLuint = 0);

    copyTexSubImage3D(target: GLenum, level: GLint, xoffset: GLint, yoffset: GLint, zoffset: GLint, x: GLint, y: GLint, width: GLsizei, height: GLsizei);

    compressedTexImage2D(target: GLenum, level: GLint, internalformat: GLenum, width: GLsizei, height: GLsizei, border: GLint, imageSize: GLsizei, offset: GLintptr);
    compressedTexImage2D(target: GLenum, level: GLint, internalformat: GLenum, width: GLsizei, height: GLsizei, border: GLint, srcData: ArrayBufferView, optional srcOffset:GLuint = 0, optional srcLengthOverride:GLuint = 0);

    compressedTexImage3D(target: GLenum, level: GLint, internalformat: GLenum, width: GLsizei, height: GLsizei, depth: GLsizei, border: GLint, imageSize: GLsizei, offset: GLintptr);
    compressedTexImage3D(target: GLenum, level: GLint, internalformat: GLenum, width: GLsizei, height: GLsizei, depth: GLsizei, border: GLint, srcData: ArrayBufferView, optional srcOffset:GLuint = 0, optional srcLengthOverride:GLuint = 0);

    compressedTexSubImage2D(target: GLenum, level: GLint, xoffset: GLint, yoffset: GLint, width: GLsizei, height: GLsizei, format: GLenum, imageSize: GLsizei, offset: GLintptr);
    compressedTexSubImage2D(target: GLenum, level: GLint, xoffset: GLint, yoffset: GLint, width: GLsizei, height: GLsizei, format: GLenum, srcData: ArrayBufferView, optional srcOffset:GLuint = 0, optional srcLengthOverride:GLuint = 0);

    compressedTexSubImage3D(target: GLenum, level: GLint, xoffset: GLint, yoffset: GLint, zoffset: GLint, width: GLsizei, height: GLsizei, depth: GLsizei, format: GLenum, imageSize: GLsizei, offset: GLintptr);
    compressedTexSubImage3D(target: GLenum, level: GLint, xoffset: GLint, yoffset: GLint, zoffset: GLint, width: GLsizei, height: GLsizei, depth: GLsizei, format: GLenum, srcData: ArrayBufferView, optional srcOffset:GLuint = 0, optional srcLengthOverride:GLuint = 0);

    /* Programs and shaders */
    getFragDataLocation: GLint(program: WebGLProgram, DOMString name): number;

    /* Uniforms */
    uniform1ui(WebGLUniformLocation? location, v0: GLuint);
    uniform2ui(WebGLUniformLocation? location, v0: GLuint, v1: GLuint);
    uniform3ui(WebGLUniformLocation? location, v0: GLuint, v1: GLuint, v2: GLuint);
    uniform4ui(WebGLUniformLocation? location, v0: GLuint, v1: GLuint, v2: GLuint, v3: GLuint);

    uniform1fv(WebGLUniformLocation? location, data: Float32List, optional srcOffset:GLuint = 0, optional srcLength:GLuint = 0);
    uniform2fv(WebGLUniformLocation? location, data: Float32List, optional srcOffset:GLuint = 0, optional srcLength:GLuint = 0);
    uniform3fv(WebGLUniformLocation? location, data: Float32List, optional srcOffset:GLuint = 0, optional srcLength:GLuint = 0);
    uniform4fv(WebGLUniformLocation? location, data: Float32List, optional srcOffset:GLuint = 0, optional srcLength:GLuint = 0);

    uniform1iv(WebGLUniformLocation? location, data: Int32List, optional srcOffset:GLuint = 0, optional srcLength:GLuint = 0);
    uniform2iv(WebGLUniformLocation? location, data: Int32List, optional srcOffset:GLuint = 0, optional srcLength:GLuint = 0);
    uniform3iv(WebGLUniformLocation? location, data: Int32List, optional srcOffset:GLuint = 0, optional srcLength:GLuint = 0);
    uniform4iv(WebGLUniformLocation? location, data: Int32List, optional srcOffset:GLuint = 0, optional srcLength:GLuint = 0);

    uniform1uiv(WebGLUniformLocation? location, data: Uint32List, optional srcOffset:GLuint = 0, optional srcLength:GLuint = 0);
    uniform2uiv(WebGLUniformLocation? location, data: Uint32List, optional srcOffset:GLuint = 0, optional srcLength:GLuint = 0);
    uniform3uiv(WebGLUniformLocation? location, data: Uint32List, optional srcOffset:GLuint = 0, optional srcLength:GLuint = 0);
    uniform4uiv(WebGLUniformLocation? location, data: Uint32List, optional srcOffset:GLuint = 0, optional srcLength:GLuint = 0);

    uniformMatrix2fv(WebGLUniformLocation? location, GLboolean transpose, data: Float32List, optional srcOffset:GLuint = 0, optional srcLength:GLuint = 0);
    uniformMatrix3x2fv(WebGLUniformLocation? location, GLboolean transpose, data: Float32List, optional srcOffset:GLuint = 0, optional srcLength:GLuint = 0);
    uniformMatrix4x2fv(WebGLUniformLocation? location, GLboolean transpose, data: Float32List, optional srcOffset:GLuint = 0, optional srcLength:GLuint = 0);

    uniformMatrix2x3fv(WebGLUniformLocation? location, GLboolean transpose, data: Float32List, optional srcOffset:GLuint = 0, optional srcLength:GLuint = 0);
    uniformMatrix3fv(WebGLUniformLocation? location, GLboolean transpose, data: Float32List, optional srcOffset:GLuint = 0, optional srcLength:GLuint = 0);
    uniformMatrix4x3fv(WebGLUniformLocation? location, GLboolean transpose, data: Float32List, optional srcOffset:GLuint = 0, optional srcLength:GLuint = 0);

    uniformMatrix2x4fv(WebGLUniformLocation? location, GLboolean transpose, data: Float32List, optional srcOffset:GLuint = 0, optional srcLength:GLuint = 0);
    uniformMatrix3x4fv(WebGLUniformLocation? location, GLboolean transpose, data: Float32List, optional srcOffset:GLuint = 0, optional srcLength:GLuint = 0);
    uniformMatrix4fv(WebGLUniformLocation? location, GLboolean transpose, data: Float32List, optional srcOffset:GLuint = 0, optional srcLength:GLuint = 0);

    /* Vertex attribs */
    vertexAttribI4i(index: GLuint, x: GLint, y: GLint, z: GLint, w: GLint);
    vertexAttribI4iv(index: GLuint, values: Int32List);
    vertexAttribI4ui(index: GLuint, x: GLuint, y: GLuint, z: GLuint, w: GLuint);
    vertexAttribI4uiv(index: GLuint, values: Uint32List);
    vertexAttribIPointer(index: GLuint, size: GLint, type: GLenum, stride: GLsizei, offset: GLintptr);

    /* Writing to the drawing buffer */
    vertexAttribDivisor(index: GLuint, divisor: GLuint);
    drawArraysInstanced(mode: GLenum, first: GLint, count: GLsizei, instanceCount: GLsizei);
    drawElementsInstanced(mode: GLenum, count: GLsizei, type: GLenum, offset: GLintptr, instanceCount: GLsizei);
    drawRangeElements(mode: GLenum, start: GLuint, end: GLuint, count: GLsizei, type: GLenum, offset: GLintptr);

    /* Reading back pixels */
    // WebGL1:
    readPixels(x: GLint, y: GLint, width: GLsizei, height: GLsizei, format: GLenum, type: GLenum, ArrayBufferView? dstData);
    // WebGL2:
    readPixels(x: GLint, y: GLint, width: GLsizei, height: GLsizei, format: GLenum, type: GLenum, offset: GLintptr);
    readPixels(x: GLint, y: GLint, width: GLsizei, height: GLsizei, format: GLenum, type: GLenum, dstData: ArrayBufferView, dstOffset: GLuint);

    /* Multiple Render Targets */
    drawBuffers(sequence < GLenum>buffers);

    clearBufferfv(buffer: GLenum, drawbuffer: GLint, values: Float32List, optional srcOffset:GLuint = 0);
    clearBufferiv(buffer: GLenum, drawbuffer: GLint, values: Int32List, optional srcOffset:GLuint = 0);
    clearBufferuiv(buffer: GLenum, drawbuffer: GLint, values: Uint32List, optional srcOffset:GLuint = 0);

    clearBufferfi(buffer: GLenum, drawbuffer: GLint, depth: GLfloat, stencil: GLint);

    /* Query Objects */
    createQuery(): WebGLQuery;
    deleteQuery(WebGLQuery? query);
    isQuery(WebGLQuery? query): GLboolean;
    beginQuery(target: GLenum, query: WebGLQuery);
    endQuery(target: GLenum);
    getQuery(target: GLenum, pname: GLenum): WebGLQuery;
    getQueryParameter(query: WebGLQuery, pname: GLenum): any;

    /* Sampler Objects */
    createSampler(): WebGLSampler;
    deleteSampler(WebGLSampler? sampler);
    isSampler(WebGLSampler? sampler): GLboolean;
    bindSampler(unit: GLuint, WebGLSampler? sampler);
    samplerParameteri(WebGLSampler sampler, pname: GLenum, param: GLint);
    samplerParameterf(WebGLSampler sampler, pname: GLenum, param: GLfloat);
    getSamplerParameter(WebGLSampler sampler, pname: GLenum): any;

    /* Sync objects */
    fenceSync(condition: GLenum, flags: GLbitfield): WebGLSync;
    isSync(WebGLSync? sync): GLboolean;
    deleteSync(WebGLSync? sync);
    clientWaitSync: GLenum(WebGLSync sync, flags: GLbitfield, GLuint64 timeout);
    waitSync(WebGLSync sync, flags: GLbitfield, GLint64 timeout);
    getSyncParameter(WebGLSync sync, pname: GLenum): any;

    /* Transform Feedback */
    createTransformFeedback(): WebGLTransformFeedback;
    deleteTransformFeedback(WebGLTransformFeedback? tf);
    isTransformFeedback(WebGLTransformFeedback? tf): GLboolean;
    bindTransformFeedback(target: GLenum, WebGLTransformFeedback? tf);
    beginTransformFeedback(primitiveMode: GLenum);
    endTransformFeedback();
    transformFeedbackVaryings(program: WebGLProgram, sequence < DOMString>varyings, bufferMode: GLenum);
    getTransformFeedbackVarying(program: WebGLProgram, index: GLuint): WebGLActiveInfo;
    pauseTransformFeedback();
    resumeTransformFeedback();

    /* Uniform Buffer Objects and Transform Feedback Buffers */
    bindBufferBase(target: GLenum, index: GLuint, WebGLBuffer? buffer);
    bindBufferRange(target: GLenum, index: GLuint, WebGLBuffer? buffer, offset: GLintptr, size: GLsizeiptr);
    getIndexedParameter(target: GLenum, index: GLuint): any;
    sequence<GLuint>? getUniformIndices(program: WebGLProgram, sequence < DOMString>uniformNames);
    getActiveUniforms(program: WebGLProgram, sequence < GLuint>uniformIndices, pname: GLenum): any;
    getUniformBlockIndex: GLuint(program: WebGLProgram, DOMString uniformBlockName);
    getActiveUniformBlockParameter(program: WebGLProgram, uniformBlockIndex: GLuint, pname: GLenum): any;
    getActiveUniformBlockName(program: WebGLProgram, uniformBlockIndex: GLuint): DOMString;
    uniformBlockBinding(program: WebGLProgram, uniformBlockIndex: GLuint, uniformBlockBinding: GLuint);

    /* Vertex Array Objects */
    createVertexArray(): WebGLVertexArrayObject;
    deleteVertexArray(WebGLVertexArrayObject? vertexArray);
    isVertexArray(WebGLVertexArrayObject? vertexArray): GLboolean;
    bindVertexArray(WebGLVertexArrayObject? array);
};