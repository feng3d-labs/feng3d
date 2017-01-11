//参考 
//https://www.khronos.org/registry/webgl/specs/latest/2.0/
//https://github.com/DefinitelyTyped/DefinitelyTyped/blob/master/webgl-ext/index.d.ts
//使用工具  
//http://regexr.com/

interface HTMLCanvasElement {
    getContext(contextId: "webgl2"): WebGL2RenderingContext;
}

declare type BufferDataSource = ArrayBufferView | ArrayBuffer;
declare type TexImageSource = ImageData | HTMLVideoElement | HTMLImageElement | HTMLCanvasElement;
declare type DOMString = string;
declare type Float32List = Float32Array | number[];
declare type Int32List = Int32Array | number[];
declare type Uint32List = Int32Array | number[];
declare type GLuint64 = number;
declare type GLint64 = number;

declare interface WebGLQuery extends WebGLObject { }
declare interface WebGLSampler extends WebGLObject { }
declare interface WebGLSync extends WebGLObject { }
declare interface WebGLTransformFeedback extends WebGLObject { }
declare interface WebGLVertexArrayObject extends WebGLObject { }

/**
 * webgl 2.0 API
 * @author feng 2017-01-10
 */
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

    /* Buffer objects */
    // WebGL1:
    bufferData(target: GLenum, srcData: GLsizeiptr | ArrayBuffer | ArrayBufferView, usage: GLenum);
    
    bufferData(target: GLenum, size: GLsizeiptr, usage: GLenum);
    bufferData(target: GLenum, srcData: ArrayBuffer, usage: GLenum);
    bufferData(target: GLenum, srcData: ArrayBufferView, usage: GLenum);
    bufferSubData(target: GLenum, dstByteOffset: GLintptr, srcData: BufferDataSource);
    // WebGL2:
    bufferData(target: GLenum, srcData: ArrayBufferView, usage: GLenum, srcOffset: GLuint, length?: GLuint);
    bufferSubData(target: GLenum, dstByteOffset: GLintptr, srcData: ArrayBufferView, srcOffset: GLuint, length?: GLuint);

    copyBufferSubData(readTarget: GLenum, writeTarget: GLenum, readOffset: GLintptr, writeOffset: GLintptr, size: GLsizeiptr);
    // MapBufferRange, in particular its read-only and write-only modes,
    // can not be exposed safely to JavaScript. GetBufferSubData
    // replaces it for the purpose of fetching data back from the GPU.
    getBufferSubData(target: GLenum, srcByteOffset: GLintptr, dstBuffer: ArrayBufferView, dstOffset?: GLuint, length?: GLuint);

    /* Framebuffer objects */
    blitFramebuffer(srcX0: GLint, srcY0: GLint, srcX1: GLint, srcY1: GLint, dstX0: GLint, dstY0: GLint, dstX1: GLint, dstY1: GLint, mask: GLbitfield, filter: GLenum);
    framebufferTextureLayer(target: GLenum, attachment: GLenum, texture: WebGLTexture, level: GLint, layer: GLint);
    invalidateFramebuffer(target: GLenum, attachments: GLenum[]);
    invalidateSubFramebuffer(target: GLenum, attachments: GLenum[], x: GLint, y: GLint, width: GLsizei, height: GLsizei);
    readBuffer(src: GLenum);

    /* Renderbuffer objects */
    getInternalformatParameter(target: GLenum, internalformat: GLenum, pname: GLenum): any;
    renderbufferStorageMultisample(target: GLenum, samples: GLsizei, internalformat: GLenum, width: GLsizei, height: GLsizei);

    /* Texture objects */
    texStorage2D(target: GLenum, levels: GLsizei, internalformat: GLenum, width: GLsizei, height: GLsizei);
    texStorage3D(target: GLenum, levels: GLsizei, internalformat: GLenum, width: GLsizei, height: GLsizei, depth: GLsizei);

    // WebGL1 legacy entrypoints:
    texImage2D(target: GLenum, level: GLint, internalformat: GLint, width: GLsizei, height: GLsizei, border: GLint, format: GLenum, type: GLenum, pixels: ArrayBufferView);
    texImage2D(target: GLenum, level: GLint, internalformat: GLint, format: GLenum, type: GLenum, source: TexImageSource); // May throw DOMException

    texSubImage2D(target: GLenum, level: GLint, xoffset: GLint, yoffset: GLint, width: GLsizei, height: GLsizei,
        format: GLenum, type: GLenum, pixels: ArrayBufferView);
    texSubImage2D(target: GLenum, level: GLint, xoffset: GLint, yoffset: GLint, format: GLenum, type: GLenum, source: TexImageSource); // May throw DOMException

    // WebGL2 entrypoints:
    texImage2D(target: GLenum, level: GLint, internalformat: GLint, width: GLsizei, height: GLsizei, border: GLint, format: GLenum, type: GLenum, pboOffset: GLintptr);
    texImage2D(target: GLenum, level: GLint, internalformat: GLint, width: GLsizei, height: GLsizei, border: GLint, format: GLenum, type: GLenum, source: TexImageSource); // May throw DOMException
    texImage2D(target: GLenum, level: GLint, internalformat: GLint, width: GLsizei, height: GLsizei, border: GLint, format: GLenum, type: GLenum, srcData: ArrayBufferView, srcOffset: GLuint);

    texImage3D(target: GLenum, level: GLint, internalformat: GLint, width: GLsizei, height: GLsizei, depth: GLsizei, border: GLint, format: GLenum, type: GLenum, pboOffset: GLintptr);
    texImage3D(target: GLenum, level: GLint, internalformat: GLint, width: GLsizei, height: GLsizei, depth: GLsizei, border: GLint, format: GLenum, type: GLenum, source: TexImageSource); // May throw DOMException
    texImage3D(target: GLenum, level: GLint, internalformat: GLint, width: GLsizei, height: GLsizei, depth: GLsizei, border: GLint, format: GLenum, type: GLenum, srcData: ArrayBufferView);
    texImage3D(target: GLenum, level: GLint, internalformat: GLint, width: GLsizei, height: GLsizei, depth: GLsizei, border: GLint, format: GLenum, type: GLenum, srcData: ArrayBufferView, srcOffset: GLuint);

    texSubImage2D(target: GLenum, level: GLint, xoffset: GLint, yoffset: GLint, width: GLsizei, height: GLsizei, format: GLenum, type: GLenum, pboOffset: GLintptr);
    texSubImage2D(target: GLenum, level: GLint, xoffset: GLint, yoffset: GLint, width: GLsizei, height: GLsizei, format: GLenum, type: GLenum, source: TexImageSource); // May throw DOMException
    texSubImage2D(target: GLenum, level: GLint, xoffset: GLint, yoffset: GLint, width: GLsizei, height: GLsizei, format: GLenum, type: GLenum, srcData: ArrayBufferView, srcOffset: GLuint);

    texSubImage3D(target: GLenum, level: GLint, xoffset: GLint, yoffset: GLint, zoffset: GLint, width: GLsizei, height: GLsizei, depth: GLsizei, format: GLenum, type: GLenum, pboOffset: GLintptr);
    texSubImage3D(target: GLenum, level: GLint, xoffset: GLint, yoffset: GLint, zoffset: GLint, width: GLsizei, height: GLsizei, depth: GLsizei, format: GLenum, type: GLenum, source: TexImageSource); // May throw DOMException
    texSubImage3D(target: GLenum, level: GLint, xoffset: GLint, yoffset: GLint, zoffset: GLint, width: GLsizei, height: GLsizei, depth: GLsizei, format: GLenum, type: GLenum, srcData: ArrayBufferView, srcOffset?: GLuint);

    copyTexSubImage3D(target: GLenum, level: GLint, xoffset: GLint, yoffset: GLint, zoffset: GLint, x: GLint, y: GLint, width: GLsizei, height: GLsizei);

    compressedTexImage2D(target: GLenum, level: GLint, internalformat: GLenum, width: GLsizei, height: GLsizei, border: GLint, imageSize: GLsizei, offset: GLintptr);
    compressedTexImage2D(target: GLenum, level: GLint, internalformat: GLenum, width: GLsizei, height: GLsizei, border: GLint, srcData: ArrayBufferView, srcOffset?: GLuint, srcLengthOverride?: GLuint);

    compressedTexImage3D(target: GLenum, level: GLint, internalformat: GLenum, width: GLsizei, height: GLsizei, depth: GLsizei, border: GLint, imageSize: GLsizei, offset: GLintptr);
    compressedTexImage3D(target: GLenum, level: GLint, internalformat: GLenum, width: GLsizei, height: GLsizei, depth: GLsizei, border: GLint, srcData: ArrayBufferView, srcOffset?: GLuint, srcLengthOverride?: GLuint);

    compressedTexSubImage2D(target: GLenum, level: GLint, xoffset: GLint, yoffset: GLint, width: GLsizei, height: GLsizei, format: GLenum, imageSize: GLsizei, offset: GLintptr);
    compressedTexSubImage2D(target: GLenum, level: GLint, xoffset: GLint, yoffset: GLint, width: GLsizei, height: GLsizei, format: GLenum, srcData: ArrayBufferView, srcOffset?: GLuint, srcLengthOverride?: GLuint);

    compressedTexSubImage3D(target: GLenum, level: GLint, xoffset: GLint, yoffset: GLint, zoffset: GLint, width: GLsizei, height: GLsizei, depth: GLsizei, format: GLenum, imageSize: GLsizei, offset: GLintptr);
    compressedTexSubImage3D(target: GLenum, level: GLint, xoffset: GLint, yoffset: GLint, zoffset: GLint, width: GLsizei, height: GLsizei, depth: GLsizei, format: GLenum, srcData: ArrayBufferView, srcOffset?: GLuint, srcLengthOverride?: GLuint);

    /* Programs and shaders */
    getFragDataLocation(program: WebGLProgram, name: DOMString): number;

    /* Uniforms */
    uniform1ui(location: WebGLUniformLocation, v0: GLuint);
    uniform2ui(location: WebGLUniformLocation, v0: GLuint, v1: GLuint);
    uniform3ui(location: WebGLUniformLocation, v0: GLuint, v1: GLuint, v2: GLuint);
    uniform4ui(location: WebGLUniformLocation, v0: GLuint, v1: GLuint, v2: GLuint, v3: GLuint);

    uniform1fv(location: WebGLUniformLocation, data: Float32List, srcOffset?: GLuint, srcLength?: GLuint);
    uniform2fv(location: WebGLUniformLocation, data: Float32List, srcOffset?: GLuint, srcLength?: GLuint);
    uniform3fv(location: WebGLUniformLocation, data: Float32List, srcOffset?: GLuint, srcLength?: GLuint);
    uniform4fv(location: WebGLUniformLocation, data: Float32List, srcOffset?: GLuint, srcLength?: GLuint);

    uniform1iv(location: WebGLUniformLocation, data: Int32List, srcOffset?: GLuint, srcLength?: GLuint);
    uniform2iv(location: WebGLUniformLocation, data: Int32List, srcOffset?: GLuint, srcLength?: GLuint);
    uniform3iv(location: WebGLUniformLocation, data: Int32List, srcOffset?: GLuint, srcLength?: GLuint);
    uniform4iv(location: WebGLUniformLocation, data: Int32List, srcOffset?: GLuint, srcLength?: GLuint);

    uniform1uiv(location: WebGLUniformLocation, data: Uint32List, srcOffset?: GLuint, srcLength?: GLuint);
    uniform2uiv(location: WebGLUniformLocation, data: Uint32List, srcOffset?: GLuint, srcLength?: GLuint);
    uniform3uiv(location: WebGLUniformLocation, data: Uint32List, srcOffset?: GLuint, srcLength?: GLuint);
    uniform4uiv(location: WebGLUniformLocation, data: Uint32List, srcOffset?: GLuint, srcLength?: GLuint);

    uniformMatrix2fv(location: WebGLUniformLocation, transpose: GLboolean, data: Float32List, srcOffset?: GLuint, srcLength?: GLuint);
    uniformMatrix3x2fv(location: WebGLUniformLocation, transpose: GLboolean, data: Float32List, srcOffset?: GLuint, srcLength?: GLuint);
    uniformMatrix4x2fv(location: WebGLUniformLocation, transpose: GLboolean, data: Float32List, srcOffset?: GLuint, srcLength?: GLuint);

    uniformMatrix2x3fv(location: WebGLUniformLocation, transpose: GLboolean, data: Float32List, srcOffset?: GLuint, srcLength?: GLuint);
    uniformMatrix3fv(location: WebGLUniformLocation, transpose: GLboolean, data: Float32List, srcOffset?: GLuint, srcLength?: GLuint);
    uniformMatrix4x3fv(location: WebGLUniformLocation, transpose: GLboolean, data: Float32List, srcOffset?: GLuint, srcLength?: GLuint);

    uniformMatrix2x4fv(location: WebGLUniformLocation, transpose: GLboolean, data: Float32List, srcOffset?: GLuint, srcLength?: GLuint);
    uniformMatrix3x4fv(location: WebGLUniformLocation, transpose: GLboolean, data: Float32List, srcOffset?: GLuint, srcLength?: GLuint);
    uniformMatrix4fv(location: WebGLUniformLocation, transpose: GLboolean, data: Float32List, srcOffset?: GLuint, srcLength?: GLuint);

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
    readPixels(x: GLint, y: GLint, width: GLsizei, height: GLsizei, format: GLenum, type: GLenum, dstData: ArrayBufferView);
    // WebGL2:
    readPixels(x: GLint, y: GLint, width: GLsizei, height: GLsizei, format: GLenum, type: GLenum, offset: GLintptr);
    readPixels(x: GLint, y: GLint, width: GLsizei, height: GLsizei, format: GLenum, type: GLenum, dstData: ArrayBufferView, dstOffset: GLuint);

    /* Multiple Render Targets */
    drawBuffers(buffers: GLenum[]);

    clearBufferfv(buffer: GLenum, drawbuffer: GLint, values: Float32List, srcOffset?: GLuint);
    clearBufferiv(buffer: GLenum, drawbuffer: GLint, values: Int32List, srcOffset?: GLuint);
    clearBufferuiv(buffer: GLenum, drawbuffer: GLint, values: Uint32List, srcOffset?: GLuint);

    clearBufferfi(buffer: GLenum, drawbuffer: GLint, depth: GLfloat, stencil: GLint);

    /* Query Objects */
    createQuery(): WebGLQuery;
    deleteQuery(query: WebGLQuery);
    isQuery(query: WebGLQuery): GLboolean;
    beginQuery(target: GLenum, query: WebGLQuery);
    endQuery(target: GLenum);
    getQuery(target: GLenum, pname: GLenum): WebGLQuery;
    getQueryParameter(query: WebGLQuery, pname: GLenum): any;

    /* Sampler Objects */
    createSampler(): WebGLSampler;
    deleteSampler(sampler: WebGLSampler);
    isSampler(sampler: WebGLSampler): GLboolean;
    bindSampler(unit: GLuint, sampler: WebGLSampler);
    samplerParameteri(sampler: WebGLSampler, pname: GLenum, param: GLint);
    samplerParameterf(sampler: WebGLSampler, pname: GLenum, param: GLfloat);
    getSamplerParameter(sampler: WebGLSampler, pname: GLenum): any;

    /* Sync objects */
    fenceSync(condition: GLenum, flags: GLbitfield): WebGLSync;
    isSync(sync: WebGLSync): GLboolean;
    deleteSync(sync: WebGLSync);
    clientWaitSync(sync: WebGLSync, flags: GLbitfield, timeout: GLuint64): GLenum;
    waitSync(sync: WebGLSync, flags: GLbitfield, timeout: GLint64);
    getSyncParameter(sync: WebGLSync, pname: GLenum): any;

    /* Transform Feedback */
    createTransformFeedback(): WebGLTransformFeedback;
    deleteTransformFeedback(tf: WebGLTransformFeedback);
    isTransformFeedback(tf: WebGLTransformFeedback): GLboolean;
    bindTransformFeedback(target: GLenum, tf: WebGLTransformFeedback);
    beginTransformFeedback(primitiveMode: GLenum);
    endTransformFeedback();
    transformFeedbackVaryings(program: WebGLProgram, varyings: DOMString[], bufferMode: GLenum);
    getTransformFeedbackVarying(program: WebGLProgram, index: GLuint): WebGLActiveInfo;
    pauseTransformFeedback();
    resumeTransformFeedback();

    /* Uniform Buffer Objects and Transform Feedback Buffers */
    bindBufferBase(target: GLenum, index: GLuint, buffer: WebGLBuffer);
    bindBufferRange(target: GLenum, index: GLuint, buffer: WebGLBuffer, offset: GLintptr, size: GLsizeiptr);
    getIndexedParameter(target: GLenum, index: GLuint): any;
    getUniformIndices(program: WebGLProgram, uniformNames: DOMString[]): GLuint[];
    getActiveUniforms(program: WebGLProgram, uniformIndices: GLuint[], pname: GLenum): any;
    getUniformBlockIndex(program: WebGLProgram, uniformBlockName: DOMString): GLuint;
    getActiveUniformBlockParameter(program: WebGLProgram, uniformBlockIndex: GLuint, pname: GLenum): any;
    getActiveUniformBlockName(program: WebGLProgram, uniformBlockIndex: GLuint): DOMString;
    uniformBlockBinding(program: WebGLProgram, uniformBlockIndex: GLuint, uniformBlockBinding: GLuint);

    /* Vertex Array Objects */
    createVertexArray(): WebGLVertexArrayObject;
    deleteVertexArray(vertexArray: WebGLVertexArrayObject);
    isVertexArray(vertexArray: WebGLVertexArrayObject): GLboolean;
    bindVertexArray(array: WebGLVertexArrayObject);
}

