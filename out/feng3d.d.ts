declare module feng3d {
}
declare module feng3d {
    /**
     * 3D上下文
     *
     * 使用较短的Context3D代替WebGLRenderingContext或者WebGL2RenderingContext
     * @author feng 2017-01-10
     */
    type Context3D = WebGL2RenderingContext;
    var Context3D: {
        new (): WebGL2RenderingContext;
        prototype: WebGL2RenderingContext;
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
        readonly UNSIGNED_INT_24_8: number;
        readonly DEPTH24_STENCIL8: number;
        readonly UNSIGNED_NORMALIZED: number;
        readonly DRAW_FRAMEBUFFER_BINDING: number;
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
        readonly COPY_READ_BUFFER_BINDING: number;
        readonly COPY_WRITE_BUFFER_BINDING: number;
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
        readonly MAX_CLIENT_WAIT_TIMEOUT_WEBGL: number;
    };
    var contextId: string;
}
declare module feng3d {
    /**
     * 事件
     * @author feng 2014-5-7
     */
    class Event {
        /**
         * [广播事件] 进入新的一帧,监听此事件将会在下一帧开始时触发一次回调。这是一个广播事件，可以在任何一个显示对象上监听，无论它是否在显示列表中。
         */
        static ENTER_FRAME: string;
        private _type;
        private _bubbles;
        private _target;
        private _currentTarget;
        private _isStopBubbles;
        private _isStop;
        /**
         * 事件携带的自定义数据
         */
        data: any;
        /**
         * 创建一个作为参数传递给事件侦听器的 Event 对象。
         * @param type 事件的类型，可以作为 Event.type 访问。
         * @param data 携带数据
         * @param bubbles 确定 Event 对象是否参与事件流的冒泡阶段。默认值为 false。
         */
        constructor(type: string, data?: any, bubbles?: boolean);
        /**
         * 是否停止处理事件监听器
         */
        isStop: boolean;
        /**
         * 是否停止冒泡
         */
        isStopBubbles: boolean;
        tostring(): string;
        /**
         * 表示事件是否为冒泡事件。如果事件可以冒泡，则此值为 true；否则为 false。
         */
        readonly bubbles: boolean;
        /**
         * 事件的类型。类型区分大小写。
         */
        readonly type: string;
        /**
         * 事件目标。
         */
        target: IEventDispatcher;
        /**
         * 当前正在使用某个事件侦听器处理 Event 对象的对象。
         */
        readonly currentTarget: IEventDispatcher;
    }
}
declare module feng3d {
    /**
     * IEventDispatcher 接口定义用于添加或删除事件侦听器的方法，检查是否已注册特定类型的事件侦听器，并调度事件。
     * @author feng 2016-3-22
     */
    interface IEventDispatcher {
        /**
         * 名称
         */
        name: string;
        /**
         * 使用 EventDispatcher 对象注册事件侦听器对象，以使侦听器能够接收事件通知。
         * @param type						事件的类型。
         * @param listener					处理事件的侦听器函数。
         * @param thisObject                listener函数作用域
         * @param priority					事件侦听器的优先级。数字越大，优先级越高。默认优先级为 0。
         */
        addEventListener(type: string, listener: (event: Event) => void, thisObject: any, priority?: number): void;
        /**
         * 从 EventDispatcher 对象中删除侦听器. 如果没有向 IEventDispatcher 对象注册任何匹配的侦听器，则对此方法的调用没有任何效果。
         *
         * @param type						事件的类型。
         * @param listener					要删除的侦听器对象。
         * @param thisObject                listener函数作用域
         */
        removeEventListener(type: string, listener: (event: Event) => void, thisObject: any): void;
        /**
         * 将事件调度到事件流中. 事件目标是对其调用 dispatchEvent() 方法的 IEventDispatcher 对象。
         * @param event						调度到事件流中的 Event 对象。
         */
        dispatchEvent(event: Event): void;
        /**
         * 检查 EventDispatcher 对象是否为特定事件类型注册了任何侦听器.
         *
         * @param type		事件的类型。
         * @return 			如果指定类型的侦听器已注册，则值为 true；否则，值为 false。
         */
        hasEventListener(type: string): boolean;
    }
}
declare module feng3d {
    /**
     * 为了实现非flash原生显示列表的冒泡事件，自定义事件适配器
     * @author feng 2016-3-22
     */
    class EventDispatcher implements IEventDispatcher {
        /**
         * 名称
         */
        name: string;
        /**
         * 冒泡属性名称为“parent”
         */
        bubbleAttribute: string;
        /**
         * 事件适配主体
         */
        private target;
        /**
         * 构建事件适配器
         * @param target		事件适配主体
         */
        constructor(target?: IEventDispatcher);
        /**
         * 使用 EventDispatcher 对象注册事件侦听器对象，以使侦听器能够接收事件通知。
         * @param type						事件的类型。
         * @param listener					处理事件的侦听器函数。
         * @param thisObject                listener函数作用域
         * @param priority					事件侦听器的优先级。数字越大，优先级越高。默认优先级为 0。
         */
        addEventListener(type: string, listener: (event: Event) => void, thisObject: any, priority?: number): void;
        /**
         * 从 EventDispatcher 对象中删除侦听器. 如果没有向 IEventDispatcher 对象注册任何匹配的侦听器，则对此方法的调用没有任何效果。
         *
         * @param type						事件的类型。
         * @param listener					要删除的侦听器对象。
         * @param thisObject                listener函数作用域
         */
        removeEventListener(type: string, listener: (event: Event) => void, thisObject: any): void;
        /**
         * 将事件调度到事件流中. 事件目标是对其调用 dispatchEvent() 方法的 IEventDispatcher 对象。
         * @param event						调度到事件流中的 Event 对象。
         */
        dispatchEvent(event: Event): void;
        /**
         * 检查 EventDispatcher 对象是否为特定事件类型注册了任何侦听器.
         *
         * @param type		事件的类型。
         * @return 			如果指定类型的侦听器已注册，则值为 true；否则，值为 false。
         */
        hasEventListener(type: string): boolean;
        /**
         * 销毁
         */
        destroy(): void;
        /**
         * 派发冒泡事件
         * @param event						调度到事件流中的 Event 对象。
         */
        private dispatchBubbleEvent(event);
        /**
         * 获取冒泡对象
         * @param event						调度到事件流中的 Event 对象。
         */
        protected getBubbleTargets(event: Event): IEventDispatcher[];
    }
}
declare module feng3d {
    /**
     * 心跳计时器
     */
    class SystemTicker extends EventDispatcher {
        /**
         * @private
         */
        constructor();
        private init();
        /**
         * @private
         * 执行一次刷新
         */
        update(): void;
    }
    /**
     * 心跳计时器单例
     */
    var $ticker: SystemTicker;
    var $feng3dStartTime: number;
}
declare module feng3d {
    /**
     * 鼠标键盘输入，处理js事件中this关键字问题
     * @author feng 2016-12-19
     */
    class MouseKeyInput extends EventDispatcher {
        /**
         * 构建
         */
        constructor();
        /**
         * 初始化
         */
        private init();
        /**
         * 键盘按下事件
         */
        private onMouseKey(event);
    }
    /**
     * 鼠标事件类型
     */
    var $mouseKeyType: {
        "click": string;
        "dblclick": string;
        "mousedown": string;
        "mousemove": string;
        "mouseout": string;
        "mouseover": string;
        "mouseup": string;
        "keydown": string;
        "keypress": string;
        "keyup": string;
    };
    /**
     * 鼠标键盘输入
     */
    var $mouseKeyInput: MouseKeyInput;
}
declare module feng3d.shortcut {
    /**
     * 按键捕获
     * @author feng 2016-4-26
     */
    class KeyCapture {
        /**
         * 键盘按键字典 （补充常量，a-z以及鼠标按键不必再次列出）
         * 例如 boardKeyDic[17] = "ctrl";
         */
        private boardKeyDic;
        /**
         * 捕获的按键字典
         */
        private mouseKeyDic;
        /**
         * 快捷键环境
         */
        private shortCutContext;
        /**
         * 按键状态
         */
        private keyState;
        /**
         * 构建
         * @param stage		舞台
         */
        constructor(shortCutContext: ShortCutContext);
        /**
         * 默认支持按键
         */
        private defaultSupportKeys();
        /**
         * 鼠标事件
         */
        private onMouseOnce(event);
        /**
         * 鼠标事件
         */
        private onMousewheel(event);
        /**
         * 键盘按下事件
         */
        private onKeydown(event);
        /**
         * 键盘弹起事件
         */
        private onKeyup(event);
        /**
         * 获取键盘按键名称
         */
        private getBoardKey(keyCode);
    }
}
declare module feng3d.shortcut {
    /**
     * 按键状态
     * @author feng 2016-4-26
     */
    class KeyState extends EventDispatcher {
        /**
         * 按键状态{key:键名称,value:是否按下}
         */
        private keyStateDic;
        /**
         * 构建
         */
        constructor();
        /**
         * 按下键
         * @param key 	键名称
         * @param data	携带数据
         */
        pressKey(key: string, data?: Object): void;
        /**
         * 释放键
         * @param key	键名称
         * @param data	携带数据
         */
        releaseKey(key: string, data?: Object): void;
        /**
         * 获取按键状态
         * @param key 按键名称
         */
        getKeyState(key: string): Boolean;
    }
}
declare module feng3d.shortcut {
    /**
     * 快捷键捕获
     * @author feng 2016-4-26
     */
    class ShortCutCapture {
        /**
         * 快捷键环境
         */
        private shortCutContext;
        /**
         * 快捷键
         */
        private key;
        /**
         * 要执行的命令名称
         */
        private command;
        /**
         * 可执行的状态命令
         */
        private stateCommand;
        /**
         * 快捷键处于活动状态的条件
         */
        private when;
        /**
         * 按键状态
         */
        private keyState;
        /**
         * 按键列表
         */
        private keys;
        /**
         * 状态列表
         */
        private states;
        /**
         * 命令列表
         */
        private commands;
        /**
         * 命令列表
         */
        private stateCommands;
        /**
         * 构建快捷键捕获
         * @param shortCutContext		快捷键环境
         * @param key					快捷键
         * @param command				要执行的命令名称
         * @param stateCommand			可执行的状态命令
         * @param when					快捷键处于活动状态的条件
         */
        constructor(shortCutContext: ShortCutContext, key: string, command?: string, stateCommand?: string, when?: string);
        /**
         * 初始化
         */
        private init();
        /**
         * 处理捕获事件
         */
        private onCapture(event);
        /**
         * 派发命令
         */
        private dispatchCommands(commands, data);
        /**
         * 执行状态命令
         */
        private executeStateCommands(stateCommands);
        /**
         * 检测快捷键是否处于活跃状态
         */
        private checkActivityStates(states);
        /**
         * 获取是否处于指定状态中（支持一个！取反）
         * @param state 状态名称
         */
        private getState(state);
        /**
         * 检测是否按下给出的键
         * @param keys 按键数组
         */
        private checkActivityKeys(keys);
        /**
         * 获取按键状态（true：按下状态，false：弹起状态）
         */
        private getKeyValue(key);
        /**
         * 获取状态列表
         * @param when		状态字符串
         */
        private getStates(when);
        /**
         * 获取键列表
         * @param key		快捷键
         */
        private getKeys(key);
        /**
         * 获取命令列表
         * @param command	命令
         */
        private getCommands(command);
        /**
         * 获取状态命令列表
         * @param stateCommand	状态命令
         */
        private getStateCommand(stateCommand);
        /**
         * 销毁
         */
        destroy(): void;
    }
}
/**
 * 按键
 * @author feng 2016-6-6
 */
declare class Key {
    /**
     * 是否取反
     */
    not: Boolean;
    /**
     * 状态名称
     */
    key: string;
    constructor(key: string);
}
/**
 * 状态
 * @author feng 2016-6-6
 */
declare class State {
    /**
     * 是否取反
     */
    not: Boolean;
    /**
     * 状态名称
     */
    state: string;
    constructor(state: string);
}
/**
 * 状态命令
 * @author feng 2016-6-6
 */