/**
 * webgl 2.0 API
 * @author feng 2017-01-10
 */
declare var WebGL2RenderingContext: {
    prototype: WebGL2RenderingContext;
    new (): WebGL2RenderingContext;
    // WebGL1:
    readonly ACTIVE_ATTRIBUTES: number;
    readonly ACTIVE_TEXTURE: number;
    readonly ACTIVE_UNIFORMS: number;
    readonly ALIASED_LINE_WIDTH_RANGE: number;
    readonly ALIASED_POINT_SIZE_RANGE: number;
    readonly ALPHA: number;
    readonly ALPHA_BITS: number;
    readonly ALWAYS: number;
    readonly ARRAY_BUFFER: number;
    readonly ARRAY_BUFFER_BINDING: number;
    readonly ATTACHED_SHADERS: number;
    readonly BACK: number;
    readonly BLEND: number;
    readonly BLEND_COLOR: number;
    readonly BLEND_DST_ALPHA: number;
    readonly BLEND_DST_RGB: number;
    readonly BLEND_EQUATION: number;
    readonly BLEND_EQUATION_ALPHA: number;
    readonly BLEND_EQUATION_RGB: number;
    readonly BLEND_SRC_ALPHA: number;
    readonly BLEND_SRC_RGB: number;
    readonly BLUE_BITS: number;
    readonly BOOL: number;
    readonly BOOL_VEC2: number;
    readonly BOOL_VEC3: number;
    readonly BOOL_VEC4: number;
    readonly BROWSER_DEFAULT_WEBGL: number;
    readonly BUFFER_SIZE: number;
    readonly BUFFER_USAGE: number;
    readonly BYTE: number;
    readonly CCW: number;
    readonly CLAMP_TO_EDGE: number;
    readonly COLOR_ATTACHMENT0: number;
    readonly COLOR_BUFFER_BIT: number;
    readonly COLOR_CLEAR_VALUE: number;
    readonly COLOR_WRITEMASK: number;
    readonly COMPILE_STATUS: number;
    readonly COMPRESSED_TEXTURE_FORMATS: number;
    readonly CONSTANT_ALPHA: number;
    readonly CONSTANT_COLOR: number;
    readonly CONTEXT_LOST_WEBGL: number;
    readonly CULL_FACE: number;
    readonly CULL_FACE_MODE: number;
    readonly CURRENT_PROGRAM: number;
    readonly CURRENT_VERTEX_ATTRIB: number;
    readonly CW: number;
    readonly DECR: number;
    readonly DECR_WRAP: number;
    readonly DELETE_STATUS: number;
    readonly DEPTH_ATTACHMENT: number;
    readonly DEPTH_BITS: number;
    readonly DEPTH_BUFFER_BIT: number;
    readonly DEPTH_CLEAR_VALUE: number;
    readonly DEPTH_COMPONENT: number;
    readonly DEPTH_COMPONENT16: number;
    readonly DEPTH_FUNC: number;
    readonly DEPTH_RANGE: number;
    readonly DEPTH_STENCIL: number;
    readonly DEPTH_STENCIL_ATTACHMENT: number;
    readonly DEPTH_TEST: number;
    readonly DEPTH_WRITEMASK: number;
    readonly DITHER: number;
    readonly DONT_CARE: number;
    readonly DST_ALPHA: number;
    readonly DST_COLOR: number;
    readonly DYNAMIC_DRAW: number;
    readonly ELEMENT_ARRAY_BUFFER: number;
    readonly ELEMENT_ARRAY_BUFFER_BINDING: number;
    readonly EQUAL: number;
    readonly FASTEST: number;
    readonly FLOAT: number;
    readonly FLOAT_MAT2: number;
    readonly FLOAT_MAT3: number;
    readonly FLOAT_MAT4: number;
    readonly FLOAT_VEC2: number;
    readonly FLOAT_VEC3: number;
    readonly FLOAT_VEC4: number;
    readonly FRAGMENT_SHADER: number;
    readonly FRAMEBUFFER: number;
    readonly FRAMEBUFFER_ATTACHMENT_OBJECT_NAME: number;
    readonly FRAMEBUFFER_ATTACHMENT_OBJECT_TYPE: number;
    readonly FRAMEBUFFER_ATTACHMENT_TEXTURE_CUBE_MAP_FACE: number;
    readonly FRAMEBUFFER_ATTACHMENT_TEXTURE_LEVEL: number;
    readonly FRAMEBUFFER_BINDING: number;
    readonly FRAMEBUFFER_COMPLETE: number;
    readonly FRAMEBUFFER_INCOMPLETE_ATTACHMENT: number;
    readonly FRAMEBUFFER_INCOMPLETE_DIMENSIONS: number;
    readonly FRAMEBUFFER_INCOMPLETE_MISSING_ATTACHMENT: number;
    readonly FRAMEBUFFER_UNSUPPORTED: number;
    readonly FRONT: number;
    readonly FRONT_AND_BACK: number;
    readonly FRONT_FACE: number;
    readonly FUNC_ADD: number;
    readonly FUNC_REVERSE_SUBTRACT: number;
    readonly FUNC_SUBTRACT: number;
    readonly GENERATE_MIPMAP_HINT: number;
    readonly GEQUAL: number;
    readonly GREATER: number;
    readonly GREEN_BITS: number;
    readonly HIGH_FLOAT: number;
    readonly HIGH_INT: number;
    readonly IMPLEMENTATION_COLOR_READ_FORMAT: number;
    readonly IMPLEMENTATION_COLOR_READ_TYPE: number;
    readonly INCR: number;
    readonly INCR_WRAP: number;
    readonly INT: number;
    readonly INT_VEC2: number;
    readonly INT_VEC3: number;
    readonly INT_VEC4: number;
    readonly INVALID_ENUM: number;
    readonly INVALID_FRAMEBUFFER_OPERATION: number;
    readonly INVALID_OPERATION: number;
    readonly INVALID_VALUE: number;
    readonly INVERT: number;
    readonly KEEP: number;
    readonly LEQUAL: number;
    readonly LESS: number;
    readonly LINEAR: number;
    readonly LINEAR_MIPMAP_LINEAR: number;
    readonly LINEAR_MIPMAP_NEAREST: number;
    readonly LINES: number;
    readonly LINE_LOOP: number;
    readonly LINE_STRIP: number;
    readonly LINE_WIDTH: number;
    readonly LINK_STATUS: number;
    readonly LOW_FLOAT: number;
    readonly LOW_INT: number;
    readonly LUMINANCE: number;
    readonly LUMINANCE_ALPHA: number;
    readonly MAX_COMBINED_TEXTURE_IMAGE_UNITS: number;
    readonly MAX_CUBE_MAP_TEXTURE_SIZE: number;
    readonly MAX_FRAGMENT_UNIFORM_VECTORS: number;
    readonly MAX_RENDERBUFFER_SIZE: number;
    readonly MAX_TEXTURE_IMAGE_UNITS: number;
    readonly MAX_TEXTURE_SIZE: number;
    readonly MAX_VARYING_VECTORS: number;
    readonly MAX_VERTEX_ATTRIBS: number;
    readonly MAX_VERTEX_TEXTURE_IMAGE_UNITS: number;
    readonly MAX_VERTEX_UNIFORM_VECTORS: number;
    readonly MAX_VIEWPORT_DIMS: number;
    readonly MEDIUM_FLOAT: number;
    readonly MEDIUM_INT: number;
    readonly MIRRORED_REPEAT: number;
    readonly NEAREST: number;
    readonly NEAREST_MIPMAP_LINEAR: number;
    readonly NEAREST_MIPMAP_NEAREST: number;
    readonly NEVER: number;
    readonly NICEST: number;
    readonly NONE: number;
    readonly NOTEQUAL: number;
    readonly NO_ERROR: number;
    readonly ONE: number;
    readonly ONE_MINUS_CONSTANT_ALPHA: number;
    readonly ONE_MINUS_CONSTANT_COLOR: number;
    readonly ONE_MINUS_DST_ALPHA: number;
    readonly ONE_MINUS_DST_COLOR: number;
    readonly ONE_MINUS_SRC_ALPHA: number;
    readonly ONE_MINUS_SRC_COLOR: number;
    readonly OUT_OF_MEMORY: number;
    readonly PACK_ALIGNMENT: number;
    readonly POINTS: number;
    readonly POLYGON_OFFSET_FACTOR: number;
    readonly POLYGON_OFFSET_FILL: number;
    readonly POLYGON_OFFSET_UNITS: number;
    readonly RED_BITS: number;
    readonly RENDERBUFFER: number;
    readonly RENDERBUFFER_ALPHA_SIZE: number;
    readonly RENDERBUFFER_BINDING: number;
    readonly RENDERBUFFER_BLUE_SIZE: number;
    readonly RENDERBUFFER_DEPTH_SIZE: number;
    readonly RENDERBUFFER_GREEN_SIZE: number;
    readonly RENDERBUFFER_HEIGHT: number;
    readonly RENDERBUFFER_INTERNAL_FORMAT: number;
    readonly RENDERBUFFER_RED_SIZE: number;
    readonly RENDERBUFFER_STENCIL_SIZE: number;
    readonly RENDERBUFFER_WIDTH: number;
    readonly RENDERER: number;
    readonly REPEAT: number;
    readonly REPLACE: number;
    readonly RGB: number;
    readonly RGB565: number;
    readonly RGB5_A1: number;
    readonly RGBA: number;
    readonly RGBA4: number;
    readonly SAMPLER_2D: number;
    readonly SAMPLER_CUBE: number;
    readonly SAMPLES: number;
    readonly SAMPLE_ALPHA_TO_COVERAGE: number;
    readonly SAMPLE_BUFFERS: number;
    readonly SAMPLE_COVERAGE: number;
    readonly SAMPLE_COVERAGE_INVERT: number;
    readonly SAMPLE_COVERAGE_VALUE: number;
    readonly SCISSOR_BOX: number;
    readonly SCISSOR_TEST: number;
    readonly SHADER_TYPE: number;
    readonly SHADING_LANGUAGE_VERSION: number;
    readonly SHORT: number;
    readonly SRC_ALPHA: number;
    readonly SRC_ALPHA_SATURATE: number;
    readonly SRC_COLOR: number;
    readonly STATIC_DRAW: number;
    readonly STENCIL_ATTACHMENT: number;
    readonly STENCIL_BACK_FAIL: number;
    readonly STENCIL_BACK_FUNC: number;
    readonly STENCIL_BACK_PASS_DEPTH_FAIL: number;
    readonly STENCIL_BACK_PASS_DEPTH_PASS: number;
    readonly STENCIL_BACK_REF: number;
    readonly STENCIL_BACK_VALUE_MASK: number;
    readonly STENCIL_BACK_WRITEMASK: number;
    readonly STENCIL_BITS: number;
    readonly STENCIL_BUFFER_BIT: number;
    readonly STENCIL_CLEAR_VALUE: number;
    readonly STENCIL_FAIL: number;
    readonly STENCIL_FUNC: number;
    readonly STENCIL_INDEX: number;
    readonly STENCIL_INDEX8: number;
    readonly STENCIL_PASS_DEPTH_FAIL: number;
    readonly STENCIL_PASS_DEPTH_PASS: number;
    readonly STENCIL_REF: number;
    readonly STENCIL_TEST: number;
    readonly STENCIL_VALUE_MASK: number;
    readonly STENCIL_WRITEMASK: number;
    readonly STREAM_DRAW: number;
    readonly SUBPIXEL_BITS: number;
    readonly TEXTURE: number;
    readonly TEXTURE0: number;
    readonly TEXTURE1: number;
    readonly TEXTURE10: number;
    readonly TEXTURE11: number;
    readonly TEXTURE12: number;
    readonly TEXTURE13: number;
    readonly TEXTURE14: number;
    readonly TEXTURE15: number;
    readonly TEXTURE16: number;
    readonly TEXTURE17: number;
    readonly TEXTURE18: number;
    readonly TEXTURE19: number;
    readonly TEXTURE2: number;
    readonly TEXTURE20: number;
    readonly TEXTURE21: number;
    readonly TEXTURE22: number;
    readonly TEXTURE23: number;
    readonly TEXTURE24: number;
    readonly TEXTURE25: number;
    readonly TEXTURE26: number;
    readonly TEXTURE27: number;
    readonly TEXTURE28: number;
    readonly TEXTURE29: number;
    readonly TEXTURE3: number;
    readonly TEXTURE30: number;
    readonly TEXTURE31: number;
    readonly TEXTURE4: number;
    readonly TEXTURE5: number;
    readonly TEXTURE6: number;
    readonly TEXTURE7: number;
    readonly TEXTURE8: number;
    readonly TEXTURE9: number;
    readonly TEXTURE_2D: number;
    readonly TEXTURE_BINDING_2D: number;
    readonly TEXTURE_BINDING_CUBE_MAP: number;
    readonly TEXTURE_CUBE_MAP: number;
    readonly TEXTURE_CUBE_MAP_NEGATIVE_X: number;
    readonly TEXTURE_CUBE_MAP_NEGATIVE_Y: number;
    readonly TEXTURE_CUBE_MAP_NEGATIVE_Z: number;
    readonly TEXTURE_CUBE_MAP_POSITIVE_X: number;
    readonly TEXTURE_CUBE_MAP_POSITIVE_Y: number;
    readonly TEXTURE_CUBE_MAP_POSITIVE_Z: number;
    readonly TEXTURE_MAG_FILTER: number;
    readonly TEXTURE_MIN_FILTER: number;
    readonly TEXTURE_WRAP_S: number;
    readonly TEXTURE_WRAP_T: number;
    readonly TRIANGLES: number;
    readonly TRIANGLE_FAN: number;
    readonly TRIANGLE_STRIP: number;
    readonly UNPACK_ALIGNMENT: number;
    readonly UNPACK_COLORSPACE_CONVERSION_WEBGL: number;
    readonly UNPACK_FLIP_Y_WEBGL: number;
    readonly UNPACK_PREMULTIPLY_ALPHA_WEBGL: number;
    readonly UNSIGNED_BYTE: number;
    readonly UNSIGNED_INT: number;
    readonly UNSIGNED_SHORT: number;
    readonly UNSIGNED_SHORT_4_4_4_4: number;
    readonly UNSIGNED_SHORT_5_5_5_1: number;
    readonly UNSIGNED_SHORT_5_6_5: number;
    readonly VALIDATE_STATUS: number;
    readonly VENDOR: number;
    readonly VERSION: number;
    readonly VERTEX_ATTRIB_ARRAY_BUFFER_BINDING: number;
    readonly VERTEX_ATTRIB_ARRAY_ENABLED: number;
    readonly VERTEX_ATTRIB_ARRAY_NORMALIZED: number;
    readonly VERTEX_ATTRIB_ARRAY_POINTER: number;
    readonly VERTEX_ATTRIB_ARRAY_SIZE: number;
    readonly VERTEX_ATTRIB_ARRAY_STRIDE: number;
    readonly VERTEX_ATTRIB_ARRAY_TYPE: number;
    readonly VERTEX_SHADER: number;
    readonly VIEWPORT: number;
    readonly ZERO: number;

    // WebGL1:
    readonly READ_BUFFER: number;
    readonly UNPACK_ROW_LENGTH: number;
    readonly UNPACK_SKIP_ROWS: number;
    readonly UNPACK_SKIP_PIXELS: number;
    readonly PACK_ROW_LENGTH: number;
    readonly PACK_SKIP_ROWS: number;
    readonly PACK_SKIP_PIXELS: number;
    readonly COLOR: number;
    readonly DEPTH: number;
    readonly STENCIL: number;
    readonly RED: number;
    readonly RGB8: number;
    readonly RGBA8: number;
    readonly RGB10_A2: number;
    readonly TEXTURE_BINDING_3D: number;
    readonly UNPACK_SKIP_IMAGES: number;
    readonly UNPACK_IMAGE_HEIGHT: number;
    readonly TEXTURE_3D: number;
    readonly TEXTURE_WRAP_R: number;
    readonly MAX_3D_TEXTURE_SIZE: number;
    readonly UNSIGNED_INT_2_10_10_10_REV: number;
    readonly MAX_ELEMENTS_VERTICES: number;
    readonly MAX_ELEMENTS_INDICES: number;
    readonly TEXTURE_MIN_LOD: number;
    readonly TEXTURE_MAX_LOD: number;
    readonly TEXTURE_BASE_LEVEL: number;
    readonly TEXTURE_MAX_LEVEL: number;
    readonly MIN: number;
    readonly MAX: number;
    readonly DEPTH_COMPONENT24: number;
    readonly MAX_TEXTURE_LOD_BIAS: number;
    readonly TEXTURE_COMPARE_MODE: number;
    readonly TEXTURE_COMPARE_FUNC: number;
    readonly CURRENT_QUERY: number;
    readonly QUERY_RESULT: number;
    readonly QUERY_RESULT_AVAILABLE: number;
    readonly STREAM_READ: number;
    readonly STREAM_COPY: number;
    readonly STATIC_READ: number;
    readonly STATIC_COPY: number;
    readonly DYNAMIC_READ: number;
    readonly DYNAMIC_COPY: number;
    readonly MAX_DRAW_BUFFERS: number;
    readonly DRAW_BUFFER0: number;
    readonly DRAW_BUFFER1: number;
    readonly DRAW_BUFFER2: number;
    readonly DRAW_BUFFER3: number;
    readonly DRAW_BUFFER4: number;
    readonly DRAW_BUFFER5: number;
    readonly DRAW_BUFFER6: number;
    readonly DRAW_BUFFER7: number;
    readonly DRAW_BUFFER8: number;
    readonly DRAW_BUFFER9: number;
    readonly DRAW_BUFFER10: number;
    readonly DRAW_BUFFER11: number;
    readonly DRAW_BUFFER12: number;
    readonly DRAW_BUFFER13: number;
    readonly DRAW_BUFFER14: number;
    readonly DRAW_BUFFER15: number;
    readonly MAX_FRAGMENT_UNIFORM_COMPONENTS: number;
    readonly MAX_VERTEX_UNIFORM_COMPONENTS: number;
    readonly SAMPLER_3D: number;
    readonly SAMPLER_2D_SHADOW: number;
    readonly FRAGMENT_SHADER_DERIVATIVE_HINT: number;
    readonly PIXEL_PACK_BUFFER: number;
    readonly PIXEL_UNPACK_BUFFER: number;
    readonly PIXEL_PACK_BUFFER_BINDING: number;
    readonly PIXEL_UNPACK_BUFFER_BINDING: number;
    readonly FLOAT_MAT2x3: number;
    readonly FLOAT_MAT2x4: number;
    readonly FLOAT_MAT3x2: number;
    readonly FLOAT_MAT3x4: number;
    readonly FLOAT_MAT4x2: number;
    readonly FLOAT_MAT4x3: number;
    readonly SRGB: number;
    readonly SRGB8: number;
    readonly SRGB8_ALPHA8: number;
    readonly COMPARE_REF_TO_TEXTURE: number;
    readonly RGBA32F: number;
    readonly RGB32F: number;
    readonly RGBA16F: number;
    readonly RGB16F: number;
    readonly VERTEX_ATTRIB_ARRAY_INTEGER: number;
    readonly MAX_ARRAY_TEXTURE_LAYERS: number;
    readonly MIN_PROGRAM_TEXEL_OFFSET: number;
    readonly MAX_PROGRAM_TEXEL_OFFSET: number;
    readonly MAX_VARYING_COMPONENTS: number;
    readonly TEXTURE_2D_ARRAY: number;
    readonly TEXTURE_BINDING_2D_ARRAY: number;
    readonly R11F_G11F_B10F: number;
    readonly UNSIGNED_INT_10F_11F_11F_REV: number;
    readonly RGB9_E5: number;
    readonly UNSIGNED_INT_5_9_9_9_REV: number;
    readonly TRANSFORM_FEEDBACK_BUFFER_MODE: number;
    readonly MAX_TRANSFORM_FEEDBACK_SEPARATE_COMPONENTS: number;
    readonly TRANSFORM_FEEDBACK_VARYINGS: number;
    readonly TRANSFORM_FEEDBACK_BUFFER_START: number;
    readonly TRANSFORM_FEEDBACK_BUFFER_SIZE: number;
    readonly TRANSFORM_FEEDBACK_PRIMITIVES_WRITTEN: number;
    readonly RASTERIZER_DISCARD: number;
    readonly MAX_TRANSFORM_FEEDBACK_INTERLEAVED_COMPONENTS: number;
    readonly MAX_TRANSFORM_FEEDBACK_SEPARATE_ATTRIBS: number;
    readonly INTERLEAVED_ATTRIBS: number;
    readonly SEPARATE_ATTRIBS: number;
    readonly TRANSFORM_FEEDBACK_BUFFER: number;
    readonly TRANSFORM_FEEDBACK_BUFFER_BINDING: number;
    readonly RGBA32UI: number;
    readonly RGB32UI: number;
    readonly RGBA16UI: number;
    readonly RGB16UI: number;
    readonly RGBA8UI: number;
    readonly RGB8UI: number;
    readonly RGBA32I: number;
    readonly RGB32I: number;
    readonly RGBA16I: number;
    readonly RGB16I: number;
    readonly RGBA8I: number;
    readonly RGB8I: number;
    readonly RED_INTEGER: number;
    readonly RGB_INTEGER: number;
    readonly RGBA_INTEGER: number;
    readonly SAMPLER_2D_ARRAY: number;
    readonly SAMPLER_2D_ARRAY_SHADOW: number;
    readonly SAMPLER_CUBE_SHADOW: number;
    readonly UNSIGNED_INT_VEC2: number;
    readonly UNSIGNED_INT_VEC3: number;
    readonly UNSIGNED_INT_VEC4: number;
    readonly INT_SAMPLER_2D: number;
    readonly INT_SAMPLER_3D: number;
    readonly INT_SAMPLER_CUBE: number;
    readonly INT_SAMPLER_2D_ARRAY: number;
    readonly UNSIGNED_INT_SAMPLER_2D: number;
    readonly UNSIGNED_INT_SAMPLER_3D: number;
    readonly UNSIGNED_INT_SAMPLER_CUBE: number;
    readonly UNSIGNED_INT_SAMPLER_2D_ARRAY: number;
    readonly DEPTH_COMPONENT32F: number;
    readonly DEPTH32F_STENCIL8: number;
    readonly FLOAT_32_UNSIGNED_INT_24_8_REV: number;
    readonly FRAMEBUFFER_ATTACHMENT_COLOR_ENCODING: number;
    readonly FRAMEBUFFER_ATTACHMENT_COMPONENT_TYPE: number;
    readonly FRAMEBUFFER_ATTACHMENT_RED_SIZE: number;
    readonly FRAMEBUFFER_ATTACHMENT_GREEN_SIZE: number;
    readonly FRAMEBUFFER_ATTACHMENT_BLUE_SIZE: number;
    readonly FRAMEBUFFER_ATTACHMENT_ALPHA_SIZE: number;
    readonly FRAMEBUFFER_ATTACHMENT_DEPTH_SIZE: number;
    readonly FRAMEBUFFER_ATTACHMENT_STENCIL_SIZE: number;
    readonly FRAMEBUFFER_DEFAULT: number;
    // readonly DEPTH_STENCIL_ATTACHMENT: number;
    // readonly DEPTH_STENCIL: number;
    readonly UNSIGNED_INT_24_8: number;
    readonly DEPTH24_STENCIL8: number;
    readonly UNSIGNED_NORMALIZED: number;
    readonly DRAW_FRAMEBUFFER_BINDING: number; /* Same as FRAMEBUFFER_BINDING */
    readonly READ_FRAMEBUFFER: number;
    readonly DRAW_FRAMEBUFFER: number;
    readonly READ_FRAMEBUFFER_BINDING: number;
    readonly RENDERBUFFER_SAMPLES: number;
    readonly FRAMEBUFFER_ATTACHMENT_TEXTURE_LAYER: number;
    readonly MAX_COLOR_ATTACHMENTS: number;
    readonly COLOR_ATTACHMENT1: number;
    readonly COLOR_ATTACHMENT2: number;
    readonly COLOR_ATTACHMENT3: number;
    readonly COLOR_ATTACHMENT4: number;
    readonly COLOR_ATTACHMENT5: number;
    readonly COLOR_ATTACHMENT6: number;
    readonly COLOR_ATTACHMENT7: number;
    readonly COLOR_ATTACHMENT8: number;
    readonly COLOR_ATTACHMENT9: number;
    readonly COLOR_ATTACHMENT10: number;
    readonly COLOR_ATTACHMENT11: number;
    readonly COLOR_ATTACHMENT12: number;
    readonly COLOR_ATTACHMENT15: number;
    readonly FRAMEBUFFER_INCOMPLETE_MULTISAMPLE: number;
    readonly MAX_SAMPLES: number;
    readonly HALF_FLOAT: number;
    readonly RG: number;
    readonly RG_INTEGER: number;
    readonly R8: number;
    readonly RG8: number;
    readonly R16F: number;
    readonly R32F: number;
    readonly RG16F: number;
    readonly RG32F: number;
    readonly R8I: number;
    readonly R8UI: number;
    readonly R16I: number;
    readonly R16UI: number;
    readonly R32I: number;
    readonly R32UI: number;
    readonly RG8I: number;
    readonly RG8UI: number;
    readonly RG16I: number;
    readonly RG16UI: number;
    readonly RG32I: number;
    readonly RG32UI: number;
    readonly VERTEX_ARRAY_BINDING: number;
    readonly R8_SNORM: number;
    readonly RG8_SNORM: number;
    readonly RGB8_SNORM: number;
    readonly RGBA8_SNORM: number;
    readonly SIGNED_NORMALIZED: number;
    readonly COPY_READ_BUFFER: number;
    readonly COPY_WRITE_BUFFER: number;
    readonly COPY_READ_BUFFER_BINDING: number; /* Same as COPY_READ_BUFFER */
    readonly COPY_WRITE_BUFFER_BINDING: number; /* Same as COPY_WRITE_BUFFER */
    readonly UNIFORM_BUFFER: number;
    readonly UNIFORM_BUFFER_BINDING: number;
    readonly UNIFORM_BUFFER_START: number;
    readonly UNIFORM_BUFFER_SIZE: number;
    readonly MAX_VERTEX_UNIFORM_BLOCKS: number;
    readonly MAX_FRAGMENT_UNIFORM_BLOCKS: number;
    readonly MAX_COMBINED_UNIFORM_BLOCKS: number;
    readonly MAX_UNIFORM_BUFFER_BINDINGS: number;
    readonly MAX_UNIFORM_BLOCK_SIZE: number;
    readonly MAX_COMBINED_VERTEX_UNIFORM_COMPONENTS: number;
    readonly MAX_COMBINED_FRAGMENT_UNIFORM_COMPONENTS: number;
    readonly UNIFORM_BUFFER_OFFSET_ALIGNMENT: number;
    readonly ACTIVE_UNIFORM_BLOCKS: number;
    readonly UNIFORM_TYPE: number;
    readonly UNIFORM_SIZE: number;
    readonly UNIFORM_BLOCK_INDEX: number;
    readonly UNIFORM_OFFSET: number;
    readonly UNIFORM_ARRAY_STRIDE: number;
    readonly UNIFORM_MATRIX_STRIDE: number;
    readonly UNIFORM_IS_ROW_MAJOR: number;
    readonly UNIFORM_BLOCK_BINDING: number;
    readonly UNIFORM_BLOCK_DATA_SIZE: number;
    readonly UNIFORM_BLOCK_ACTIVE_UNIFORMS: number;
    readonly UNIFORM_BLOCK_ACTIVE_UNIFORM_INDICES: number;
    readonly UNIFORM_BLOCK_REFERENCED_BY_VERTEX_SHADER: number;
    readonly UNIFORM_BLOCK_REFERENCED_BY_FRAGMENT_SHADER: number;
    readonly INVALID_INDEX: number;
    readonly MAX_VERTEX_OUTPUT_COMPONENTS: number;
    readonly MAX_FRAGMENT_INPUT_COMPONENTS: number;
    readonly MAX_SERVER_WAIT_TIMEOUT: number;
    readonly OBJECT_TYPE: number;
    readonly SYNC_CONDITION: number;
    readonly SYNC_STATUS: number;
    readonly SYNC_FLAGS: number;
    readonly SYNC_FENCE: number;
    readonly SYNC_GPU_COMMANDS_COMPLETE: number;
    readonly UNSIGNALED: number;
    readonly SIGNALED: number;
    readonly ALREADY_SIGNALED: number;
    readonly TIMEOUT_EXPIRED: number;
    readonly CONDITION_SATISFIED: number;
    readonly WAIT_FAILED: number;
    readonly SYNC_FLUSH_COMMANDS_BIT: number;
    readonly VERTEX_ATTRIB_ARRAY_DIVISOR: number;
    readonly ANY_SAMPLES_PASSED: number;
    readonly ANY_SAMPLES_PASSED_CONSERVATIVE: number;
    readonly SAMPLER_BINDING: number;
    readonly RGB10_A2UI: number;
    readonly INT_2_10_10_10_REV: number;
    readonly TRANSFORM_FEEDBACK: number;
    readonly TRANSFORM_FEEDBACK_PAUSED: number;
    readonly TRANSFORM_FEEDBACK_ACTIVE: number;
    readonly TRANSFORM_FEEDBACK_BINDING: number;
    readonly TEXTURE_IMMUTABLE_FORMAT: number;
    readonly MAX_ELEMENT_INDEX: number;
    readonly TEXTURE_IMMUTABLE_LEVELS: number;

    readonly TIMEOUT_IGNORED: number;

    /* WebGL-specific enums */
    readonly MAX_CLIENT_WAIT_TIMEOUT_WEBGL: number;
}