declare class StateCommand {
    /**
     * 是否取反
     */
    not: Boolean;
    /**
     * 状态名称
     */
    state: string;
    constructor(state: string);
}
declare module feng3d.shortcut {
    /**
     * 快捷键环境
     * @author feng 2016-6-6
     */
    class ShortCutContext {
        /**
         * 命令派发器
         */
        commandDispatcher: IEventDispatcher;
        /**
         * 按键状态
         */
        keyState: KeyState;
        /**
         * 状态字典
         */
        stateDic: {};
        /**
         * 按键捕获
         */
        keyCapture: KeyCapture;
        /**
         * 捕获字典
         */
        captureDic: {};
        /**
         * 构建快捷键环境
         * @param stage 舞台
         */
        constructor();
        /**
         * 初始化快捷键模块
         */
        init(): void;
        /**
         * 添加快捷键
         * @param shortcuts		快捷键列表
         */
        addShortCuts(shortcuts: any[]): void;
        /**
         * 删除快捷键
         * @param shortcuts		快捷键列表
         */
        removeShortCuts(shortcuts: any[]): void;
        /**
         * 移除所有快捷键
         */
        removeAllShortCuts(): void;
        /**
         * 激活状态
         * @param state 状态名称
         */
        activityState(state: string): void;
        /**
         * 取消激活状态
         * @param state 状态名称
         */
        deactivityState(state: string): void;
        /**
         * 获取状态
         * @param state 状态名称
         */
        getState(state: string): Boolean;
        /**
         * 获取快捷键唯一字符串
         */
        private getShortcutUniqueKey(shortcut);
    }
}
declare module feng3d.shortcut {
    /**
     * 快捷键命令事件
     * @author feng 2016-4-27
     */
    class ShortCutEvent extends Event {
        /**
         * 携带数据
         */
        data: Object;
        /**
         * 构建
         * @param command		命令名称
         */
        constructor(command: string, data?: Object);
    }
}
declare module feng3d.shortcut {
    /**
     * 初始化快捷键模块
     * @author feng 2016-4-26
     *
     * <pre>
var shortcuts:Array = [ //
//在按下key1时触发命令command1
    {key: "key1", command: "command1", when: ""}, //
     //在按下key1时触发状态命令改变stateCommand1为激活状态
    {key: "key1", stateCommand: "stateCommand1", when: "state1"}, //
     //处于state1状态时按下key1触发命令command1
    {key: "key1", command: "command1", when: "state1"}, //
    //处于state1状态不处于state2时按下key1与没按下key2触发command1与command2，改变stateCommand1为激活状态，stateCommand2为非激活状态
    {key: "key1+ ! key2", command: "command1,command2", stateCommand: "stateCommand1,!stateCommand2", when: "state1+!state2"}, //
    ];
//添加快捷键
ShortCut.addShortCuts(shortcuts);
//监听命令
ShortCut.commandDispatcher.addEventListener("run", function(e:Event):void
{
    trace("接受到命令：" + e.type);
});
     * </pre>
     */
    class ShortCut {
        /**
         * 命令派发器
         */
        static commandDispatcher: IEventDispatcher;
        /**
         * 快捷键环境
         */
        private static shortcutContext;
        /**
         * 初始化快捷键模块
         */
        static init(): void;
        /**
         * 添加快捷键
         * @param shortcuts		快捷键列表
         */
        static addShortCuts(shortcuts: any[]): void;
        /**
         * 删除快捷键
         * @param shortcuts		快捷键列表
         */
        static removeShortCuts(shortcuts: any[]): void;
        /**
         * 移除所有快捷键
         */
        static removeAllShortCuts(): void;
        /**
         * 激活状态
         * @param state 状态名称
         */
        static activityState(state: string): void;
        /**
         * 取消激活状态
         * @param state 状态名称
         */
        static deactivityState(state: string): void;
        /**
         * 获取状态
         * @param state 状态名称
         */
        static getState(state: string): Boolean;
    }
}
declare module feng3d {
    /**
     * 组件事件
     * @author feng 2015-12-2
     */
    class ComponentEvent extends Event {
        /**
         * 添加子组件事件
         * data = { container: IComponent, child: IComponent }
         */
        static ADDED_COMPONENT: string;
        /**
         * 移除子组件事件
         * data = { container: IComponent, child: IComponent }
         */
        static REMOVED_COMPONENT: string;
        /**
         * 事件目标。
         */
        target: IComponent;
    }
}
declare module feng3d {
    /**
     * 组件接口
     * @author feng 2016-4-24
     */
    interface IComponent extends IEventDispatcher {
        /**
         * 组件数量
         */
        numComponents: number;
        /**
         * 父组件
         */
        parentComponent: IComponent;
        /**
         * 添加组件
         * @param component 被添加组件
         */
        addComponent(component: IComponent): void;
        /**
         * 添加组件到指定位置
         * @param component		被添加的组件
         * @param index			插入的位置
         */
        addComponentAt(component: IComponent, index: number): void;
        /**
         * 移除组件
         * @param component 被移除组件
         */
        removeComponent(component: IComponent): void;
        /**
         * 移除组件
         * @param index		要删除的 Component 的子索引。
         */
        removeComponentAt(index: number): IComponent;
        /**
         * 获取组件在容器的索引位置
         * @param component			查询的组件
         * @return				    组件在容器的索引位置
         */
        getComponentIndex(com: IComponent): number;
        /**
        * 设置子组件的位置
        * @param component				子组件
        * @param index				    位置索引
        */
        setComponentIndex(component: IComponent, index: number): void;
        /**
         * 获取指定位置索引的子组件
         * @param index			位置索引
         * @return				子组件
         */
        getComponentAt(index: number): IComponent;
        /**
         * 根据组件名称获取组件
         * <p>注意：此处比较的是componentName而非name</p>
         * @param componentName		组件名称
         * @return 					获取到的组件
         */
        getComponentByName(componentName: String): IComponent;
        /**
        * 获取与给出组件名称相同的所有组件
        * <p>注意：此处比较的是componentName而非name</p>
        * @param componentName		组件名称
        * @return 					获取到的组件
        */
        getComponentsByName(componentName: String): IComponent[];
        /**
         * 根据类定义获取组件
         * <p>如果存在多个则返回第一个</p>
         * @param cls				类定义
         * @return
         */
        getComponentByClass<T extends IComponent>(cls: new () => T): T;
        /**
         * 根据类定义查找组件
         * @param cls		类定义
         * @return			返回与给出类定义一致的组件
         */
        getComponentsByClass<T extends IComponent>(cls: new () => T): T[];
        /**
         * 根据类定义获取或创建组件
         * <p>当不存在该类型对象时创建一个该组件并且添加到容器中</p>
         * @param cls
         * @return
         */
        getOrCreateComponentByClass<T extends IComponent>(cls: new () => T): T;
        /**
        * 判断是否拥有组件
        * @param com	被检测的组件
        * @return		true：拥有该组件；false：不拥有该组件。
        */
        hasComponent(com: IComponent): boolean;
        /**
         * 交换子组件位置
         * @param index1		第一个子组件的索引位置
         * @param index2		第二个子组件的索引位置
         */
        swapComponentsAt(index1: number, index2: number): void;
        /**
         * 交换子组件位置
         * @param a		第一个子组件
         * @param b		第二个子组件
         */
        swapComponents(a: IComponent, b: IComponent): void;
        /**
         * 派发子组件事件
         * <p>事件广播给子组件</p>
         * @param event     事件
         * @param depth     广播深度
         */
        dispatchChildrenEvent(event: Event, depth: number): void;
    }
}
declare module feng3d {
    /**
     * 组件容器（集合）
     * @author feng 2015-5-6
     */
    class Component extends EventDispatcher implements IComponent {
        /**
         * 父组件
         */
        protected _parentComponent: IComponent;
        /**
         * 组件列表
         */
        protected components: IComponent[];
        /**
         * 创建一个组件容器
         */
        constructor();
        /**
         * 初始化组件
         */
        protected initComponent(): void;
        /**
         * 父组件
         */
        readonly parentComponent: IComponent;
        /**
         * 子组件个数
         */
        readonly numComponents: number;
        /**
         * 添加组件
         * @param component 被添加组件
         */
        addComponent(component: IComponent): void;
        /**
         * 添加组件到指定位置
         * @param component		被添加的组件
         * @param index			插入的位置
         */
        addComponentAt(component: IComponent, index: number): void;
        /**
         * 移除组件
         * @param component 被移除组件
         */
        removeComponent(component: IComponent): void;
        /**
         * 移除组件
         * @param index		要删除的 Component 的子索引。
         */
        removeComponentAt(index: number): IComponent;
        /**
         * 获取组件在容器的索引位置
         * @param component			查询的组件
         * @return				    组件在容器的索引位置
         */
        getComponentIndex(component: IComponent): number;
        /**
         * 设置子组件的位置
         * @param component				子组件
         * @param index				位置索引
         */
        setComponentIndex(component: IComponent, index: number): void;
        /**
         * 获取指定位置索引的子组件
         * @param index			位置索引
         * @return				子组件
         */
        getComponentAt(index: number): IComponent;
        /**
         * 根据组件名称获取组件
         * <p>注意：此处比较的是componentName而非name</p>
         * @param componentName		组件名称
         * @return 					获取到的组件
         */
        getComponentByName(name: String): IComponent;
        /**
         * 获取与给出组件名称相同的所有组件
         * <p>注意：此处比较的是componentName而非name</p>
         * @param name		        组件名称
         * @return 					获取到的组件
         */
        getComponentsByName(name: String): IComponent[];
        /**
         * 根据类定义获取组件
         * <p>如果存在多个则返回第一个</p>
         * @param cls				类定义
         * @return                  返回指定类型组件
         */
        getComponentByClass<T extends IComponent>(cls: new () => T): T;
        /**
         * 根据类定义查找组件
         * @param cls		类定义
         * @return			返回与给出类定义一致的组件
         */
        getComponentsByClass<T extends IComponent>(cls: new () => T): T[];
        /**
         * 根据类定义获取或创建组件
         * <p>当不存在该类型对象时创建一个该组件并且添加到容器中</p>
         * @param cls       类定义
         * @return          返回与给出类定义一致的组件
         */
        getOrCreateComponentByClass<T extends IComponent>(cls: new () => T): T;
        /**
         * 判断是否拥有组件
         * @param com	被检测的组件
         * @return		true：拥有该组件；false：不拥有该组件。
         */
        hasComponent(com: IComponent): boolean;
        /**
         * 交换子组件位置
         * @param index1		第一个子组件的索引位置
         * @param index2		第二个子组件的索引位置
         */
        swapComponentsAt(index1: number, index2: number): void;
        /**
         * 交换子组件位置
         * @param a		第一个子组件
         * @param b		第二个子组件
         */
        swapComponents(a: IComponent, b: IComponent): void;
        /**
         * 派发子组件事件
         * <p>事件广播给子组件</p>
         * @param event     事件
         * @param depth     广播深度
         */
        dispatchChildrenEvent(event: Event, depth?: number): void;
        /**
         * 处理被添加组件事件
         */
        protected onBeAddedComponent(event: ComponentEvent): void;
        /**
         * 处理被移除组件事件
         */
        protected onBeRemovedComponent(event: ComponentEvent): void;
        /**
         * 获取冒泡对象
         */
        protected getBubbleTargets(event?: Event): IEventDispatcher[];
        /**
         * 处理添加组件事件，此处为被添加，设置父组件
         */
        private _onAddedComponent(event);
        /**
         * 处理移除组件事件，此处为被移除，清空父组件
         */
        private _onRemovedComponent(event);
    }
}
declare module feng3d {
    /**
     * 加载类
     * @author feng 2016-12-14
     */
    class Loader extends EventDispatcher {
        private request;
        private image;
        /**
         * 数据类型
         */
        dataFormat: string;
        protected url: string;
        /**
         * 已加载的字节数
         */
        bytesLoaded: number;
        /**
         * 文件中压缩的字节数
         */
        bytesTotal: number;
        /**
         * 加载内容
         */
        content: any;
        /**
         * 加载资源
         * @param url   路径
         */
        load(url: string): void;
        /**
         * 加载文本
         * @param url   路径
         */
        loadText(url: string): void;
        /**
         * 加载二进制
         * @param url   路径
         */
        loadBinary(url: string): void;
        /**
         * 加载图片
         * @param url   路径
         */
        loadImage(url: string): void;
        /**
         * 使用XMLHttpRequest加载
         */
        private xmlHttpRequestLoad();
        /**
         * 请求进度回调
         */
        private onRequestProgress(event);
        /**
         * 请求状态变化回调
         */
        private onRequestReadystatechange(ev);
        /**
         * 加载图片完成回调
         */
        private onImageLoad(event);
        /**
         * 加载图片出错回调
         */
        private onImageError(event);
    }
}
declare module feng3d {
    /**
     * 加载事件
     * @author feng 2016-12-14
     */
    class LoaderEvent extends Event {
        /**
         * 加载进度发生改变时调度。
         */
        static PROGRESS: string;
        /**
         * 加载完成后调度。
         */
        static COMPLETE: string;
        /**
         * 加载出错时调度。
         */
        static ERROR: string;
    }
}
declare module feng3d {
    /**
     * 加载数据类型
     * @author feng 2016-12-14
     */
    class LoaderDataFormat {
        /**
         * 以原始二进制数据形式接收下载的数据。
         */
        static BINARY: string;
        /**
         * 以文本形式接收已下载的数据。
         */
        static TEXT: string;
        /**
         * 图片数据
         */
        static IMAGE: string;
    }
}
declare module feng3d {
    /**
     * 断言
     * @b			判定为真的表达式
     * @msg			在表达式为假时将输出的错误信息
     * @author feng 2014-10-29
     */
    function assert(b: boolean, msg?: string): void;
}
declare module feng3d {
    /**
     * 获取feng3d运行时间，毫秒为单位
     */
    function getTimer(): number;
}
declare module feng3d {
    class StringUtils {
        /**
         * 获取字符串
         * @param obj 转换为字符串的对象
         * @param showLen       显示长度
         * @param fill          长度不够是填充的字符串
         * @param tail          true（默认）:在尾部添加；false：在首部添加
         */
        static getString(obj: any, showLen?: number, fill?: string, tail?: boolean): string;
    }
}
declare module feng3d {
    /**
     * 数组工具
     * @author feng 2017-01-03
     */
    class ArrayUtils {
        /**
         * 删除数据元素
         * @param source    数组源数据
         * @param item      被删除数据
         * @param all       是否删除所有相同数据
         */
        static removeItem<T>(source: T[], item: T, all?: boolean): {
            deleteIndexs: number[];
            length: number;
        };
    }
}
declare module feng3d {
    /**
     * 构建Map类代替Dictionary
     * @author feng 2017-01-03
     */
    class Map<K, V> {
        private keyMap;
        private valueMap;
        /**
         * 删除
         */
        delete(k: K): void;
        /**
         * 添加映射
         */
        push(k: K, v: V): void;
        /**
         * 通过key获取value
         */
        get(k: K): V;
        /**
         * 获取键列表
         */
        getKeys(): K[];
        /**
         * 清理字典
         */
        clear(): void;
    }
}
declare module feng3d {
    class Version {
        /**
         * 获取对象版本
         * @param object 对象
         */
        getVersion(object: Object): number;
        /**
         * 升级对象版本（版本号+1）
         * @param object 对象
         */
        upgradeVersion(object: Object): void;
        /**
         * 设置版本号
         * @param object 对象
         * @param version 版本号
         */
        setVersion(object: Object, version: number): void;
        /**
         * 判断两个对象的版本号是否相等
         */
        equal(a: Object, b: Object): boolean;
        /**
         * 断言object为对象类型
         */
        private assertObject(object);
    }
    /**
     * 对象版本
     */
    var version: Version;
}
declare module feng3d {
    /**
     * 判断a对象是否为b类型
     */
    function is(a: any, b: Function): boolean;
    /**
     * 如果a为b类型则返回，否则返回null
     */
    function as(a: any, b: Function): any;
    /**
     * 获取对象UID
     * @author feng 2016-05-08
     */
    function getUID(object: {
        __uid__?: string;
    }): any;
    /**
     * uid细节
     */
    var $uidDetails: {
        [uid: string]: {
            className: string;
            id: number;
            time: number;
        };
    };
    /**
     * 获取对象的类名
     * @author feng 2016-4-24
     */
    function getClassName(value: any): string;
    /**
     * 是否为基础类型
     * @param object    对象
     */
    function isBaseType(object: any): boolean;
    /**
     * 深克隆
     * @param source        源数据
     * @returns             克隆数据
     */
    function deepClone<T>(source: T): T;
    /**
     * （浅）克隆
     * @param source        源数据
     * @returns             克隆数据
     */
    function clone<T>(source: T): T;
    /**
     * （浅）拷贝数据
     */
    function copy(target: Object, source: Object): void;
    /**
     * 深拷贝数据
     */
    function deepCopy(target: Object, source: Object): void;
    /**
     * 合并数据
     * @param source        源数据
     * @param mergeData     合并数据
     * @param createNew     是否合并为新对象，默认为false
     * @returns             如果createNew为true时返回新对象，否则返回源数据
     */
    function merge<T>(source: T, mergeData: Object, createNew?: boolean): T;
    /**
     * 观察对象
     * @param object        被观察的对象
     * @param onChanged     属性值变化回调函数
     */
    function watchObject(object: any, onChanged?: (object: any, attribute: string, oldValue: any, newValue: any) => void): void;
    /**
     * 观察对象中属性
     * @param object        被观察的对象
     * @param attribute     被观察的属性
     * @param onChanged     属性值变化回调函数
     */
    function watch(object: any, attribute: string, onChanged?: (object: any, attribute: string, oldValue: any, newValue: any) => void): void;
    /**
     * 取消观察对象
     * @param object        被观察的对象
     */
    function unwatchObject(object: any): void;
    /**
     * 取消观察对象中属性
     * @param object        被观察的对象
     * @param attribute     被观察的属性
     */
    function unwatch(object: any, attribute: string): void;
}
declare module feng3d {
    /**
     * 渲染代码库
     * @author feng 2016-12-16
     */
    class ShaderLib {
        /**
         * 获取shaderCode
         */
        static getShaderCode(shaderName: string): string;
        /**
         * 获取ShaderMacro代码
         */
        static getMacroCode(macro: ShaderMacro): string;
    }
}
declare module feng3d {
    /**
     * 颜色
     * @author feng 2016-09-24
     */
    class Color {
        /**
         * 红[0,1]
         */
        r: number;
        /**
         * 绿[0,1]
         */
        g: number;
        /**
         * 蓝[0,1]
         */
        b: number;
        /**
         * 透明度[0,1]
         */
        a: number;
        /**
         * 构建颜色
         * @param r     红[0,1]
         * @param g     绿[0,1]
         * @param b     蓝[0,1]
         * @param a     透明度[0,1]
         */
        constructor(r?: number, g?: number, b?: number, a?: number);
        /**
         * 从RGBA整型初始化颜色
         * @param r     红[0,255]
         * @param g     绿[0,255]
         * @param b     蓝[0,255]
         * @param a     透明度[0,255]
         */
        fromInts(r: number, g: number, b: number, a: number): void;
        fromUnit(color: number, hasAlpha?: boolean): void;
        /**
         * 转换为数组
         */
        asArray(): number[];
        /**
         * 输出到数组
         * @param array     数组
         * @param index     存储在数组中的位置
         */
        toArray(array: number[], index?: number): Color;
        /**
         * 输出为向量
         */
        toVector3D(): Vector3D;
        /**
         * 输出16进制字符串
         */
        toHexString(): string;
        /**
         * 混合颜色
         * @param color 混入的颜色
         * @param rate  混入比例
         */
        mix(color: Color, rate?: number): this;
        /**
         * 输出字符串
         */
        toString(): string;
        /**
         * [0,15]数值转为16进制字符串
         * param i  [0,15]数值
         */
        static ToHex(i: number): string;
    }
}
declare module feng3d {
    /**
     * 数学常量类
     */
    class MathConsts {
        /**
         * 弧度转角度因子
         */
        static RADIANS_TO_DEGREES: number;
        /**
         * 角度转弧度因子
         */
        static DEGREES_TO_RADIANS: number;
    }
}
declare module feng3d {
    /**
     * Point 对象表示二维坐标系统中的某个位置，其中 x 表示水平轴，y 表示垂直轴。
     */
    class Point {
        /**
         * 创建一个 egret.Point 对象.若不传入任何参数，将会创建一个位于（0，0）位置的点。
         * @param x 该对象的x属性值，默认为0
         * @param y 该对象的y属性值，默认为0
         */
        constructor(x?: number, y?: number);
        /**
         * 该点的水平坐标。
         * @default 0
         */
        x: number;
        /**
         * 该点的垂直坐标。
         * @default 0
         */
        y: number;
        /**
         * 从 (0,0) 到此点的线段长度。
         */
        readonly length: number;
        /**
         * 将 Point 的成员设置为指定值
         * @param x 该对象的x属性值
         * @param y 该对象的y属性值
         */
        setTo(x: number, y: number): Point;
        /**
         * 克隆点对象
         */
        clone(): Point;
        /**
         * 确定两个点是否相同。如果两个点具有相同的 x 和 y 值，则它们是相同的点。
         * @param toCompare 要比较的点。
         * @returns 如果该对象与此 Point 对象相同，则为 true 值，如果不相同，则为 false。
         */
        equals(toCompare: Point): boolean;
        /**
         * 返回 pt1 和 pt2 之间的距离。
         * @param p1 第一个点
         * @param p2 第二个点
         * @returns 第一个点和第二个点之间的距离。
         */
        static distance(p1: Point, p2: Point): number;
        /**
         * 将源 Point 对象中的所有点数据复制到调用方 Point 对象中。
         * @param sourcePoint 要从中复制数据的 Point 对象。
         */
        copyFrom(sourcePoint: Point): void;
        /**
         * 将另一个点的坐标添加到此点的坐标以创建一个新点。
         * @param v 要添加的点。
         * @returns 新点。
         */
        add(v: Point): Point;
        /**
         * 确定两个指定点之间的点。
         * 参数 f 确定新的内插点相对于参数 pt1 和 pt2 指定的两个端点所处的位置。参数 f 的值越接近 1.0，则内插点就越接近第一个点（参数 pt1）。参数 f 的值越接近 0，则内插点就越接近第二个点（参数 pt2）。
         * @param pt1 第一个点。
         * @param pt2 第二个点。
         * @param f 两个点之间的内插级别。表示新点将位于 pt1 和 pt2 连成的直线上的什么位置。如果 f=1，则返回 pt1；如果 f=0，则返回 pt2。
         * @returns 新的内插点。
         */
        static interpolate(pt1: Point, pt2: Point, f: number): Point;
        /**
         * 将 (0,0) 和当前点之间的线段缩放为设定的长度。
         * @param thickness 缩放值。例如，如果当前点为 (0,5) 并且您将它规范化为 1，则返回的点位于 (0,1) 处。
         */
        normalize(thickness: number): void;
        /**
         * 按指定量偏移 Point 对象。dx 的值将添加到 x 的原始值中以创建新的 x 值。dy 的值将添加到 y 的原始值中以创建新的 y 值。
         * @param dx 水平坐标 x 的偏移量。
         * @param dy 水平坐标 y 的偏移量。
         */
        offset(dx: number, dy: number): void;
        /**
         * 将一对极坐标转换为笛卡尔点坐标。
         * @param len 极坐标对的长度。
         * @param angle 极坐标对的角度（以弧度表示）。
         */
        static polar(len: number, angle: number): Point;
        /**
         * 从此点的坐标中减去另一个点的坐标以创建一个新点。
         * @param v 要减去的点。
         * @returns 新点。
         */
        subtract(v: Point): Point;
        /**
         * 返回包含 x 和 y 坐标的值的字符串。该字符串的格式为 "(x=x, y=y)"，因此为点 23,17 调用 toString() 方法将返回 "(x=23, y=17)"。
         * @returns 坐标的字符串表示形式。
         */
        toString(): string;
    }
}
declare module feng3d {
    /**
     * 矩形
     *
     * Rectangle 对象是按其位置（由它左上角的点 (x, y) 确定）以及宽度和高度定义的区域。<br/>
     * Rectangle 类的 x、y、width 和 height 属性相互独立；更改一个属性的值不会影响其他属性。
     * 但是，right 和 bottom 属性与这四个属性是整体相关的。例如，如果更改 right 属性的值，则 width
     * 属性的值将发生变化；如果更改 bottom 属性，则 height 属性的值将发生变化。
     * @author feng 2016-04-27
     */
    class Rectangle {
        /**
         * 创建一个新 Rectangle 对象，其左上角由 x 和 y 参数指定，并具有指定的 width 和 height 参数。
         * @param x 矩形左上角的 x 坐标。
         * @param y 矩形左上角的 y 坐标。
         * @param width 矩形的宽度（以像素为单位）。
         * @param height 矩形的高度（以像素为单位）。
         */
        constructor(x?: number, y?: number, width?: number, height?: number);
        /**
         * 矩形左上角的 x 坐标。
         * @default 0
         */
        x: number;
        /**
         * 矩形左上角的 y 坐标。
         * @default 0
         */
        y: number;
        /**
         * 矩形的宽度（以像素为单位）。
         * @default 0
         */
        width: number;
        /**
         * 矩形的高度（以像素为单位）。
         * @default 0
         */
        height: number;
        /**
         * x 和 width 属性的和。
         */
        right: number;
        /**
         * y 和 height 属性的和。
         */
        bottom: number;
        /**
         * 矩形左上角的 x 坐标。更改 Rectangle 对象的 left 属性对 y 和 height 属性没有影响。但是，它会影响 width 属性，而更改 x 值不会影响 width 属性。
         * left 属性的值等于 x 属性的值。
         */
        left: number;
        /**
         * 矩形左上角的 y 坐标。更改 Rectangle 对象的 top 属性对 x 和 width 属性没有影响。但是，它会影响 height 属性，而更改 y 值不会影响 height 属性。<br/>
         * top 属性的值等于 y 属性的值。
         */
        top: number;
        /**
         * 由该点的 x 和 y 坐标确定的 Rectangle 对象左上角的位置。
         */
        topLeft: Point;
        /**
         * 由 right 和 bottom 属性的值确定的 Rectangle 对象的右下角的位置。
         */
        bottomRight: Point;
        /**
         * 将源 Rectangle 对象中的所有矩形数据复制到调用方 Rectangle 对象中。
         * @param sourceRect 要从中复制数据的 Rectangle 对象。
         */
        copyFrom(sourceRect: Rectangle): Rectangle;
        /**
         * 将 Rectangle 的成员设置为指定值
         * @param x 矩形左上角的 x 坐标。
         * @param y 矩形左上角的 y 坐标。
         * @param width 矩形的宽度（以像素为单位）。
         * @param height 矩形的高度（以像素为单位）。
         */
        setTo(x: number, y: number, width: number, height: number): Rectangle;
        /**
         * 确定由此 Rectangle 对象定义的矩形区域内是否包含指定的点。
         * @param x 检测点的x轴
         * @param y 检测点的y轴
         * @returns 如果检测点位于矩形内，返回true，否则，返回false
         */
        contains(x: number, y: number): boolean;
        /**
         * 如果在 toIntersect 参数中指定的 Rectangle 对象与此 Rectangle 对象相交，则返回交集区域作为 Rectangle 对象。如果矩形不相交，
         * 则此方法返回一个空的 Rectangle 对象，其属性设置为 0。
         * @param toIntersect 要对照比较以查看其是否与此 Rectangle 对象相交的 Rectangle 对象。
         * @returns 等于交集区域的 Rectangle 对象。如果该矩形不相交，则此方法返回一个空的 Rectangle 对象；即，其 x、y、width 和
         * height 属性均设置为 0 的矩形。
         */
        intersection(toIntersect: Rectangle): Rectangle;
        /**
         * 按指定量增加 Rectangle 对象的大小（以像素为单位）
         * 保持 Rectangle 对象的中心点不变，使用 dx 值横向增加它的大小，使用 dy 值纵向增加它的大小。
         * @param dx Rectangle 对象横向增加的值。
         * @param dy Rectangle 对象纵向增加的值。
         */
        inflate(dx: number, dy: number): void;
        /**
         * @private
         */
        $intersectInPlace(clipRect: Rectangle): Rectangle;
        /**
         * 确定在 toIntersect 参数中指定的对象是否与此 Rectangle 对象相交。此方法检查指定的 Rectangle
         * 对象的 x、y、width 和 height 属性，以查看它是否与此 Rectangle 对象相交。
         * @param toIntersect 要与此 Rectangle 对象比较的 Rectangle 对象。
         * @returns 如果两个矩形相交，返回true，否则返回false
         */
        intersects(toIntersect: Rectangle): boolean;
        /**
         * 确定此 Rectangle 对象是否为空。
         * @returns 如果 Rectangle 对象的宽度或高度小于等于 0，则返回 true 值，否则返回 false。
         */
        isEmpty(): boolean;
        /**
         * 将 Rectangle 对象的所有属性设置为 0。
         */
        setEmpty(): void;
        /**
         * 返回一个新的 Rectangle 对象，其 x、y、width 和 height 属性的值与原始 Rectangle 对象的对应值相同。
         * @returns 新的 Rectangle 对象，其 x、y、width 和 height 属性的值与原始 Rectangle 对象的对应值相同。
         */
        clone(): Rectangle;
        /**
         * 确定由此 Rectangle 对象定义的矩形区域内是否包含指定的点。
         * 此方法与 Rectangle.contains() 方法类似，只不过它采用 Point 对象作为参数。
         * @param point 包含点对象
         * @returns 如果包含，返回true，否则返回false
         */
        containsPoint(point: Point): boolean;
        /**
         * 确定此 Rectangle 对象内是否包含由 rect 参数指定的 Rectangle 对象。
         * 如果一个 Rectangle 对象完全在另一个 Rectangle 的边界内，我们说第二个 Rectangle 包含第一个 Rectangle。
         * @param rect 所检查的 Rectangle 对象
         * @returns 如果此 Rectangle 对象包含您指定的 Rectangle 对象，则返回 true 值，否则返回 false。
         */
        containsRect(rect: Rectangle): boolean;
        /**
         * 确定在 toCompare 参数中指定的对象是否等于此 Rectangle 对象。
         * 此方法将某个对象的 x、y、width 和 height 属性与此 Rectangle 对象所对应的相同属性进行比较。
         * @param toCompare 要与此 Rectangle 对象进行比较的矩形。
         * @returns 如果对象具有与此 Rectangle 对象完全相同的 x、y、width 和 height 属性值，则返回 true 值，否则返回 false。
         */
        equals(toCompare: Rectangle): boolean;
        /**
         * 增加 Rectangle 对象的大小。此方法与 Rectangle.inflate() 方法类似，只不过它采用 Point 对象作为参数。
         */
        inflatePoint(point: Point): void;
        /**
         * 按指定量调整 Rectangle 对象的位置（由其左上角确定）。
         * @param dx 将 Rectangle 对象的 x 值移动此数量。
         * @param dy 将 Rectangle 对象的 t 值移动此数量。
         */
        offset(dx: number, dy: number): void;
        /**
         * 将 Point 对象用作参数来调整 Rectangle 对象的位置。此方法与 Rectangle.offset() 方法类似，只不过它采用 Point 对象作为参数。
         * @param point 要用于偏移此 Rectangle 对象的 Point 对象。
         */
        offsetPoint(point: Point): void;
        /**
         * 生成并返回一个字符串，该字符串列出 Rectangle 对象的水平位置和垂直位置以及高度和宽度。
         * @returns 一个字符串，它列出了 Rectangle 对象的下列各个属性的值：x、y、width 和 height。
         */
        toString(): string;
        /**
         * 通过填充两个矩形之间的水平和垂直空间，将这两个矩形组合在一起以创建一个新的 Rectangle 对象。
         * @param toUnion 要添加到此 Rectangle 对象的 Rectangle 对象。
         * @returns 充当两个矩形的联合的新 Rectangle 对象。
         */
        union(toUnion: Rectangle): Rectangle;
    }
}
declare module feng3d {
    /**
     * Vector3D 类使用笛卡尔坐标 x、y 和 z 表示三维空间中的点或位置
     * @author feng 2016-3-21
     */
    class Vector3D {
        /**
        * 定义为 Vector3D 对象的 x 轴，坐标为 (1,0,0)。
        */
        static X_AXIS: Vector3D;
        /**
        * 定义为 Vector3D 对象的 y 轴，坐标为 (0,1,0)
        */
        static Y_AXIS: Vector3D;
        /**
        * 定义为 Vector3D 对象的 z 轴，坐标为 (0,0,1)
        */
        static Z_AXIS: Vector3D;
        /**
        * Vector3D 对象中的第一个元素，例如，三维空间中某个点的 x 坐标。默认值为 0
        */
        x: number;
        /**
        * Vector3D 对象中的第二个元素，例如，三维空间中某个点的 y 坐标。默认值为 0
        */
        y: number;
        /**
        * Vector3D 对象中的第三个元素，例如，三维空间中某个点的 z 坐标。默认值为 0
        */
        z: number;
        /**
        * Vector3D 对象的第四个元素（除了 x、y 和 z 属性之外）可以容纳数据，例如旋转角度。默认值为 0
        */
        w: number;
        /**
        * 当前 Vector3D 对象的长度（大小），即从原点 (0,0,0) 到该对象的 x、y 和 z 坐标的距离。w 属性将被忽略。单位矢量具有的长度或大小为一。
        */
        readonly length: number;
        /**
        * 当前 Vector3D 对象长度的平方，它是使用 x、y 和 z 属性计算出来的。w 属性将被忽略。尽可能使用 lengthSquared() 方法，而不要使用 Vector3D.length() 方法的 Math.sqrt() 方法调用，后者速度较慢。
        */
        readonly lengthSquared: number;
        /**
         * 创建 Vector3D 对象的实例。如果未指定构造函数的参数，则将使用元素 (0,0,0,0) 创建 Vector3D 对象。
         * @param x 第一个元素，例如 x 坐标。
         * @param y 第二个元素，例如 y 坐标。
         * @param z 第三个元素，例如 z 坐标。
         * @param w 表示额外数据的可选元素，例如旋转角度
         */
        constructor(x?: number, y?: number, z?: number, w?: number);
        /**
         * 将当前 Vector3D 对象的 x、y 和 z 元素的值与另一个 Vector3D 对象的 x、y 和 z 元素的值相加。
         * @param a 要与当前 Vector3D 对象相加的 Vector3D 对象。
         * @return 一个 Vector3D 对象，它是将当前 Vector3D 对象与另一个 Vector3D 对象相加所产生的结果。
         */
        add(a: Vector3D): Vector3D;
        /**
         * 返回一个新 Vector3D 对象，它是与当前 Vector3D 对象完全相同的副本。
         * @return 一个新 Vector3D 对象，它是当前 Vector3D 对象的副本。
         */
        clone(): Vector3D;
        /**
         * 将源 Vector3D 对象中的所有矢量数据复制到调用方 Vector3D 对象中。
         * @return 要从中复制数据的 Vector3D 对象。
         */
        copyFrom(sourceVector3D: Vector3D): void;
        /**
         * 返回一个新的 Vector3D 对象，它与当前 Vector3D 对象和另一个 Vector3D 对象垂直（成直角）。
         */
        crossProduct(a: Vector3D): Vector3D;
        /**
         * 按照指定的 Vector3D 对象的 x、y 和 z 元素的值递减当前 Vector3D 对象的 x、y 和 z 元素的值。
         */
        decrementBy(a: Vector3D): void;
        /**
         * 返回两个 Vector3D 对象之间的距离。
         */
        static distance(pt1: Vector3D, pt2: Vector3D): number;
        /**
         * 如果当前 Vector3D 对象和作为参数指定的 Vector3D 对象均为单位顶点，此方法将返回这两个顶点之间所成角的余弦值。
         */
        dotProduct(a: Vector3D): number;
        /**
         * 通过将当前 Vector3D 对象的 x、y 和 z 元素与指定的 Vector3D 对象的 x、y 和 z 元素进行比较，确定这两个对象是否相等。
         */
        equals(toCompare: Vector3D, allFour?: boolean): boolean;
        /**
         * 按照指定的 Vector3D 对象的 x、y 和 z 元素的值递增当前 Vector3D 对象的 x、y 和 z 元素的值。
         */
        incrementBy(a: Vector3D): void;
        /**
         * 将当前 Vector3D 对象设置为其逆对象。
         */
        negate(): void;
        /**
         * 通过将最前面的三个元素（x、y、z）除以矢量的长度可将 Vector3D 对象转换为单位矢量。
         */
        normalize(thickness?: number): void;
        /**
         * 按标量（大小）缩放当前的 Vector3D 对象。
         */
        scaleBy(s: number): void;
        /**
         * 将 Vector3D 的成员设置为指定值
         */
        setTo(xa: number, ya: number, za: number): void;
        /**
         * 从另一个 Vector3D 对象的 x、y 和 z 元素的值中减去当前 Vector3D 对象的 x、y 和 z 元素的值。
         */
        subtract(a: Vector3D): Vector3D;
        /**
         * 返回当前 Vector3D 对象的字符串表示形式。
         */
        toString(): string;
    }
}
declare module feng3d {
    /**
     * Matrix3D 类表示一个转换矩阵，该矩阵确定三维 (3D) 显示对象的位置和方向。
     * 该矩阵可以执行转换功能，包括平移（沿 x、y 和 z 轴重新定位）、旋转和缩放（调整大小）。
     * Matrix3D 类还可以执行透视投影，这会将 3D 坐标空间中的点映射到二维 (2D) 视图。
     *
     *  ---            方向              平移 ---
     *  |   scaleX      0         0       tx    |
     *  |     0       scaleY      0       ty    |
     *  |     0         0       scaleZ    tz    |
     *  |     0         0         0       tw    |
     *  ---  x轴        y轴      z轴          ---
     *
     *  ---            方向              平移 ---
     *  |     0         4         8       12    |
     *  |     1         5         9       13    |
     *  |     2         6        10       14    |
     *  |     3         7        11       15    |
     *  ---  x轴        y轴      z轴          ---
     */
    class Matrix3D {
        /**
         * 一个由 16 个数字组成的矢量，其中，每四个元素可以是 4x4 矩阵的一列。
         */
        rawData: Float32Array;
        /**
         * 一个保存显示对象在转换参照帧中的 3D 坐标 (x,y,z) 位置的 Vector3D 对象。
         */
        position: Vector3D;
        /**
         * 一个用于确定矩阵是否可逆的数字。
         */
        readonly determinant: number;
        /**
         * 前方（+Z轴方向）
         */
        readonly forward: Vector3D;
        /**
         * 上方（+y轴方向）
         */
        readonly up: Vector3D;
        /**
         * 右方（+x轴方向）
         */
        readonly right: Vector3D;
        /**
         * 创建 Matrix3D 对象。
         * @param   datas    一个由 16 个数字组成的矢量，其中，每四个元素可以是 4x4 矩阵的一列。
         */
        constructor(datas?: Float32Array | number[]);
        /**
         * 创建旋转矩阵
         * @param   degrees         角度
         * @param   axis            旋转轴
         * @param   pivotPoint      旋转中心点
         */
        static createRotationMatrix3D(degrees: number, axis: Vector3D): Matrix3D;
        /**
         * 创建缩放矩阵
         * @param   xScale      用于沿 x 轴缩放对象的乘数。
         * @param   yScale      用于沿 y 轴缩放对象的乘数。
         * @param   zScale      用于沿 z 轴缩放对象的乘数。
         */
        static createScaleMatrix3D(xScale: number, yScale: number, zScale: number): Matrix3D;
        /**
         * 创建位移矩阵
         * @param   x   沿 x 轴的增量平移。
         * @param   y   沿 y 轴的增量平移。
         * @param   z   沿 z 轴的增量平移。
         */
        static createTranslationMatrix3D(x: number, y: number, z: number): Matrix3D;
        /**
         * 通过将另一个 Matrix3D 对象与当前 Matrix3D 对象相乘来后置一个矩阵。
         */
        append(lhs: Matrix3D): void;
        /**
         * 在 Matrix3D 对象上后置一个增量旋转。
         * @param   degrees         角度
         * @param   axis            旋转轴
         * @param   pivotPoint      旋转中心点
         */
        appendRotation(degrees: number, axis: Vector3D, pivotPoint?: Vector3D): void;
        /**
         * 在 Matrix3D 对象上后置一个增量缩放，沿 x、y 和 z 轴改变位置。
         * @param   xScale      用于沿 x 轴缩放对象的乘数。
         * @param   yScale      用于沿 y 轴缩放对象的乘数。
         * @param   zScale      用于沿 z 轴缩放对象的乘数。
         */
        appendScale(xScale: number, yScale: number, zScale: number): void;
        /**
         * 在 Matrix3D 对象上后置一个增量平移，沿 x、y 和 z 轴重新定位。
         * @param   x   沿 x 轴的增量平移。
         * @param   y   沿 y 轴的增量平移。
         * @param   z   沿 z 轴的增量平移。
         */
        appendTranslation(x: number, y: number, z: number): void;
        /**
         * 返回一个新 Matrix3D 对象，它是与当前 Matrix3D 对象完全相同的副本。
         */
        clone(): Matrix3D;
        /**
         * 将 Vector3D 对象复制到调用方 Matrix3D 对象的特定列中。
         * @param   column      副本的目标列。
         * @param   vector3D    要从中复制数据的 Vector3D 对象。
         */
        copyColumnFrom(column: number, vector3D: Vector3D): void;
        /**
         * 将调用方 Matrix3D 对象的特定列复制到 Vector3D 对象中。
         * @param   column       要从中复制数据的列。
         * @param   vector3D     副本的目标 Vector3D 对象。
         */
        copyColumnTo(column: number, vector3D: Vector3D): void;
        /**
         * 将源 Matrix3D 对象中的所有矩阵数据复制到调用方 Matrix3D 对象中。
         * @param   sourceMatrix3D      要从中复制数据的 Matrix3D 对象。
         */
        copyFrom(sourceMatrix3D: Matrix3D): void;
        /**
         * 将源 Vector 对象中的所有矢量数据复制到调用方 Matrix3D 对象中。利用可选索引参数，您可以选择矢量中的任何起始文字插槽。
         * @param   vector      要从中复制数据的 Vector 对象。
         * @param   index       vector中的起始位置
         * @param   transpose   是否转置当前矩阵
         */
        copyRawDataFrom(vector: Float32Array, index?: number, transpose?: boolean): void;
        /**
         * 将调用方 Matrix3D 对象中的所有矩阵数据复制到提供的矢量中。
         * @param   vector      要将数据复制到的 Vector 对象。
         * @param   index       vector中的起始位置
         * @param   transpose   是否转置当前矩阵
         */
        copyRawDataTo(vector: Array<number>, index?: number, transpose?: boolean): void;
        /**
         * 将 Vector3D 对象复制到调用方 Matrix3D 对象的特定行中。
         * @param   row         要将数据复制到的行。
         * @param   vector3D    要从中复制数据的 Vector3D 对象。
         */
        copyRowFrom(row: number, vector3D: Vector3D): void;
        /**
         * 将调用方 Matrix3D 对象的特定行复制到 Vector3D 对象中。
         * @param   row         要从中复制数据的行。
         * @param   vector3D    将作为数据复制目的地的 Vector3D 对象。
         */
        copyRowTo(row: number, vector3D: Vector3D): void;
        /**
         * 拷贝当前矩阵
         * @param   dest    目标矩阵
         */
        copyToMatrix3D(dest: Matrix3D): void;
        /**
         * 将转换矩阵的平移、旋转和缩放设置作为由三个 Vector3D 对象组成的矢量返回。
         * @return      一个由三个 Vector3D 对象组成的矢量，其中，每个对象分别容纳平移、旋转和缩放设置。
         */
        decompose(): Vector3D[];
        /**
         * 使用不含平移元素的转换矩阵将 Vector3D 对象从一个空间坐标转换到另一个空间坐标。
         * @param   v   一个容纳要转换的坐标的 Vector3D 对象。
         * @return  一个包含转换后的坐标的 Vector3D 对象。
         */
        deltaTransformVector(v: Vector3D): Vector3D;
        /**
         * 将当前矩阵转换为恒等或单位矩阵。
         */
        identity(): void;
        /**
         * 反转当前矩阵。逆矩阵
         * @return      如果成功反转矩阵，则返回 true。
         */
        invert(): boolean;
        /**
         * 通过将当前 Matrix3D 对象与另一个 Matrix3D 对象相乘来前置一个矩阵。得到的结果将合并两个矩阵转换。
         * @param   rhs     个右侧矩阵，它与当前 Matrix3D 对象相乘。
         */
        prepend(rhs: Matrix3D): void;
        /**
         * 在 Matrix3D 对象上前置一个增量旋转。在将 Matrix3D 对象应用于显示对象时，矩阵会在 Matrix3D 对象中先执行旋转，然后再执行其他转换。
         * @param   degrees     旋转的角度。
         * @param   axis        旋转的轴或方向。常见的轴为 X_AXIS (Vector3D(1,0,0))、Y_AXIS (Vector3D(0,1,0)) 和 Z_AXIS (Vector3D(0,0,1))。此矢量的长度应为 1。
         * @param   pivotPoint  一个用于确定旋转中心的点。对象的默认轴点为该对象的注册点。
         */
        prependRotation(degrees: number, axis: Vector3D, pivotPoint?: Vector3D): void;
        /**
         * 在 Matrix3D 对象上前置一个增量缩放，沿 x、y 和 z 轴改变位置。在将 Matrix3D 对象应用于显示对象时，矩阵会在 Matrix3D 对象中先执行缩放更改，然后再执行其他转换。
         * @param   xScale      用于沿 x 轴缩放对象的乘数。
         * @param   yScale      用于沿 y 轴缩放对象的乘数。
         * @param   zScale      用于沿 z 轴缩放对象的乘数。
         */
        prependScale(xScale: number, yScale: number, zScale: number): void;
        /**
         * 在 Matrix3D 对象上前置一个增量平移，沿 x、y 和 z 轴重新定位。在将 Matrix3D 对象应用于显示对象时，矩阵会在 Matrix3D 对象中先执行平移更改，然后再执行其他转换。
         * @param   x   沿 x 轴的增量平移。
         * @param   y   沿 y 轴的增量平移。
         * @param   z   沿 z 轴的增量平移。
         */
        prependTranslation(x: number, y: number, z: number): void;
        /**
         * 设置转换矩阵的平移、旋转和缩放设置。
         * @param   components      一个由三个 Vector3D 对象组成的矢量，这些对象将替代 Matrix3D 对象的平移、旋转和缩放元素。
         */
        recompose(components: Vector3D[]): void;
        /**
         * 使用转换矩阵将 Vector3D 对象从一个空间坐标转换到另一个空间坐标。
         * @param   vin   一个容纳要转换的坐标的 Vector3D 对象。
         * @return  一个包含转换后的坐标的 Vector3D 对象。
         */
        transformVector(vin: Vector3D, vout?: Vector3D): Vector3D;
        /**
         * 使用转换矩阵将由数字构成的矢量从一个空间坐标转换到另一个空间坐标。
         * @param   vin     一个由多个数字组成的矢量，其中每三个数字构成一个要转换的 3D 坐标 (x,y,z)。
         * @param   vout    一个由多个数字组成的矢量，其中每三个数字构成一个已转换的 3D 坐标 (x,y,z)。
         */
        transformVectors(vin: number[], vout: number[]): void;
        /**
         * 将当前 Matrix3D 对象转换为一个矩阵，并将互换其中的行和列。
         */
        transpose(): void;
        /**
         * 比较矩阵是否相等
         */
        compare(matrix3D: Matrix3D, precision?: number): boolean;
        /**
         * 看向目标位置
         * @param target    目标位置
         * @param upAxis    向上朝向
         */
        lookAt(target: Vector3D, upAxis?: Vector3D): void;
        /**
         * 以字符串返回矩阵的值
         */
        toString(): string;
    }
}
declare module feng3d {
    /**
     * A Quaternion object which can be used to represent rotations.
     */
    class Quaternion {
        /**
         * The x value of the quaternion.
         */
        x: number;
        /**
         * The y value of the quaternion.
         */
        y: number;
        /**
         * The z value of the quaternion.
         */
        z: number;
        /**
         * The w value of the quaternion.
         */
        w: number;
        /**
         * Creates a new Quaternion object.
         * @param x The x value of the quaternion.
         * @param y The y value of the quaternion.
         * @param z The z value of the quaternion.
         * @param w The w value of the quaternion.
         */
        constructor(x?: number, y?: number, z?: number, w?: number);
        /**
         * Returns the magnitude of the quaternion object.
         */
        readonly magnitude: number;
        /**
         * Fills the quaternion object with the result from a multiplication of two quaternion objects.
         *
         * @param    qa    The first quaternion in the multiplication.
         * @param    qb    The second quaternion in the multiplication.
         */
        multiply(qa: Quaternion, qb: Quaternion): void;
        multiplyVector(vector: Vector3D, target?: Quaternion): Quaternion;
        /**
         * Fills the quaternion object with values representing the given rotation around a vector.
         *
         * @param    axis    The axis around which to rotate
         * @param    angle    The angle in radians of the rotation.
         */
        fromAxisAngle(axis: Vector3D, angle: number): void;
        /**
         * Spherically interpolates between two quaternions, providing an interpolation between rotations with constant angle change rate.
         * @param qa The first quaternion to interpolate.
         * @param qb The second quaternion to interpolate.
         * @param t The interpolation weight, a value between 0 and 1.
         */
        slerp(qa: Quaternion, qb: Quaternion, t: number): void;
        /**
         * 线性求插值
         * @param qa 第一个四元素
         * @param qb 第二个四元素
         * @param t 权重
         */
        lerp(qa: Quaternion, qb: Quaternion, t: number): void;
        /**
         * Fills the quaternion object with values representing the given euler rotation.
         *
         * @param    ax        The angle in radians of the rotation around the ax axis.
         * @param    ay        The angle in radians of the rotation around the ay axis.
         * @param    az        The angle in radians of the rotation around the az axis.
         */
        fromEulerAngles(ax: number, ay: number, az: number): void;
        /**
         * Fills a target Vector3D object with the Euler angles that form the rotation represented by this quaternion.
         * @param target An optional Vector3D object to contain the Euler angles. If not provided, a new object is created.
         * @return The Vector3D containing the Euler angles.
         */
        toEulerAngles(target?: Vector3D): Vector3D;
        /**
         * Normalises the quaternion object.
         */
        normalize(val?: number): void;
        /**
         * Used to trace the values of a quaternion.
         *
         * @return A string representation of the quaternion object.
         */
        toString(): string;
        /**
         * Converts the quaternion to a Matrix3D object representing an equivalent rotation.
         * @param target An optional Matrix3D container to store the transformation in. If not provided, a new object is created.
         * @return A Matrix3D object representing an equivalent rotation.
         */
        toMatrix3D(target?: Matrix3D): Matrix3D;
        /**
         * Extracts a quaternion rotation matrix out of a given Matrix3D object.
         * @param matrix The Matrix3D out of which the rotation will be extracted.
         */
        fromMatrix(matrix: Matrix3D): void;
        /**
         * Converts the quaternion to a Vector.&lt;number&gt; matrix representation of a rotation equivalent to this quaternion.
         * @param target The Vector.&lt;number&gt; to contain the raw matrix data.
         * @param exclude4thRow If true, the last row will be omitted, and a 4x3 matrix will be generated instead of a 4x4.
         */
        toRawData(target: number[], exclude4thRow?: boolean): void;
        /**
         * Clones the quaternion.
         * @return An exact duplicate of the current Quaternion.
         */
        clone(): Quaternion;
        /**
         * Rotates a point.
         * @param vector The Vector3D object to be rotated.
         * @param target An optional Vector3D object that will contain the rotated coordinates. If not provided, a new object will be created.
         * @return A Vector3D object containing the rotated point.
         */
        rotatePoint(vector: Vector3D, target?: Vector3D): Vector3D;
        /**
         * Copies the data from a quaternion into this instance.
         * @param q The quaternion to copy from.
         */
        copyFrom(q: Quaternion): void;
    }
}
declare module feng3d {
    /**
     * 3d面
     */
    class Plane3D {
        /**
         * 平面A系数
         * <p>同样也是面法线x尺寸</p>
         */
        a: number;
        /**
         * 平面B系数
         * <p>同样也是面法线y尺寸</p>
         */
        b: number;
        /**
         * 平面C系数
         * <p>同样也是面法线z尺寸</p>
         */
        c: number;
        /**
         * 平面D系数
         * <p>同样也是（0，0）点到平面的距离的负值</p>
         */
        d: number;
        /**
         * 对齐类型
         */
        _alignment: number;
        /**
         * 普通平面
         * <p>不与对称轴平行或垂直</p>
         */
        static ALIGN_ANY: number;
        /**
         * XY方向平面
         * <p>法线与Z轴平行</p>
         */
        static ALIGN_XY_AXIS: number;
        /**
         * YZ方向平面
         * <p>法线与X轴平行</p>
         */
        static ALIGN_YZ_AXIS: number;
        /**
         * XZ方向平面
         * <p>法线与Y轴平行</p>
         */
        static ALIGN_XZ_AXIS: number;
        /**
         * 创建一个平面
         * @param a		A系数
         * @param b		B系数
         * @param c		C系数
         * @param d		D系数
         */
        constructor(a?: number, b?: number, c?: number, d?: number);
        /**
         * 通过3顶点定义一个平面
         * @param p0		点0
         * @param p1		点1
         * @param p2		点2
         */
        fromPoints(p0: Vector3D, p1: Vector3D, p2: Vector3D): void;
        /**
         * 根据法线与点定义平面
         * @param normal		平面法线
         * @param point			平面上任意一点
         */
        fromNormalAndPoint(normal: Vector3D, point: Vector3D): void;
        /**
         * 标准化平面
         * @return		标准化后的平面
         */
        normalize(): Plane3D;
        /**
         * 计算点与平面的距离
         * @param p		点
         * @returns		距离
         */
        distance(p: Vector3D): number;
        /**
         * 顶点分类
         * <p>把顶点分为后面、前面、相交三类</p>
         * @param p			顶点
         * @return			顶点类型 PlaneClassification.BACK,PlaneClassification.FRONT,PlaneClassification.INTERSECT
         * @see				feng3d.core.math.PlaneClassification
         */
        classifyPoint(p: Vector3D, epsilon?: number): number;
        /**
         * 输出字符串
         */
        toString(): string;
    }
}
declare module feng3d {
    /**
     * 点与面的相对位置
     * @author feng
     */
    class PlaneClassification {
        /**
         * 在平面后面
         * <p>等价于平面内</p>
         * @see #IN
         */
        static BACK: number;
        /**
         * 在平面前面
         * <p>等价于平面外</p>
         * @see #OUT
         */
        static FRONT: number;
        /**
         * 在平面内
         * <p>等价于在平面后</p>
         * @see #BACK
         */
        static IN: number;
        /**
         * 在平面外
         * <p>等价于平面前面</p>
         * @see #FRONT
         */
        static OUT: number;
        /**
         * 与平面相交
         */
        static INTERSECT: number;
    }
}
declare module feng3d {
    /**
     * 渲染模式
     * @author feng 2016-09-28
     */
    enum RenderMode {
        DEFAULT,
        /**
         * 点渲染
         */
        POINTS,
        LINE_LOOP,
        LINE_STRIP,
        LINES,
        TRIANGLES,
        TRIANGLE_STRIP,
        TRIANGLE_FAN,
    }
}
declare module feng3d {
    /**
     * 渲染参数
     * @author feng 2016-12-14
     */
    interface ShaderParams {
        /**
         * 渲染模式
         */
        renderMode: RenderMode;
    }
}
declare module feng3d {
    /**
     * 渲染数据拥有者
     * @author feng 2016-6-7
     */
    class RenderDataHolder extends Component {
        protected renderData: RenderData;
        private _subRenderDataHolders;
        /**
         * 创建Context3D数据缓冲
         */
        constructor();
        /**
         * 更新渲染数据
         */
        updateRenderData(renderContext: RenderContext): void;
        /**
         * 激活
         * @param renderData	渲染数据
         */
        activate(renderData: RenderAtomic): void;
        /**
         * 释放
         * @param renderData	渲染数据
         */
        deactivate(renderData: RenderAtomic): void;
        /**
         * 添加组件到指定位置
         * @param component		被添加的组件
         * @param index			插入的位置
         */
        addComponentAt(component: IComponent, index: number): void;
        /**
         * 移除组件
         * @param index		要删除的 Component 的子索引。
         */
        removeComponentAt(index: number): IComponent;
    }
}
declare module feng3d {
    /**
     * 渲染原子（该对象会收集一切渲染所需数据以及参数）
     * @author feng 2016-06-20
     */
    class RenderAtomic {
        /**
         * 顶点索引缓冲
         */
        indexBuffer: IndexRenderData;
        /**
         * 顶点渲染程序代码
         */
        vertexCode: string;
        /**
         * 片段渲染程序代码
         */
        fragmentCode: string;
        /**
         * 属性数据列表
         */
        attributes: {
            [name: string]: AttributeRenderData;
        };
        /**
         * 常量数据（包含纹理）列表
         */
        uniforms: {
            [name: string]: number | number[] | Matrix3D | Vector3D | TextureInfo | Vector3D[] | Matrix3D[];
        };
        /**
         * 渲染参数
         */
        shaderParams: ShaderParams;
        /**
         * 着色器宏定义
         */
        shaderMacro: ShaderMacro;
        /**
         * 渲染实例数量
         */
        instanceCount: number;
    }
    /**
     * 渲染所需数据
     * @author feng 2016-12-28
     */
    class RenderData extends RenderAtomic {
    }
}
declare module feng3d {
    /**
     * 索引渲染数据
     * @author feng 2017-01-04
     */
    class IndexRenderData {
        /**
         * 索引数据
         */
        indices: Uint16Array;
        /**
         * 数据绑定目标，gl.ARRAY_BUFFER、gl.ELEMENT_ARRAY_BUFFER
         */
        target: number;
        /**
         * 渲染数量
         */
        count: number;
        /**
         * 数据类型，gl.UNSIGNED_BYTE、gl.UNSIGNED_SHORT
         */
        type: number;
        /**
         * 索引偏移
         */
        offset: number;
    }
    /**
     * 属性渲染数据
     * @author feng 2014-8-14
     */
    class AttributeRenderData {
        /**
         * 属性数据
         */
        data: Float32Array;
        /**
         * 数据步长
         */
        stride: number;
        /**
         * drawElementsInstanced时将会用到的因子，表示divisor个geometry共用一个数据
         */
        divisor: number;
        constructor(data?: Float32Array, stride?: number, divisor?: number);
        /**
         * 获取或创建数据
         * @param num   数据数量
         */
        getOrCreateData(num: number): Float32Array;
    }
}
declare module feng3d {
}
declare module feng3d {
    /**
     * 对象池
     * @author feng 2016-04-26
     */
    class RenderBufferPool {
        /**
         * @param context3D     3D环境
         */
        private getContext3DBufferPool(context3D);
        /**
         * 获取渲染程序
         * @param context3D     3D环境
         * @param vertexCode    顶点着色器代码
         * @param fragmentCode  片段着色器代码
         * @return  渲染程序
         */
        getWebGLProgram(context3D: Context3D, vertexCode: string, fragmentCode: string): WebGLProgram;
        /**
         * 获取顶点渲染程序
         * @param context3D         3D环境
         * @param vertexCode        顶点渲染代码
         * @return                  顶点渲染程序
         */
        getVertexShader(context3D: Context3D, vertexCode: string): WebGLShader;
        /**
         * 获取顶点渲染程序
         * @param context3D         3D环境
         * @param fragmentCode      顶点渲染代码
         * @return                  顶点渲染程序
         */
        getFragmentShader(context3D: Context3D, fragmentCode: string): WebGLShader;
        /**
         * 获取索引缓冲
         */
        getIndexBuffer(context3D: Context3D, indices: Uint16Array): WebGLBuffer;
        /**
         * 获取顶点属性缓冲
         * @param data  数据
         */
        getVABuffer(context3D: Context3D, data: Float32Array): WebGLBuffer;
        /**
         * 获取顶点属性缓冲
         * @param data  数据
         */
        getTexture(context3D: Context3D, data: TextureInfo): WebGLBuffer;
        /**
         * 3D环境缓冲池
         */
        private context3DBufferPools;
    }
    /**
     * 3D环境对象池
     */
    var context3DPool: RenderBufferPool;
}
declare module feng3d {
    /**
     * 渲染数据工具
     * @author feng 2016-05-02
     */
    class RenderDataUtil {
        /**
         * 激活渲染数据
         * @param renderAtomic  渲染原子
         * @param renderData    包含渲染数据的对象
         */
        static active(renderAtomic: RenderAtomic, renderData: RenderData): void;
        /**
         * 释放渲染数据
         * @param renderAtomic  渲染原子
         * @param renderData    包含渲染数据的对象
         */
        static deactivate(renderAtomic: RenderAtomic, renderData: RenderData): void;
    }
}
declare module feng3d {
    /**
     * 渲染数据编号
     * @author feng 2016-06-20
     */
    class RenderDataID {
        /**
         * 顶点索引
         */
        static index: string;
        /**
         * 模型矩阵
         */
        static u_modelMatrix: string;
        /**
         * 世界投影矩阵
         */
        static u_viewProjection: string;
        static u_diffuseInput: string;
        /**
         * 漫反射贴图
         */
        static s_texture: string;
        /**
         * 天空盒纹理
         */
        static s_skyboxTexture: string;
        /**
         * 摄像机矩阵
         */
        static u_cameraMatrix: string;
        /**
         * 天空盒尺寸
         */
        static u_skyBoxSize: string;
        /**
         * 地形混合贴图
         */
        static s_blendTexture: string;
        /**
         * 地形块贴图1
         */
        static s_splatTexture1: string;
        /**
         * 地形块贴图2
         */
        static s_splatTexture2: string;
        /**
         * 地形块贴图3
         */
        static s_splatTexture3: string;
        /**
         * 地形块重复次数
         */
        static u_splatRepeats: string;
        /**
         * 点光源位置数组
         */
        static u_pointLightPositions: string;
        /**
         * 点光源颜色数组
         */
        static u_pointLightColors: string;
        /**
         * 点光源光照强度数组
         */
        static u_pointLightIntensitys: string;
        /**
         * 基本颜色
         */
        static u_baseColor: string;
        /**
         * 反射率
         */
        static u_reflectance: string;
        /**
         * 粗糙度
         */
        static u_roughness: string;
        /**
         * 金属度
         */
        static u_metalic: string;
        /**
         * 粒子时间
         */
        static u_particleTime: string;
        /**
         * 点大小
         */
        static u_PointSize: string;
        /**
         * 骨骼全局矩阵
         */
        static u_skeletonGlobalMatriices: string;
        /**
         * 3D对象编号
         */
        static u_objectID: string;
    }
}
declare module feng3d {
    /**
     * 渲染参数编号
     * @author feng 2016-10-15
     */
    enum ShaderParamID {
        /**
         * 渲染模式
         */
        renderMode = 0,
    }
}
declare module feng3d {
    /**
     * 着色器宏定义
     * @author feng 2016-12-17
     */
    class ShaderMacro {
        /**
         * 值类型宏
         */
        valueMacros: ValueMacros;
        /**
         * Boolean类型宏
         */
        boolMacros: BoolMacros;
        /**
         * 递增类型宏
         */
        addMacros: IAddMacros;
    }
    /**
     * 值类型宏
     * 没有默认值
     */
    class ValueMacros {
        /**
         * 点光源数量
         */
        NUM_POINTLIGHT: number;
        /**
         * 骨骼关节数量
         */
        NUM_SKELETONJOINT: number;
    }
    /**
     * Boolean类型宏
     * 没有默认值
     */
    class BoolMacros {
    }
    /**
     * 递增类型宏
     * 所有默认值为0
     */
    class IAddMacros {
        /**
         * 是否需要属性uv
         */
        A_UV_NEED: number;
        /**
         * 是否需要变量uv
         */
        V_UV_NEED: number;
        /**
         * 是否需要变量全局坐标
         */
        V_GLOBAL_POSITION_NEED: number;
        /**
         * 是否需要属性法线
         */
        A_NORMAL_NEED: number;
        /**
         * 是否需要变量法线
         */
        V_NORMAL_NEED: number;
        /**
         * 是否需要摄像机矩阵
         */
        U_CAMERAmATRIX_NEED: number;
    }
}
declare module feng3d {
    /**
     * 渲染环境
     * @author feng 2017-01-04
     */
    class RenderContext {
        protected renderData: RenderData;
        /**
         * 摄像机
         */
        camera: Camera3D;
        /**
         * 灯光
         */
        lights: Light[];
        /**
         * 更新渲染数据
         */
        updateRenderData(object3D: Object3D): void;
        /**
         * 激活
         * @param renderData	渲染数据
         */
        activate(renderData: RenderAtomic): void;
        /**
         * 释放
         * @param renderData	渲染数据
         */
        deactivate(renderData: RenderAtomic): void;
        /**
         * 清理
         */
        clear(): void;
    }
}
declare module feng3d {
    /**
     * 3D对象
     * @author feng 2016-04-26
     */
    class Object3D extends RenderDataHolder {
        private _object3DID;
        private _uid;
        private _transform;
        /**
         * 父对象
         */
        private _parent;
        /**
         * 子对象列表
         */
        private _children;
        private _scene;
        /**
         * 唯一标识符
         */
        readonly uid: string;
        readonly object3DID: number;
        /**
         * 变换
         */
        transform: Transform;
        /**
         * 构建3D对象
         */
        constructor(name?: string);
        /**
         * 父对象
         */
        readonly parent: Object3D;
        private _setParent(value);
        /**
         * 场景
         */
        readonly scene: Scene3D;
        private _setScene(value);
        /**
         * 添加子对象
         * @param child		子对象
         * @return			新增的子对象
         */
        addChild(child: Object3D): void;
        /**
         * 添加子对象到指定位置
         * @param   child   子对象
         * @param   index   添加到的位置
         */
        addChildAt(child: Object3D, index: number): void;
        /**
         * 移除子对象
         * @param   child   子对象
         * @return			被移除子对象索引
         */
        removeChild(child: Object3D): number;
        /**
         * 获取子对象索引
         * @param   child   子对象
         * @return  子对象位置
         */
        getChildIndex(child: Object3D): number;
        /**
         * 移出指定索引的子对象
         * @param childIndex	子对象索引
         * @return				被移除对象
         */
        removeChildAt(childIndex: number): Object3D;
        /**
         * 获取子对象
         * @param index         子对象索引
         * @return              指定索引的子对象
         */
        getChildAt(index: number): Object3D;
        /**
         * 获取子对象数量
         */
        readonly numChildren: number;
        /**
         * 处理添加子对象事件
         */
        private onAdded(event);
        /**
         * 处理删除子对象事件
         */
        private onRemoved(event);
        static getObject3D(id: number): Object3D;
    }
}
declare module feng3d {
    /**
     * 3D视图
     * @author feng 2016-05-01
     */
    class View3D {
        private _context3D;
        private _camera;
        private _scene;
        private _canvas;
        /**
         * 默认渲染器
         */
        private defaultRenderer;
        /**
         * 鼠标事件管理器
         */
        private mouse3DManager;
        /**
         * 构建3D视图
         * @param canvas    画布
         * @param scene     3D场景
         * @param camera    摄像机
         */
        constructor(canvas: any, scene?: Scene3D, camera?: Camera3D);
        /**
         * 初始化GL
         */
        private initGL();
        /** 3d场景 */
        scene: Scene3D;
        /**
         * 绘制场景
         */
        private drawScene();
        /**
         * 摄像机
         */
        camera: Camera3D;
    }
}
declare module feng3d {
    /**
     * 3D对象组件
     * @author feng 2016-09-02
     */
    class Object3DComponent extends RenderDataHolder {
        /**
         * 父组件
         */
        protected _parentComponent: Object3D;
        /**
         * 所属对象
         */
        readonly object3D: Object3D;
        /**
         * 构建3D对象组件
         */
        constructor();
        /**
         * 全局矩阵
         */
        readonly globalMatrix3d: Matrix3D;
    }
}
declare module feng3d {
    /**
     * 变换
     * @author feng 2016-04-26
     */
    class Transform extends Object3DComponent {
        private _x;
        private _y;
        private _z;
        private _rx;
        private _ry;
        private _rz;
        private _sx;
        private _sy;
        private _sz;
        private _matrix3D;
        private _matrix3DDirty;
        private _inverseMatrix3D;
        private _inverseMatrix3DDirty;
        /**
         * 全局矩阵是否变脏
         */
        private _globalMatrix3DDirty;
        /**
         * 全局矩阵
         */
        private _globalMatrix3D;
        private _inverseGlobalMatrix3DDirty;
        private _inverseGlobalMatrix3D;
        /**
         * 构建变换
         * @param x X坐标
         * @param y Y坐标
         * @param z Z坐标
         * @param rx X旋转
         * @param ry Y旋转
         * @param rz Z旋转
         * @param sx X缩放
         * @param sy Y缩放
         * @param sz Z缩放
         */
        constructor(x?: number, y?: number, z?: number, rx?: number, ry?: number, rz?: number, sx?: number, sy?: number, sz?: number);
        /**
         * X坐标
         */
        x: number;
        /**
         * Y坐标
         */
        y: number;
        /**
         * Z坐标
         */
        z: number;
        /**
         * X旋转
         */
        rx: number;
        /**
         * Y旋转
         */
        ry: number;
        /**
         * Z旋转
         */
        rz: number;
        /**
         * X缩放
         */
        sx: number;
        /**
         * Y缩放
         */
        sy: number;
        /**
         * Z缩放
         */
        sz: number;
        /**
         * 位移
         */
        position: Vector3D;
        /**
         * 旋转
         */
        rotation: Vector3D;
        /**
         * 缩放
         */
        scale: Vector3D;
        /**
         * 全局坐标
         */
        readonly globalPosition: Vector3D;
        /**
         * 变换矩阵
         */
        matrix3d: Matrix3D;
        /**
         * 逆变换矩阵
         */
        readonly inverseMatrix3D: Matrix3D;
        /**
         * 看向目标位置
         * @param target    目标位置
         * @param upAxis    向上朝向
         */
        lookAt(target: Vector3D, upAxis?: Vector3D): void;
        /**
         * 全局矩阵
         */
        readonly globalMatrix3D: Matrix3D;
        /**
         * 逆全局矩阵
         */
        readonly inverseGlobalMatrix3D: Matrix3D;
        /**
         * 变换矩阵
         */
        private updateMatrix3D();
        /**
         * 使变换矩阵无效
         */
        protected invalidateMatrix3D(): void;
        /**
         * 发出状态改变消息
         */
        private notifyMatrix3DChanged();
        /**
         * 更新全局矩阵
         */
        private updateGlobalMatrix3D();
        /**
         * 更新逆全局矩阵
         */
        private updateInverseGlobalMatrix3D();
        /**
         * 通知全局变换改变
         */
        private notifySceneTransformChange();
        /**
         * 全局变换矩阵失效
         * @private
         */
        invalidateGlobalMatrix3D(): void;
        /**
         * 更新渲染数据
         */
        updateRenderData(renderContext: RenderContext): void;
    }
    /**
     * 变换事件(3D状态发生改变、位置、旋转、缩放)
     * @author feng 2014-3-31
     */
    class TransfromEvent extends Event {
        /**
         * 平移
         */
        static POSITION_CHANGED: string;
        /**
         * 旋转
         */
        static ROTATION_CHANGED: string;
        /**
         * 缩放
         */
        static SCALE_CHANGED: string;
        /**
         * 变换
         */
        static TRANSFORM_CHANGED: string;
        /**
         * 变换已更新
         */
        static TRANSFORM_UPDATED: string;
        /**
         * 场景变换矩阵发生变化
         */
        static SCENETRANSFORM_CHANGED: string;
        /**
         * 发出事件的3D元素
         */
        data: Transform;
        /**
         * 创建一个作为参数传递给事件侦听器的 Event 对象。
         * @param type 事件的类型，可以作为 Event.type 访问。
         * @param data 携带数据
         * @param bubbles 确定 Event 对象是否参与事件流的冒泡阶段。默认值为 false。
         */
        constructor(type: string, data: Transform, bubbles?: boolean);
    }
}
declare module feng3d {
    /**
     * 3D对象事件
     */
    class Object3DEvent extends Event {
        /**
         * 添加了子对象，当child被添加到parent中时派发冒泡事件
         */
        static ADDED: string;
        /**
         * 删除了子对象，当child被parent移除时派发冒泡事件
         */
        static REMOVED: string;
        /**
         * 事件数据
         */
        data: IObject3DEventData;
        /**
         * 创建一个作为参数传递给事件侦听器的 Event 对象。
         * @param type 事件的类型，可以作为 Event.type 访问。
         * @param data 携带数据
         * @param bubbles 确定 Event 对象是否参与事件流的冒泡阶段。默认值为 false。
         */
        constructor(type: string, data?: IObject3DEventData, bubbles?: boolean);
    }
    /**
     * 3D对象事件数据
     */
    interface IObject3DEventData {
        /**
         * 父容器
         */
        parent?: Object3D;
        /**
         * 子对象
         */
        child?: Object3D;
    }
}
declare module feng3d {
    /**
     * 网格
     * @author feng 2016-12-12
     */
    class MeshFilter extends Object3DComponent {
        private _geometry;
        /**
         * 几何体
         */
        geometry: Geometry;
    }
}
declare module feng3d {
    /**
     * 渲染器
     * @author feng 2016-05-01
     */
    class Renderer {
        /** 渲染原子 */
        protected renderAtomic: RenderAtomic;
        /**
         * 渲染
         */
        draw(context3D: Context3D, scene3D: Scene3D, camera: Camera3D): void;
        /**
         * 绘制3D对象
         */
        protected drawObject3D(context3D: Context3D): void;
        /**
         * 激活渲染程序
         */
        protected activeShaderProgram(context3D: Context3D, vertexCode: string, fragmentCode: string): WebGLProgram;
    }
}
declare module feng3d {
    /**
     * 网格渲染器
     * @author feng 2016-12-12
     */
    class MeshRenderer extends Object3DComponent {
        private _material;
        /**
         * 材质
         */
        material: Material;
        constructor();
        /**
         * 处理被添加组件事件
         */
        protected onBeAddedComponent(event: ComponentEvent): void;
        /**
         * 处理被移除组件事件
         */
        protected onBeRemovedComponent(event: ComponentEvent): void;
        /**
         * 处理添加到场景事件
         */
        private onAddedToScene(event);
        /**
         * 处理从场景移除事件
         */
        private onRemovedFromScene(event);
    }
}
declare module feng3d {
    /**
     * 鼠标拾取渲染器
     * @author feng 2017-02-06
     */
    class MouseRenderer extends Renderer {
        private shaderName;
        private shaderProgram;
        selectedObject3D: Object3D;
        /**
         * 渲染
         */
        draw(context3D: Context3D, scene3D: Scene3D, camera: Camera3D): void;
        /**
         * 激活渲染程序
         */
        protected activeShaderProgram(context3D: Context3D, vertexCode: string, fragmentCode: string): WebGLProgram;
    }
}
declare module feng3d {
    /**
     * 3D场景
     * @author feng 2016-05-01
     */
    class Scene3D extends Object3D {
        private _object3Ds;
        private _renderers;
        private _lights;
        /**
         * 渲染列表
         */
        readonly renderers: MeshRenderer[];
        /**
         * 灯光列表
         */
        readonly lights: Light[];
        /**
         * 构造3D场景
         */
        constructor();
        /**
         * 处理添加对象事件
         */
        private onAddedToScene(event);
        /**
         * 处理移除对象事件
         */
        private onRemovedFromScene(event);
        /**
         * 处理添加对象事件
         */
        private onAddedRendererToScene(event);
        /**
         * 处理移除对象事件
         */
        private onRemovedRendererFromScene(event);
        /**
         * 处理添加灯光事件
         */
        private onAddedLightToScene(event);
        /**
         * 处理移除灯光事件
         */
        private onRemovedLightFromScene(event);
    }
}
declare module feng3d {
    /**
     * 3D场景事件
     * @author feng 2016-01-03
     */
    class Scene3DEvent extends Event {
        /**
         * 当Object3D的scene属性被设置是由Object3D与Scene3D分别派发不冒泡事件
         */
        static ADDED_TO_SCENE: string;
        /**
         * 当Object3D的scene属性被清空时由Object3D与Scene3D分别派发不冒泡事件
         */
        static REMOVED_FROM_SCENE: string;
        /**
         * 当拥有Light的Object3D添加到Scene3D或者Light添加到场景中的Object3D时派发不冒泡事件
         */
        static ADDED_LIGHT_TO_SCENE: string;
        /**
         * 当拥有Light的Object3D从Scene3D中移除或者Light从场景中的Object3D移除时派发不冒泡事件
         */
        static REMOVED_LIGHT_FROM_SCENE: string;
        /**
         * 当拥有Renderer的Object3D添加到Scene3D或者Renderer添加到场景中的Object3D时派发不冒泡事件
         */
        static ADDED_RENDERER_TO_SCENE: string;
        /**
         * 当拥有Renderer的Object3D从Scene3D中移除或者Renderer从场景中的Object3D移除时派发不冒泡事件
         */
        static REMOVED_RENDERER_FROM_SCENE: string;
        /**
         * 事件数据
         */
        data: IScene3DEventData;
        /**
         * 创建一个作为参数传递给事件侦听器的 Event 对象。
         * @param type 事件的类型，可以作为 Event.type 访问。
         * @param data 携带数据
         * @param bubbles 确定 Event 对象是否参与事件流的冒泡阶段。默认值为 false。
         */
        constructor(type: string, data?: IScene3DEventData, bubbles?: boolean);
    }
    /**
     * 3D对象事件数据
     */
    interface IScene3DEventData {
        /**
         * 3d对象
         */
        object3d?: Object3D;
        /**
         * 场景
         */
        scene?: Scene3D;
        /**
         * 灯光
         */
        light?: Light;
        /**
         * 渲染器
         */
        renderer?: MeshRenderer;
    }
}
declare module feng3d {
    /**
     * opengl顶点属性名称
     */
    class GLAttribute {
        /**
         * 坐标
         */
        static a_position: string;
        /**
         * 颜色
         */
        static a_color: string;
        /**
         * 法线
         */
        static a_normal: string;
        /**
         * 切线
         */
        static a_tangent: string;
        /**
         * uv（纹理坐标）
         */
        static a_uv: string;
        /**
         * 关节索引
         */
        static a_jointindex0: string;
        /**
         * 关节权重
         */
        static a_jointweight0: string;
        /**
         * 关节索引
         */
        static a_jointindex1: string;
        /**
         * 关节权重
         */
        static a_jointweight1: string;
    }
}
declare module feng3d {
    /**
     * 几何体
     * @author feng 2016-04-28
     */
    class Geometry extends RenderDataHolder {
        /**
         * 创建一个几何体
         */
        constructor();
        /**
         * 更新顶点索引数据
         */
        setIndices(indices: Uint16Array): void;
        /**
         * 设置顶点属性数据
         * @param vaId          顶点属性编号
         * @param data          顶点属性数据
         * @param stride        顶点数据步长
         */
        setVAData(vaId: string, data: Float32Array, stride: number): void;
        /**
         * 获取顶点属性数据
         * @param vaId 数据类型编号
         * @return 顶点属性数据
         */
        getVAData(vaId: string): AttributeRenderData;
        /**
         * 顶点数量
         */
        readonly numVertex: number;
        /**
         * 附加几何体
         */
        addGeometry(geometry: Geometry): void;
        /**
         * 克隆一个几何体
         */
        clone(): Geometry;
        /**
         * 从一个几何体中克隆数据
         */
        cloneFrom(geometry: Geometry): void;
    }
}
declare module feng3d {
    /**
     * 几何体事件
     * @author feng 2015-12-8
     */
    class GeometryEvent extends Event {
        /**
         * 获取几何体顶点数据
         */
        static GET_VA_DATA: string;
        /**
         * 改变几何体顶点数据事件
         */
        static CHANGED_VA_DATA: string;
        /**
         * 改变顶点索引数据事件
         */
        static CHANGED_INDEX_DATA: string;
        /**
         * 事件目标
         */
        target: Geometry;
        /**
         * 构建几何体事件
         */
        constructor(type: string, data?: any, bubbles?: boolean);
    }
}
declare module feng3d {
    /**
     * 点几何体
     * @author feng 2017-01-11
     */
    class PointGeometry extends Geometry {
        /**
         * 几何体是否变脏
         */
        private geometryDirty;
        private _points;
        constructor();
        /**
         * 添加点
         * @param point		点数据
         */
        addPoint(point: PointInfo, needUpdateGeometry?: boolean): void;
        /**
         * 更新几何体
         */
        updateGeometry(): void;
        /**
         * 获取线段数据
         * @param index 		线段索引
         * @return				线段数据
         */
        getPoint(index: number): PointInfo;
        /**
         * 移除所有线段
         */
        removeAllPoints(): void;
        /**
         * 线段列表
         */
        readonly points: PointInfo[];
    }
    /**
     * 点信息
     * @author feng 2016-10-16
     */
    class PointInfo {
        position: Vector3D;
        /**
         * 创建点
         * @param position 坐标
         */
        constructor(position: Vector3D);
        /**
         * 坐标
         */
        readonly positionData: number[];
    }
}
declare module feng3d {
    /**
     * 粒子几何体
     * @author feng 2016-04-28
     */
    class ParticleGeometry extends Geometry {
        /**
         * 粒子数量
         */
        private _numParticle;
        /**
         * 单个粒子几何体
         */
        elementGeometry: Geometry;
        private isDirty;
        constructor();
        /**
         * 粒子数量
         */
        numParticle: number;
        /**
         * 更新渲染数据
         */
        updateRenderData(renderContext: RenderContext): void;
    }
}
declare module feng3d {
    /**
     * 线段组件
     * @author feng 2016-10-16
     */
    class SegmentGeometry extends Geometry {
        /**
         * 几何体是否变脏
         */
        private geometryDirty;
        private _segments;
        /**
         * 添加线段
         * @param segment		线段数据
         */
        addSegment(segment: Segment, needUpdateGeometry?: boolean): void;
        /**
         * 更新几何体
         */
        updateGeometry(): void;
        /**
         * 获取线段数据
         * @param index 		线段索引
         * @return				线段数据
         */
        getSegment(index: number): Segment;
        /**
         * 移除所有线段
         */
        removeAllSegments(): void;
        /**
         * 线段列表
         */
        readonly segments: Segment[];
    }
    /**
     * 线段
     * @author feng 2016-10-16
     */
    class Segment {
        thickness: number;
        start: Vector3D;
        end: Vector3D;
        startColor: Color;
        endColor: Color;
        /**
         * 创建线段
         * @param start 起点坐标
         * @param end 终点坐标
         * @param colorStart 起点颜色
         * @param colorEnd 终点颜色
         * @param thickness 线段厚度
         */
        constructor(start: Vector3D, end: Vector3D, colorStart?: number, colorEnd?: number, thickness?: number);
        /**
         * 坐标数据
         */
        readonly positionData: number[];
        /**
         * 颜色数据
         */
        readonly colorData: number[];
    }
}
declare module feng3d {
    /**
     * 几何体组件
     * @author feng 2016-10-16
     */
    class GeometryComponent extends Component {
        /**
         * 父组件
         */
        protected _parentComponent: Geometry;
        /**
         * 所属对象
         */
        readonly geometry: Geometry;
        /**
         * 构建几何体组件
         */
        constructor();
    }
}
declare module feng3d {
    /**
     * 镜头事件
     * @author feng 2014-10-14
     */
    class LensEvent extends Event {
        static MATRIX_CHANGED: string;
        /**
         * 镜头
         */
        data: LensBase;
        /**
         * 创建一个镜头事件。
         * @param type      事件的类型
         * @param lens      镜头
         * @param bubbles   确定 Event 对象是否参与事件流的冒泡阶段。默认值为 false。
         */
        constructor(type: string, lens?: LensBase, bubbles?: boolean);
    }
}
declare module feng3d {
    /**
     * 坐标系统类型
     * @author feng 2014-10-14
     */
    class CoordinateSystem {
        /**
         * 默认坐标系统，左手坐标系统
         */
        static LEFT_HANDED: number;
        /**
         * 右手坐标系统
         */
        static RIGHT_HANDED: number;
    }
}
declare module feng3d {
    /**
     * 摄像机镜头
     * @author feng 2014-10-14
     */
    abstract class LensBase extends Component {
        protected _matrix: Matrix3D;
        protected _scissorRect: Rectangle;
        protected _viewPort: Rectangle;
        protected _near: number;
        protected _far: number;
        protected _aspectRatio: number;
        protected _matrixInvalid: boolean;
        private _unprojection;
        private _unprojectionInvalid;
        /**
         * 创建一个摄像机镜头
         */
        constructor();
        /**
         * 投影矩阵
         */
        matrix: Matrix3D;
        /**
         * 最近距离
         */
        near: number;
        /**
         * 最远距离
         */
        far: number;
        /**
         * 视窗缩放比例(width/height)，在渲染器中设置
         */
        aspectRatio: number;
        /**
         * 场景坐标投影到屏幕坐标
         * @param point3d 场景坐标
         * @param v 屏幕坐标（输出）
         * @return 屏幕坐标
         */
        project(point3d: Vector3D, v?: Vector3D): Vector3D;
        /**
         * 投影逆矩阵
         */
        readonly unprojectionMatrix: Matrix3D;
        /**
         * 屏幕坐标投影到摄像机空间坐标
         * @param nX 屏幕坐标X -1（左） -> 1（右）
         * @param nY 屏幕坐标Y -1（上） -> 1（下）
         * @param sZ 到屏幕的距离
         * @param v 场景坐标（输出）
         * @return 场景坐标
         */
        abstract unproject(nX: number, nY: number, sZ: number, v: Vector3D): Vector3D;
        /**
         * 投影矩阵失效
         */
        protected invalidateMatrix(): void;
        /**
         * 更新投影矩阵
         */
        protected abstract updateMatrix(): any;
    }
}
declare module feng3d {
    /**
     * 透视摄像机镜头
     * @author feng 2014-10-14
     */
    class PerspectiveLens extends LensBase {
        private _fieldOfView;
        private _focalLength;
        private _focalLengthInv;
        private _yMax;
        private _xMax;
        private _coordinateSystem;
        /**
         * 创建一个透视摄像机镜头
         * @param fieldOfView 视野
         * @param coordinateSystem 坐标系统类型
         */
        constructor(fieldOfView?: number, coordinateSystem?: number);
        /**
         * 视野
         */
        fieldOfView: number;
        /**
         * 焦距
         */
        focalLength: number;
        unproject(nX: number, nY: number, sZ: number, v?: Vector3D): Vector3D;
        /**
         * 坐标系类型
         */
        coordinateSystem: number;
        /**
         * 更新投影矩阵
         */
        protected updateMatrix(): void;
    }
}
declare module feng3d {
    /**
     * 摄像机
     * @author feng 2016-08-16
     */
    class Camera3D extends Object3DComponent {
        private _viewProjection;
        private _viewProjectionDirty;
        private _lens;
        /**
         * 创建一个摄像机
         * @param lens 摄像机镜头
         */
        constructor(lens?: LensBase);
        /**
         * 镜头
         */
        readonly lens: LensBase;
        /**
         * 场景投影矩阵，世界空间转投影空间
         */
        readonly viewProjection: Matrix3D;
        /**
         * 处理被添加组件事件
         */
        protected onBeAddedComponent(event: ComponentEvent): void;
        /**
         * 处理被移除组件事件
         */
        protected onBeRemovedComponent(event: ComponentEvent): void;
        /**
         * 处理镜头变化事件
         */
        private onLensMatrixChanged(event);
        private onSpaceTransformChanged(event);
        /**
         * 更新渲染数据
         */
        updateRenderData(renderContext: RenderContext): void;
    }
}
declare module feng3d {
    /**
     * 3D基元类型
     * @author feng 2016-05-01
     */
    enum PrimitiveType {
        /**
         * 平面
         */
        Plane = 0,
        /**
         * 立方体
         */
        Cube = 1,
        /**
         * 球体
         */
        Sphere = 2,
        /**
         * 胶囊
         */
        Capsule = 3,
        /**
         * 圆柱体
         */
        Cylinder = 4,
    }
}
declare module feng3d {
    /**
     * 立方体几何体
     * @author feng 2016-09-12
     */
    class PlaneGeometry extends Geometry {
        /**
         * 创建平面几何体
         * @param width 宽度
         * @param height 高度
         * @param segmentsW 横向分割数
         * @param segmentsH 纵向分割数
         * @param yUp 正面朝向 true:Y+ false:Z+
         */
        constructor(width?: number, height?: number, segmentsW?: number, segmentsH?: number, yUp?: boolean);
        /**
         * 构建顶点坐标
         * @param width 宽度
         * @param height 高度
         * @param segmentsW 横向分割数
         * @param segmentsH 纵向分割数
         * @param yUp 正面朝向 true:Y+ false:Z+
         */
        private buildPosition(width?, height?, segmentsW?, segmentsH?, yUp?);
        /**
         * 构建顶点法线
         * @param segmentsW 横向分割数
         * @param segmentsH 纵向分割数
         * @param yUp 正面朝向 true:Y+ false:Z+
         */
        private buildNormal(segmentsW?, segmentsH?, yUp?);
        /**
         * 构建顶点切线
         * @param segmentsW 横向分割数
         * @param segmentsH 纵向分割数
         * @param yUp 正面朝向 true:Y+ false:Z+
         */
        private buildTangent(segmentsW?, segmentsH?, yUp?);
        /**
         * 构建顶点索引
         * @param segmentsW 横向分割数
         * @param segmentsH 纵向分割数
         * @param yUp 正面朝向 true:Y+ false:Z+
         */
        private buildIndices(segmentsW?, segmentsH?, yUp?);
        /**
         * 构建uv
         * @param segmentsW 横向分割数
         * @param segmentsH 纵向分割数
         */
        private buildUVs(segmentsW?, segmentsH?);
    }
}
declare module feng3d {
    /**
     * 立方体几何体
     * @author feng 2016-09-12
     */
    class CubeGeometry extends Geometry {
        /**
         * 创建立方几何体
         * @param   width           宽度
         * @param   height          高度
         * @param   depth           深度
         * @param   segmentsW       宽度方向分割
         * @param   segmentsH       高度方向分割
         * @param   segmentsD       深度方向分割
         * @param   tile6           是否为6块贴图
         */
        constructor(width?: number, height?: number, depth?: number, segmentsW?: number, segmentsH?: number, segmentsD?: number, tile6?: boolean);
        /**
         * 构建坐标
         * @param   width           宽度
         * @param   height          高度
         * @param   depth           深度
         * @param   segmentsW       宽度方向分割
         * @param   segmentsH       高度方向分割
         * @param   segmentsD       深度方向分割
         */
        private buildPosition(width?, height?, depth?, segmentsW?, segmentsH?, segmentsD?);
        /**
         * 构建法线
         * @param   segmentsW       宽度方向分割
         * @param   segmentsH       高度方向分割
         * @param   segmentsD       深度方向分割
         */
        private buildNormal(segmentsW?, segmentsH?, segmentsD?);
        /**
         * 构建切线
         * @param   segmentsW       宽度方向分割
         * @param   segmentsH       高度方向分割
         * @param   segmentsD       深度方向分割
         */
        private buildTangent(segmentsW?, segmentsH?, segmentsD?);
        /**
         * 构建索引
         * @param   segmentsW       宽度方向分割
         * @param   segmentsH       高度方向分割
         * @param   segmentsD       深度方向分割
         */
        private buildIndices(segmentsW?, segmentsH?, segmentsD?);
        /**
         * 构建uv
         * @param   segmentsW       宽度方向分割
         * @param   segmentsH       高度方向分割
         * @param   segmentsD       深度方向分割
         * @param   tile6           是否为6块贴图
         */
        private buildUVs(segmentsW?, segmentsH?, segmentsD?, tile6?);
    }
}
declare module feng3d {
    /**
     * 球体几何体
     * @author DawnKing 2016-09-12
     */
    class SphereGeometry extends Geometry {
        /**
         * 创建球形几何体
         * @param radius 球体半径
         * @param segmentsW 横向分割数
         * @param segmentsH 纵向分割数
         * @param yUp 正面朝向 true:Y+ false:Z+
         */
        constructor(radius?: number, segmentsW?: number, segmentsH?: number, yUp?: boolean);
        /**
         * 构建几何体数据
         * @param radius 球体半径
         * @param segmentsW 横向分割数
         * @param segmentsH 纵向分割数
         * @param yUp 正面朝向 true:Y+ false:Z+
         */
        private buildGeometry(radius?, segmentsW?, segmentsH?, yUp?);
        /**
         * 构建顶点索引
         * @param segmentsW 横向分割数
         * @param segmentsH 纵向分割数
         * @param yUp 正面朝向 true:Y+ false:Z+
         */
        private buildIndices(segmentsW?, segmentsH?, yUp?);
        /**
         * 构建uv
         * @param segmentsW 横向分割数
         * @param segmentsH 纵向分割数
         */
        private buildUVs(segmentsW?, segmentsH?);
    }
}
declare module feng3d {
    /**
     * 胶囊体几何体
     * @author DawnKing 2016-09-12
     */
    class CapsuleGeometry extends Geometry {
        /**
         * 创建胶囊几何体
         * @param radius 胶囊体半径
         * @param height 胶囊体高度
         * @param segmentsW 横向分割数
         * @param segmentsH 纵向分割数
         * @param yUp 正面朝向 true:Y+ false:Z+
         */
        constructor(radius?: number, height?: number, segmentsW?: number, segmentsH?: number, yUp?: boolean);
        /**
         * 构建几何体数据
         * @param radius 胶囊体半径
         * @param height 胶囊体高度
         * @param segmentsW 横向分割数
         * @param segmentsH 纵向分割数
         * @param yUp 正面朝向 true:Y+ false:Z+
         */
        private buildGeometry(radius?, height?, segmentsW?, segmentsH?, yUp?);
        /**
         * 构建顶点索引
         * @param segmentsW 横向分割数
         * @param segmentsH 纵向分割数
         * @param yUp 正面朝向 true:Y+ false:Z+
         */
        buildIndices(segmentsW?: number, segmentsH?: number, yUp?: boolean): void;
        /**
         * 构建uv
         * @param segmentsW 横向分割数
         * @param segmentsH 纵向分割数
         */
        private buildUVs(segmentsW?, segmentsH?);
    }
}
declare module feng3d {
    /**
     * 圆柱体几何体
     * @author DawnKing 2016-09-12
     */
    class CylinderGeometry extends Geometry {
        /**
         * 创建圆柱体
         */
        constructor(topRadius?: number, bottomRadius?: number, height?: number, segmentsW?: number, segmentsH?: number, topClosed?: boolean, bottomClosed?: boolean, surfaceClosed?: boolean, yUp?: boolean);
        /**
         * 计算几何体顶点数
         */
        private getNumVertices(segmentsW, segmentsH, surfaceClosed, topClosed, bottomClosed);
        /**
         * 计算几何体三角形数量
         */
        private getNumTriangles(segmentsW, segmentsH, surfaceClosed, topClosed, bottomClosed);
        /**
         * 构建几何体数据
         */
        private buildGeometry(topRadius?, bottomRadius?, height?, segmentsW?, segmentsH?, topClosed?, bottomClosed?, surfaceClosed?, yUp?);
        /**
         * 构建顶点索引
         * @param segmentsW 横向分割数
         * @param segmentsH 纵向分割数
         * @param yUp 正面朝向 true:Y+ false:Z+
         */
        private buildIndices(topRadius?, bottomRadius?, height?, segmentsW?, segmentsH?, topClosed?, bottomClosed?, surfaceClosed?);
        /**
         * 构建uv
         * @param segmentsW 横向分割数
         * @param segmentsH 纵向分割数
         */
        private buildUVs(segmentsW, segmentsH, surfaceClosed, topClosed, bottomClosed);
    }
}
declare module feng3d {
    /**
     * 圆锥体
     * @author feng 2017-02-07
     */
    class ConeGeometry extends CylinderGeometry {
        /**
         * 创建圆锥体
         * @param radius 底部半径
         * @param height 高度
         * @param segmentsW
         * @param segmentsH
         * @param yUp
         */
        constructor(radius?: number, height?: number, segmentsW?: number, segmentsH?: number, closed?: boolean, yUp?: boolean);
    }
}
declare module feng3d {
    /**
     * 天空盒几何体
     * @author feng 2016-09-12
     */
    class SkyBoxGeometry extends Geometry {
        /**
         * 创建天空盒
         */
        constructor();
    }
}
declare module feng3d {
    /**
     * 纹理信息
     * @author feng 2016-12-20
     */
    class TextureInfo {
        /**
         * 纹理类型
         */
        textureType: number;
        /**
         * 内部格式
         */
        internalformat: number;
        /**
         * 格式
         */
        format: number;
        /**
         * 数据类型
         */
        type: number;
        /**
         * 是否生成mipmap
         */
        generateMipmap: boolean;
        /**
         * 图片y轴向
         */
        flipY: number;
        minFilter: number;
        magFilter: number;
        wrapS: number;
        wrapT: number;
        /**
         * 图片数据
         */
        pixels: HTMLImageElement | HTMLImageElement[];
    }
}
declare module feng3d {
    /**
     * 2D纹理
     * @author feng 2016-12-20
     */
    class Texture2D extends TextureInfo {
        pixels: HTMLImageElement;
        constructor(pixels: HTMLImageElement);
    }
}
declare module feng3d {
    /**
     * 立方体纹理
     * @author feng 2016-12-28
     */
    class TextureCube extends TextureInfo {
        pixels: HTMLImageElement[];
        constructor(images: HTMLImageElement[]);
    }
}
declare module feng3d {
    /**
     * 材质
     * @author feng 2016-05-02
     */
    class Material extends RenderDataHolder {
        /**
        * 渲染模式
        */
        protected renderMode: RenderMode;
        /**
         * 着色器名称
         */
        protected shaderName: string;
        /**
         * 构建材质
         */
        constructor();
        /**
         * 更新渲染数据
         */
        updateRenderData(renderContext: RenderContext): void;
    }
}
declare module feng3d {
    /**
     * 颜色材质
     * @author feng 2017-01-11
     */
    class PointMaterial extends Material {
        pointSize: number;
        /**
         * 构建颜色材质
         */
        constructor();
        /**
         * 更新渲染数据
         */
        updateRenderData(renderContext: RenderContext): void;
    }
}
declare module feng3d {
    /**
     * 颜色材质
     * @author feng 2016-05-02
     */
    class ColorMaterial extends Material {
        /**
         * 颜色
         */
        color: Color;
        /**
         * 构建颜色材质
         * @param color 颜色
         * @param alpha 透明的
         */
        constructor(color?: Color);
        /**
         * 更新渲染数据
         */
        updateRenderData(renderContext: RenderContext): void;
    }
}
declare module feng3d {
    /**
     * 线段材质
     * @author feng 2016-10-15
     */
    class SegmentMaterial extends Material {
        /**
         * 构建线段材质
         */
        constructor();
    }
}
declare module feng3d {
    /**
     * 材质组件
     * @author feng 2016-11-01
     */
    class MaterialComponent extends Component {
        /**
         * 父组件
         */
        protected _parentComponent: Material;
        /**
         * 所属对象
         */
        readonly material: Material;
        /**
         * 构建材质组件
         */
        constructor();
    }
}
declare module feng3d {
    /**
     * 纹理材质
     * @author feng 2016-12-23
     */
    class TextureMaterial extends Material {
        /**
         * 纹理数据
         */
        texture: Texture2D;
        constructor();
        /**
         * 更新渲染数据
         */
        updateRenderData(renderContext: RenderContext): void;
    }
}
declare module feng3d {
    /**
     * 天空盒材质
     * @author feng 2016-12-20
     */
    class SkyBoxMaterial extends Material {
        skyBoxTextureCube: TextureCube;
        private skyBoxSize;
        constructor(images: HTMLImageElement[]);
        /**
         * 更新渲染数据
         */
        updateRenderData(renderContext: RenderContext): void;
    }
}
declare module feng3d {
    /**
     * 标准材质
     * @author feng 2016-05-02
     * @see 物理渲染-基于物理的光照模型 http://blog.csdn.net/leonwei/article/details/44539217
     */
    class StandardMaterial extends Material {
        difuseTexture: Texture2D;
        /**
         * 基本颜色
         */
        baseColor: Color;
        /**
         * 环境颜色
         */
        ambientColor: Color;
        /**
         * 反射率
         */
        reflectance: number;
        /**
         * 粗糙度
         */
        roughness: number;
        /**
         * 金属度
         */
        metalic: number;
        /**
         * 构建
         */
        constructor();
        /**
         * 更新渲染数据
         */
        updateRenderData(renderContext: RenderContext): void;
    }
}
declare module feng3d {
    /**
     * 粒子材质（为了使用独立的着色器，暂时设置粒子材质）
     * @author feng 2017-01-09
     */
    class ParticleMaterial extends Material {
        constructor();
    }
}
declare module feng3d {
    /**
     * 粒子材质（为了使用独立的着色器，暂时设置粒子材质）
     * @author feng 2017-01-09
     */
    class SkeletonAnimatorMaterial extends Material {
        /**
         * 纹理数据
         */
        texture: Texture2D;
        constructor();
        /**
         * 更新渲染数据
         */
        updateRenderData(renderContext: RenderContext): void;
    }
}
declare module feng3d {
    /**
     * 灯光类型
     * @author feng 2016-12-12
     */
    enum LightType {
        /**
         * 点光
         */
        Point = 0,
        /**
         * 方向光
         */
        Directional = 1,
        /**
         * 聚光灯
         */
        Spot = 2,
    }
}
declare module feng3d {
    /**
     * 灯光
     * @author feng 2016-12-12
     */
    class Light extends Object3DComponent {
        /**
         * 灯光类型
         */
        type: LightType;
        /**
         * 颜色
         */
        color: Color;
        /**
         * 光照强度
         */
        intensity: number;
        /**
         * 灯光位置
         */
        readonly position: Vector3D;
        /**
         * 处理被添加组件事件
         */
        protected onBeAddedComponent(event: ComponentEvent): void;
        /**
         * 处理被移除组件事件
         */
        protected onBeRemovedComponent(event: ComponentEvent): void;
        /**
         * 处理添加到场景事件
         */
        private onAddedToScene(event);
        /**
         * 处理从场景移除事件
         */
        private onRemovedFromScene(event);
    }
}
declare module feng3d {
    /**
     * 方向光源
     * @author feng 2016-12-13
     */
    class DirectionalLight extends Light {
        /**
         * 构建
         */
        constructor();
    }
}
declare module feng3d {
    /**
     * 点光源
     * @author feng 2016-12-13
     */
    class PointLight extends Light {
        /**
         * 最小半径
         */
        radius: number;
        /**
         * 可照射最大距离
         */
        fallOff: number;
        /**
         * 构建
         */
        constructor();
    }
}
declare module feng3d {
    class ControllerBase {
        /**
         * 控制对象
         */
        protected _target: Transform;
        /**
         * 控制器基类，用于动态调整3D对象的属性
         */
        constructor(target: Transform);
        /**
         * 手动应用更新到目标3D对象
         */
        update(interpolate?: boolean): void;
        target: Transform;
    }
}
declare module feng3d {
    class LookAtController extends ControllerBase {
        protected _lookAtPosition: Vector3D;
        protected _lookAtObject: Transform;
        protected _origin: Vector3D;
        protected _upAxis: Vector3D;
        private _pos;
        constructor(target?: Transform, lookAtObject?: Transform);
        upAxis: Vector3D;
        lookAtPosition: Vector3D;
        lookAtObject: Transform;
        update(interpolate?: boolean): void;
    }
}
declare module feng3d {
    /**
     * FPS模式控制器
     * @author feng 2016-12-19
     */
    class FPSController extends ControllerBase {
        /**
         * 按键记录
         */
        private keyDownDic;
        /**
         * 按键方向字典
         */
        private keyDirectionDic;
        /**
         * 加速度
         */
        private acceleration;
        /**
         * 速度
         */
        private velocity;
        /**
         * 上次鼠标位置
         */
        private preMousePoint;
        constructor(transform?: Transform);
        target: Transform;
        /**
         * 初始化
         */
        private init();
        /**
         * 手动应用更新到目标3D对象
         */
        update(interpolate?: boolean): void;
        /**
         * 处理鼠标移动事件
         */
        private onMouseMove(event);
        /**
         * 键盘按下事件
         */
        private onKeydown(event);
        /**
         * 键盘弹起事件
         */
        private onKeyup(event);
        /**
         * 停止xyz方向运动
         * @param direction     停止运动的方向
         */
        private stopDirectionVelocity(direction);
    }
}
declare module feng3d {
    /**
     * 地形几何体
     * @author feng 2016-04-28
     */
    class TerrainGeometry extends Geometry {
        private _segmentsW;
        private _segmentsH;
        private _width;
        private _height;
        private _depth;
        private _heightMap;
        private _minElevation;
        private _maxElevation;
        protected _geomDirty: boolean;
        protected _uvDirty: boolean;
        /**
         * 创建高度地形 拥有segmentsW*segmentsH个顶点
         * @param    heightMap	高度图
         * @param    width	地形宽度
         * @param    height	地形高度
         * @param    depth	地形深度
         * @param    segmentsW	x轴上网格段数
         * @param    segmentsH	y轴上网格段数
         * @param    maxElevation	最大地形高度
         * @param    minElevation	最小地形高度
         */
        constructor(heightMap: ImageData, width?: number, height?: number, depth?: number, segmentsW?: number, segmentsH?: number, maxElevation?: number, minElevation?: number);
        /**
         * 创建顶点坐标
         */
        private buildGeometry();
        /**
         * 创建uv坐标
         */
        private buildUVs();
        /**
         * 获取位置在（x，z）处的高度y值
         * @param x x坐标
         * @param z z坐标
         * @return 高度
         */
        getHeightAt(x: number, z: number): number;
        /**
         * 获取像素值
         */
        private getPixel(imageData, u, v);
    }
}
declare module feng3d {
    /**
     * 地形材质
     * @author feng 2016-04-28
     */
    class TerrainMaterial extends Material {
        diffuseTexture: Texture2D;
        splatTexture1: Texture2D;
        splatTexture2: Texture2D;
        splatTexture3: Texture2D;
        blendTexture: Texture2D;
        splatRepeats: Vector3D;
        /**
         * 构建材质
         */
        constructor();
        /**
         * 更新渲染数据
         */
        updateRenderData(renderContext: RenderContext): void;
    }
}
declare module feng3d {
    /**
     * 动画状态基类
     * @author feng 2015-9-18
     */
    class AnimationStateBase {
        protected _animationNode: AnimationNodeBase;
        protected _rootDelta: Vector3D;
        protected _positionDeltaDirty: boolean;
        protected _time: number;
        protected _startTime: number;
        protected _animator: AnimatorBase;
        /**
         * @inheritDoc
         */
        readonly positionDelta: Vector3D;
        /**
         * 创建动画状态基类
         * @param animator				动画
         * @param animationNode			动画节点
         */
        constructor(animator: AnimatorBase, animationNode: AnimationNodeBase);
        /**
         * @inheritDoc
         */
        offset(startTime: number): void;
        /**
         * @inheritDoc
         */
        update(time: number): void;
        /**
         * @inheritDoc
         */
        phase(value: number): void;
        /**
         * 更新时间
         * @param time		当前时间
         */
        protected updateTime(time: number): void;
        /**
         * 位置偏移
         */
        protected updatePositionDelta(): void;
    }
}
declare module feng3d {
    /**
     * 动画剪辑状态
     * @author feng 2015-9-18
     */
    class AnimationClipState extends AnimationStateBase {
        private _animationClipNode;
        protected _blendWeight: number;
        protected _currentFrame: number;
        protected _nextFrame: number;
        protected _oldFrame: number;
        protected _timeDir: number;
        protected _framesDirty: boolean;
        /**
         * 混合权重	(0[当前帧],1[下一帧])
         * @see #currentFrame
         * @see #nextFrame
         */
        readonly blendWeight: number;
        /**
         * 当前帧
         */
        readonly currentFrame: number;
        /**
         * 下一帧
         */
        readonly nextFrame: number;
        /**
         * 创建一个帧动画状态
         * @param animator				动画
         * @param animationClipNode		帧动画节点
         */
        constructor(animator: AnimatorBase, animationClipNode: AnimationClipNodeBase);
        /**
         * @inheritDoc
         */
        update(time: number): void;
        /**
         * @inheritDoc
         */
        phase(value: number): void;
        /**
         * @inheritDoc
         */
        protected updateTime(time: number): void;
        /**
         * 更新帧，计算当前帧、下一帧与混合权重
         *
         * @see #currentFrame
         * @see #nextFrame
         * @see #blendWeight
         */
        protected updateFrames(): void;
        /**
         * 通知播放完成
         */
        private notifyPlaybackComplete();
    }
}
declare module feng3d {
    /**
     * 粒子
     * 粒子系统会自动在shader中匹配一个"a_particle_${attribute}"顶点属性,并且属性值不为空时会自动添加 "#define D_a_particle_${attribute}"
     * 例如：position 对应 a_particle_position 与 #define D_a_particle_position
     * @author feng 2017-01-12
     */
    interface Particle {
        /**
         * 索引
         */
        index: number;
        /**
         * 粒子总数量
         */
        total: number;
        /**
         * 出生时间
         */
        birthTime: number;
        /**
         * 寿命
         */
        lifetime: number;
        /**
         * 位移
         */
        position: Vector3D;
        /**
         * 旋转
         */
        rotation: Vector3D;
        /**
         * 缩放
         */
        scale: Vector3D;
        /**
         * 速度
         */
        velocity: Vector3D;
        /**
         * 加速度
         */
        acceleration: Vector3D;
        /**
         * 颜色
         */
        color: Color;
    }
}
declare module feng3d {
    /**
     * 粒子
     * 粒子系统会自动在shader中匹配一个"a_particle_${attribute}"顶点属性,并且属性值不为空时会自动添加 "#define D_a_particle_${attribute}"
     * 例如：position 对应 a_particle_position 与 #define D_a_particle_position
     * @author feng 2017-01-12
     */
    interface ParticleGlobal {
        /**
         * 加速度
         */
        acceleration: Vector3D;
    }
}
declare module feng3d {
    /**
     * 粒子动画
     * @author feng 2017-01-09
     */
    class ParticleAnimator extends Object3DComponent {
        /**
         * 是否正在播放
         */
        isPlaying: boolean;
        /**
         * 粒子时间
         */
        time: number;
        /**
         * 起始时间
         */
        startTime: number;
        /**
         * 播放速度
         */
        playbackSpeed: number;
        /**
         * 粒子数量
         */
        numParticles: number;
        /**
         * 周期
         */
        cycle: number;
        private isDirty;
        /**
         * 生成粒子函数列表，优先级越高先执行
         */
        generateFunctions: ({
            generate: (particle: Particle) => void;
            priority: number;
        })[];
        /**
         * 粒子全局属性，作用于所有粒子元素
         */
        particleGlobal: ParticleGlobal;
        private autoRenderDataHolder;
        constructor();
        /**
         * 生成粒子
         */
        private generateParticles();
        /**
         * 更新渲染数据
         */
        updateRenderData(renderContext: RenderContext): void;
    }
}
declare module feng3d {
    /**
     * 粒子动画组件
     * @author feng 2017-01-09
     */
    class ParticleComponent extends RenderDataHolder {
        /**
         * 优先级
         */
        priority: number;
        /**
         * 创建粒子属性
         * @param particle                  粒子
         */
        generateParticle(particle: Particle): void;
    }
}
declare module feng3d {
    /**
     * 粒子发射器
     * @author feng 2017-01-09
     */
    class ParticleEmission extends ParticleComponent {
        /**
         * 发射率，每秒发射粒子数量
         */
        rate: number;
        /**
         * 爆发，在time时刻额外喷射particles粒子
         */
        bursts: {
            time: number;
            particles: number;
        }[];
        isDirty: boolean;
        private numParticles;
        private birthTimes;
        constructor();
        /**
         * 创建粒子属性
         * @param particle                  粒子
         */
        generateParticle(particle: Particle): void;
        /**
         * 获取出生时间数组
         */
        private getBirthTimeArray(numParticles);
    }
}
declare module feng3d {
    /**
     * 粒子速度组件
     * @author feng 2017-01-09
     */
    class ParticlePosition extends ParticleComponent {
        /**
         * 创建粒子属性
         * @param particle                  粒子
         */
        generateParticle(particle: Particle): void;
    }
}
declare module feng3d {
    /**
     * 粒子速度组件
     * @author feng 2017-01-09
     */
    class ParticleVelocity extends ParticleComponent {
        /**
         * 创建粒子属性
         * @param particle                  粒子
         */
        generateParticle(particle: Particle): void;
    }
}
declare module feng3d {
    /**
     * Dispatched to notify changes in an animation state's state.
     */
    class AnimationStateEvent extends Event {
        /**
         * Dispatched when a non-looping clip node inside an animation state reaches the end of its timeline.
         */
        static PLAYBACK_COMPLETE: string;
        static TRANSITION_COMPLETE: string;
        private _animator;
        private _animationState;
        private _animationNode;
        /**
         * Create a new <code>AnimatonStateEvent</code>
         *
         * @param type The event type.
         * @param animator The animation state object that is the subject of this event.
         * @param animationNode The animation node inside the animation state from which the event originated.
         */
        constructor(type: string, animator: AnimatorBase, animationState: AnimationStateBase, animationNode: AnimationNodeBase);
        /**
         * The animator object that is the subject of this event.
         */
        readonly animator: AnimatorBase;
        /**
         * The animation state object that is the subject of this event.
         */
        readonly animationState: AnimationStateBase;
        /**
         * The animation node inside the animation state from which the event originated.
         */
        readonly animationNode: AnimationNodeBase;
        /**
         * Clones the event.
         *
         * @return An exact duplicate of the current object.
         */
        clone(): Event;
    }
}
declare module feng3d {
    /**
     * 动画事件
     * @author feng 2014-5-27
     */
    class AnimatorEvent extends Event {
        /** 开始播放动画 */
        static START: string;
        /** 继续播放动画 */
        static PLAY: string;
        /** 停止播放动画 */
        static STOP: string;
        /**
         * 创建一个动画时间
         * @param type			事件类型
         * @param data			事件数据
         * @param bubbles		是否冒泡
         */
        constructor(type: string, data?: any, bubbles?: boolean);
    }
}
declare module feng3d {
    /**
     * 动画节点基类
     * @author feng 2014-5-20
     */
    class AnimationNodeBase extends Component {
        protected _stateClass: any;
        /**
         * 状态类
         */
        readonly stateClass: any;
        /**
         * 创建一个动画节点基类
         */
        constructor();
    }
}
declare module feng3d {
    /**
     * 动画基类
     * @author feng 2014-5-27
     */
    abstract class AnimatorBase extends RenderDataHolder {
        /** 是否正在播放动画 */
        private _isPlaying;
        private _autoUpdate;
        private _time;
        /** 播放速度 */
        private _playbackSpeed;
        protected _activeNode: AnimationNodeBase;
        protected _activeState: AnimationStateBase;
        /** 当前动画时间 */
        protected _absoluteTime: number;
        private _animationStates;
        /**
         * 是否更新位置
         */
        updatePosition: boolean;
        /**
         * 创建一个动画基类
         */
        constructor();
        /**
         * 获取动画状态
         * @param node		动画节点
         * @return			动画状态
         */
        getAnimationState(node: AnimationNodeBase): AnimationStateBase;
        /**
         * 动画时间
         */
        time: number;
        /**
         * The amount by which passed time should be scaled. Used to slow down or speed up animations. Defaults to 1.
         */
        /**
         * 播放速度
         * <p>默认为1，表示正常速度</p>
         */
        playbackSpeed: number;
        /**
         * 开始动画，当自动更新为true时有效
         * @see #autoUpdate
         */
        start(): void;
        /**
         * 暂停播放动画
         * @see #time
         * @see #update()
         */
        stop(): void;
        /**
         * 更新动画
         * @param time			动画时间
         *
         * @see #stop()
         * @see #autoUpdate
         */
        update(time: number): void;
        /**
         * 更新偏移时间
         * @private
         */
        protected updateDeltaTime(dt: number): void;
        /**
         * 自动更新动画时帧更新事件
         */
        private onEnterFrame(event?);
        /**
         * 应用位置偏移量
         */
        private applyPositionDelta();
    }
}
declare module feng3d {
    /**
     * 动画播放器
     * @author feng 2017-01-04
     */
    class AnimationPlayer {
        private _time;
        private preTime;
        private _isPlaying;
        /**
         * 播放速度
         */
        playbackSpeed: number;
        /**
         * 动画时间
         */
        time: number;
        /**
         * 开始
         */
        start(): void;
        /**
         * 停止
         */
        stop(): void;
        /**
         * 继续
         */
        continue(): void;
        /**
         * 暂停
         */
        pause(): void;
        /**
         * 自动更新动画时帧更新事件
         */
        private onEnterFrame(event);
    }
}
declare module feng3d {
    /**
     * 帧动画播放器
     * @author feng 2017-01-04
     */
    class AnimationClipPlayer extends AnimationPlayer {
    }
}
declare module feng3d {
    /**
     * 骨骼关节数据
     * @author feng 2014-5-20
     */
    class SkeletonJoint {
        /** 父关节索引 （-1说明本身是总父节点，这个序号其实就是行号了，譬如上面”origin“节点的序号就是0，无父节点； "body"节点序号是1，父节点序号是0，也就是说父节点是”origin“）*/
        parentIndex: number;
        /** 关节名字 */
        name: string;
        /** 位移 */
        translation: Vector3D;
        /** 旋转 */
        orientation: Quaternion;
        private _matrix3D;
        private _invertMatrix3D;
        readonly matrix3D: Matrix3D;
        readonly invertMatrix3D: Matrix3D;
        readonly inverseBindPose: Float32Array;
        invalid(): void;
    }
}
declare module feng3d {
    /**
     * 骨骼数据
     * @author feng 2014-5-20
     */
    class Skeleton extends Component {
        /** 骨骼关节数据列表 */
        joints: SkeletonJoint[];
        constructor();
        readonly numJoints: number;
    }
}
declare module feng3d {
    /**
     * 骨骼动画
     * @author feng 2014-5-27
     */
    class SkeletonAnimator extends AnimatorBase {
        /** 动画节点列表 */
        animations: AnimationNodeBase[];
        private _globalMatrices;
        private _globalPropertiesDirty;
        /**
         * 骨骼
         */
        skeleton: Skeleton;
        private _activeSkeletonState;
        /**
         * 当前骨骼姿势的全局矩阵
         * @see #globalPose
         */
        readonly globalMatrices: Matrix3D[];
        /**
         * 创建一个骨骼动画类
         */
        constructor(skeleton: Skeleton);
        /**
         * 播放动画
         * @param name 动作名称
         */
        play(): void;
        /**
         * 更新渲染数据
         */
        updateRenderData(renderContext: RenderContext): void;
        /**
         * @inheritDoc
         */
        protected updateDeltaTime(dt: number): void;
        /**
         * 更新骨骼全局变换矩阵
         */
        private updateGlobalProperties();
    }
}
declare module feng3d {
    /**
     * 关节pose
     * @author feng 2014-5-20
     */
    class JointPose {
        /** Joint 名字 */
        name: string;
        /** 父节点序号 */
        parentIndex: number;
        /** 旋转信息 */
        orientation: Quaternion;
        /** 位移信息 */
        translation: Vector3D;
        private _matrix3D;
        private _invertMatrix3D;
        matrix3D: Matrix3D;
        readonly invertMatrix3D: Matrix3D;
        invalid(): void;
    }
}
declare module feng3d {
    /**
     * 骨骼pose
     * @author feng 2014-5-20
     */
    class SkeletonPose {
        /** 关节pose列表 */
        jointPoses: JointPose[];
        private _globalMatrix3Ds;
        readonly numJointPoses: number;
        constructor();
        readonly globalMatrix3Ds: Matrix3D[];
        invalid(): void;
    }
}
declare module feng3d {
    /**
     * 动画剪辑节点基类(用于控制动画播放，包含每帧持续时间，是否循环播放等)
     * @author feng 2014-5-20
     */
    class AnimationClipNodeBase extends AnimationNodeBase {
        protected _looping: boolean;
        protected _totalDuration: number;
        protected _lastFrame: number;
        protected _stitchDirty: boolean;
        protected _stitchFinalFrame: boolean;
        protected _numFrames: number;
        protected _durations: number[];
        protected _totalDelta: Vector3D;
        /** 是否稳定帧率 */
        fixedFrameRate: boolean;
        /**
         * 持续时间列表（ms）
         */
        readonly durations: number[];
        /**
         * 总坐标偏移量
         */
        readonly totalDelta: Vector3D;
        /**
         * 是否循环播放
         */
        looping: boolean;
        /**
         * 是否过渡结束帧
         */
        stitchFinalFrame: boolean;
        /**
         * 总持续时间
         */
        readonly totalDuration: number;
        /**
         * 最后帧数
         */
        readonly lastFrame: number;
        /**
         * 更新动画播放控制状态
         */
        protected updateStitch(): void;
    }
}
declare module feng3d {
    /**
     * 骨骼动画节点（一般用于一个动画的帧列表）
     * 包含基于时间的动画数据作为单独的骨架构成。
     * @author feng 2014-5-20
     */
    class SkeletonClipNode extends AnimationClipNodeBase {
        private _frames;
        /**
         * 创建骨骼动画节点
         */
        constructor();
        /**
         * 骨骼姿势动画帧列表
         */
        readonly frames: SkeletonPose[];
        /**
         * 添加帧到动画
         * @param skeletonPose 骨骼姿势
         * @param duration 持续时间
         */
        addFrame(skeletonPose: SkeletonPose, duration: number): void;
        /**
         * @inheritDoc
         */
        protected updateStitch(): void;
    }
}
declare module feng3d {
    /**
     * 骨骼剪辑状态
     * @author feng 2015-9-18
     */
    class SkeletonClipState extends AnimationClipState {
        private _rootPos;
        private _frames;
        private _skeletonClipNode;
        private _skeletonPose;
        private _skeletonPoseDirty;
        private _currentPose;
        private _nextPose;
        /**
         * 当前骨骼姿势
         */
        readonly currentPose: SkeletonPose;
        /**
         * 下个姿势
         */
        readonly nextPose: SkeletonPose;
        /**
         * 创建骨骼剪辑状态实例
         * @param animator				动画
         * @param skeletonClipNode		骨骼剪辑节点
         */
        constructor(animator: AnimatorBase, skeletonClipNode: SkeletonClipNode);
        /**
         * @inheritDoc
         */
        getSkeletonPose(): SkeletonPose;
        /**
         * @inheritDoc
         */
        protected updateTime(time: number): void;
        /**
         * @inheritDoc
         */
        protected updateFrames(): void;
        /**
         * 更新骨骼姿势
         * @param skeleton 骨骼
         */
        private updateSkeletonPose();
        /**
         * @inheritDoc
         */
        protected updatePositionDelta(): void;
    }
}
declare module feng3d {
    /**
     * 面数据
     */
    type OBJ_Face = {
        /** 顶点索引 */
        vertexIndices: number[];
        /** uv索引 */
        uvIndices?: number[];
        /** 法线索引 */
        normalIndices?: number[];
    };
    /**
     * 子对象
     */
    type OBJ_SubOBJ = {
        /** 材质名称 */
        material?: string;
        /**  */
        g?: string;
        /** 面列表 */
        faces: OBJ_Face[];
    };
    /**
     * 对象
     */
    type OBJ_OBJ = {
        name: string;
        /** 顶点坐标 */
        vertex: number[];
        /** 顶点法线 */
        vn: number[];
        /** 顶点uv */
        vt: number[];
        /** 子对象 */
        subObjs: OBJ_SubOBJ[];
    };
    /**
     * Obj模型数据
     */
    type OBJ_OBJData = {
        /** mtl文件路径 */
        mtl: string;
        /** 模型列表 */
        objs: OBJ_OBJ[];
    };
    /**
     * Obj模型解析器
     * @author feng 2017-01-13
     */
    class OBJParser {
        static parser(context: string): {
            mtl: string;
            objs: {
                name: string;
                vertex: number[];
                vn: number[];
                vt: number[];
                subObjs: {
                    material?: string;
                    g?: string;
                    faces: {
                        vertexIndices: number[];
                        uvIndices?: number[];
                        normalIndices?: number[];
                    }[];
                }[];
            }[];
        };
    }
}
declare module feng3d {
    type Mtl_Material = {
        name: string;
        ka: number[];
        kd: number[];
        ks: number[];
        ns: number;
        ni: number;
        d: number;
        illum: number;
    };
    type Mtl_Mtl = {
        [name: string]: Mtl_Material;
    };
    /**
     * Obj模型Mtl解析器
     * @author feng 2017-01-13
     */
    class MtlParser {
        static parser(context: string): {
            [name: string]: {
                name: string;
                ka: number[];
                kd: number[];
                ks: number[];
                ns: number;
                ni: number;
                d: number;
                illum: number;
            };
        };
    }
}
declare module feng3d {
    /**
     * 关节权重数据
     */
    type MD5_Weight = {
        /** weight 序号 */
        index: number;
        /** 对应的Joint的序号 */
        joint: number;
        /** 作用比例 */
        bias: number;
        /** 位置值 */
        pos: number[];
    };
    type MD5_Vertex = {
        /** 顶点索引 */
        index: number;
        /** 纹理坐标u */
        u: number;
        /** 纹理坐标v */
        v: number;
        /** weight的起始序号 */
        startWeight: number;
        /** weight总数 */
        countWeight: number;
    };
    type MD5_Mesh = {
        shader: string;
        numverts: number;
        verts: MD5_Vertex[];
        numtris: number;
        tris: number[];
        numweights: number;
        weights: MD5_Weight[];
    };
    type MD5_Joint = {
        name: string;
        parentIndex: number;
        position: number[];
        /** 旋转数据 */
        rotation: number[];
    };
    type MD5MeshData = {
        MD5Version: number;
        commandline: string;
        numJoints: number;
        numMeshes: number;
        joints: MD5_Joint[];
        meshs: MD5_Mesh[];
    };
    class MD5MeshParser {
        static parse(context: string): {
            MD5Version: number;
            commandline: string;
            numJoints: number;
            numMeshes: number;
            joints: {
                name: string;
                parentIndex: number;
                position: number[];
                rotation: number[];
            }[];
            meshs: {
                shader: string;
                numverts: number;
                verts: {
                    index: number;
                    u: number;
                    v: number;
                    startWeight: number;
                    countWeight: number;
                }[];
                numtris: number;
                tris: number[];
                numweights: number;
                weights: {
                    index: number;
                    joint: number;
                    bias: number;
                    pos: number[];
                }[];
            }[];
        };
    }
}
declare module feng3d {
    /**
     * 帧数据
     */
    type MD5_Frame = {
        index: number;
        components: number[];
    };
    /**
     * 基础帧数据
     */
    type MD5_BaseFrame = {
        /** 位置 */
        position: number[];
        /** 方向 */
        orientation: number[];
    };
    /**
     * 包围盒信息
     */
    type MD5_Bounds = {
        /** 最小坐标 */
        min: number[];
        /** 最大坐标 */
        max: number[];
    };
    /**
     * 层级数据
     */
    type MD5_HierarchyData = {
        /** Joint 名字 */
        name: string;
        /** 父节点序号 */
        parentIndex: number;
        /** flag */
        flags: number;
        /** 影响的帧数据起始索引 */
        startIndex: number;
    };
    type MD5AnimData = {
        MD5Version: number;
        commandline: string;
        numFrames: number;
        numJoints: number;
        frameRate: number;
        numAnimatedComponents: number;
        hierarchy: MD5_HierarchyData[];
        bounds: MD5_Bounds[];
        baseframe: MD5_BaseFrame[];
        frame: MD5_Frame[];
    };
    class MD5AnimParser {
        static parse(context: string): {
            MD5Version: number;
            commandline: string;
            numFrames: number;
            numJoints: number;
            frameRate: number;
            numAnimatedComponents: number;
            hierarchy: {
                name: string;
                parentIndex: number;
                flags: number;
                startIndex: number;
            }[];
            bounds: {
                min: number[];
                max: number[];
            }[];
            baseframe: {
                position: number[];
                orientation: number[];
            }[];
            frame: {
                index: number;
                components: number[];
            }[];
        };
    }
}
declare module feng3d {
    /**
     * Obj模型加载类
     * @author feng 2017-01-18
     */
    class ObjLoader extends Loader {
        objData: OBJ_OBJData;
        mtlData: Mtl_Mtl;
        completed: (object3D: Object3D) => void;
        /**
         * 加载资源
         * @param url   路径
         */
        load(url: string, completed?: (object3D: Object3D) => void): void;
        private createObj();
        private createSubObj(obj);
        private createMaterialObj(vertex, subObj);
    }
}
declare module feng3d {
    /**
     * MD5模型加载类
     * @author feng 2017-01-18
     */
    class MD5Loader extends Loader {
        completed: (object3D: Object3D, skeletonAnimator: SkeletonAnimator) => void;
        animCompleted: (skeletonClipNode: SkeletonClipNode) => void;
        /**
         * 加载资源
         * @param url   路径
         */
        load(url: string, completed?: (object3D: Object3D, skeletonAnimator: SkeletonAnimator) => void): void;
        loadAnim(url: string, completed?: (object3D: SkeletonClipNode) => void): void;
        private _skeleton;
        private createMD5Mesh(md5MeshData);
        /**
         * 计算最大关节数量
         */
        private calculateMaxJointCount(md5MeshData);
        /**
         * 计算0权重关节数量
         * @param vertex 顶点数据
         * @param weights 关节权重数组
         * @return
         */
        private countZeroWeightJoints(vertex, weights);
        private createSkeleton(joints);
        private createSkeletonJoint(joint);
        private createGeometry(md5Mesh);
        private createAnimator(md5AnimData);
        /**
         * 将一个关键帧数据转换为SkeletonPose
         * @param frameData 帧数据
         * @return 包含帧数据的SkeletonPose对象
         */
        private translatePose(md5AnimData, frameData);
    }
}
declare module feng3d {
    /**
     * 坐标系，三叉戟
     * @author feng 2017-02-06
     */
    class Trident extends Object3D {
        xLine: SegmentObject3D;
        yLine: SegmentObject3D;
        zLine: SegmentObject3D;
        xArrow: ConeObject3D;
        yArrow: ConeObject3D;
        zArrow: ConeObject3D;
        constructor(length?: number);
        private buildTrident(length);
    }
}
declare module feng3d {
    /**
     * 平面3D对象
     * @author feng 2017-02-06
     */
    class PlaneObject3D extends Object3D {
        /**
         * 构建3D对象
         */
        constructor(name?: string);
    }
}
declare module feng3d {
    /**
     * 立方体3D对象
     * @author feng 2017-02-06
     */
    class CubeObject3D extends Object3D {
        /**
         * 构建3D对象
         */
        constructor(name?: string);
    }
}
declare module feng3d {
    /**
     * 球体3D对象
     * @author feng 2017-02-06
     */
    class SphereObject3D extends Object3D {
        /**
         * 构建3D对象
         */
        constructor(name?: string);
    }
}
declare module feng3d {
    /**
     * 胶囊体3D对象
     * @author feng 2017-02-06
     */
    class CapsuleObject3D extends Object3D {
        /**
         * 构建3D对象
         */
        constructor(name?: string);
    }
}
declare module feng3d {
    /**
     * 圆柱体3D对象
     * @author feng 2017-02-06
     */
    class CylinderObject3D extends Object3D {
        /**
         * 构建3D对象
         */
        constructor(name?: string);
    }
}
declare module feng3d {
    /**
     * 圆锥体3D对象
     * @author feng 2017-02-06
     */
    class ConeObject3D extends Object3D {
        colorMaterial: ColorMaterial;
        /**
         * 构建3D对象
         */
        constructor(radius?: number, height?: number, name?: string);
    }
}
declare module feng3d {
    /**
     * 天空盒3D对象
     * @author feng 2017-02-06
     */
    class SkyBoxObject3D extends Object3D {
        /**
         * 构建3D对象
         */
        constructor(images: HTMLImageElement[], name?: string);
    }
}
declare module feng3d {
    /**
     * 线条3D对象
     * @author feng 2017-02-06
     */
    class SegmentObject3D extends Object3D {
        segmentGeometry: SegmentGeometry;
        constructor(name?: string);
    }
}
declare module feng3d {
    /**
     * 天空盒3D对象
     * @author feng 2017-02-06
     */
    class ParticleObject3D extends Object3D {
        /**
         * 构建3D对象
         */
        constructor(name?: string);
    }
}
declare module feng3d {
    /**
     * 鼠标事件管理
     * @author feng 2014-4-29
     */
    class Mouse3DManager {
        viewRect: Rectangle;
        /**
         * 鼠标拾取渲染器
         */
        private mouseRenderer;
        private clientX;
        private clientY;
        private selectedObject3D;
        private mouseEventTypes;
        constructor();
        /**
         * 监听鼠标事件收集事件类型
         */
        private onMouseEvent(event);
        /**
         * 监听鼠标移动事件获取鼠标位置
         */
        private onMousemove(event);
        /**
         * 渲染
         */
        draw(context3D: Context3D, scene3D: Scene3D, camera: Camera3D): void;
        /**
         * 设置选中对象
         */
        private setSelectedObject3D(value);
    }
    /**
     * 3D鼠标事件
     */
    class Mouse3DEvent extends Event {
        /** 鼠标单击 */
        static CLICK: string;
        /** 鼠标双击 */
        static DOUBLE_CLICK: "doubleClick3D";
        /** 鼠标按下 */
        static MOUSE_DOWN: string;
        /** 鼠标移动 */
        static MOUSE_MOVE: string;
        /** 鼠标移出 */
        static MOUSE_OUT: string;
        /** 鼠标移入 */
        static MOUSE_OVER: string;
        /** 鼠标弹起 */
        static MOUSE_UP: string;
    }
}
