// Vitest 全局 setup：为在 Node 环境下运行的子包测试补齐最小浏览器 / WebGPU 全局。
//
// 背景：`packages/shortcut` 与 `packages/terrain` 的模块顶层会访问浏览器 / WebGPU 全局，
// 在 Node 环境直接跑到会抛 `ReferenceError`（`self is not defined` /
// `GPUBufferUsage is not defined`），因此它们原先被排除在根 vitest 之外。
// 这里补齐最小可用的全局，让这两个子包的单元测试也能进入 CI 全量，而不是被静默跳过。
//
// 注意：只补测试真正触达的全局，不模拟 WebGPU 设备。需要真实 GPU 的用例
// 仍应在各自包内用浏览器环境跑，不要往本文件里堆 mock。

// ---------------------------------------------------------------------------
// 浏览器全局：shortcut 的 WindowEventProxy 在模块顶层
// `new EventProxy<WindowEventMap>(self)`，随后 `on()` 会对 self 调 addEventListener。
//
// 用真实的事件派发（内部挂一个 EventTarget 转发）而不是 no-op：
// shortcut 的测试要靠 addEventListener 注册的监听器被真正触发，
// no-op 会让「已注册但从不触发」这类缺陷在 CI 里表现为通过。
//
// 注意：这里**不定义 window**——部分模块用 `typeof window === 'undefined'`
// 作为「非浏览器环境」的守卫（见 packages/addons/test/browser-stub.ts 的说明），
// 定义 window 会让这些守卫失效并走进浏览器专属分支。
// ---------------------------------------------------------------------------
const globalScope = globalThis as unknown as Record<string, unknown>;

if (typeof globalScope.self === 'undefined')
{
    globalScope.self = globalThis;
}

if (typeof globalScope.addEventListener !== 'function')
{
    const target = new EventTarget();
    globalScope.addEventListener = target.addEventListener.bind(target);
    globalScope.removeEventListener = target.removeEventListener.bind(target);
    globalScope.dispatchEvent = target.dispatchEvent.bind(target);
}

// ---------------------------------------------------------------------------
// DOM 事件类
//
// shortcut 的逻辑用 `instanceof MouseEvent / KeyboardEvent / WheelEvent` 区分
// 输入类型（见 packages/shortcut/src/handle/KeyState.ts、EventProxy.ts），
// Node 下这几个类不存在，会直接 ReferenceError。
//
// 这里只补到「能通过 instanceof 判定 + 带上被测代码读取的字段」的程度，
// 不模拟浏览器事件语义（传播、冒泡、默认行为）。
// ---------------------------------------------------------------------------
if (typeof globalScope.MouseEvent === 'undefined')
{
    class MouseEventShim extends Event
    {
        button = 0;
        buttons = 0;
        clientX = 0;
        clientY = 0;
        pageX = 0;
        pageY = 0;
        screenX = 0;
        screenY = 0;
        shiftKey = false;
        ctrlKey = false;
        altKey = false;
        metaKey = false;
        detail = 0;

        constructor(type: string, init: Record<string, unknown> = {})
        {
            super(type);
            for (const key of Object.keys(init))
            {
                if (key === 'type') continue;
                (this as Record<string, unknown>)[key] = init[key];
            }
        }
    }
    globalScope.MouseEvent = MouseEventShim;
}

if (typeof globalScope.KeyboardEvent === 'undefined')
{
    class KeyboardEventShim extends Event
    {
        key = '';
        code = '';
        keyCode = 0;
        which = 0;
        repeat = false;
        shiftKey = false;
        ctrlKey = false;
        altKey = false;
        metaKey = false;

        constructor(type: string, init: Record<string, unknown> = {})
        {
            super(type);
            for (const key of Object.keys(init))
            {
                if (key === 'type') continue;
                (this as Record<string, unknown>)[key] = init[key];
            }
        }
    }
    globalScope.KeyboardEvent = KeyboardEventShim;
}

if (typeof globalScope.WheelEvent === 'undefined')
{
    class WheelEventShim extends Event
    {
        deltaX = 0;
        deltaY = 0;
        deltaZ = 0;
        deltaMode = 0;
        clientX = 0;
        clientY = 0;
        shiftKey = false;
        ctrlKey = false;
        altKey = false;
        metaKey = false;

        constructor(type: string, init: Record<string, unknown> = {})
        {
            super(type);
            for (const key of Object.keys(init))
            {
                if (key === 'type') continue;
                (this as Record<string, unknown>)[key] = init[key];
            }
        }
    }
    globalScope.WheelEvent = WheelEventShim;
}

// ImageData：@feng3d/feng3d 的 ImageUtil 在模块加载时构造占位默认纹理，
// packages/addons 的测试 stub 里也有同一份定义（两处都做 `typeof === 'undefined'` 守卫，先到先得）。
if (typeof globalScope.ImageData === 'undefined')
{
    class ImageDataShim
    {
        readonly width: number;
        readonly height: number;
        readonly data: Uint8ClampedArray;

        constructor(width: number, height: number)
        {
            this.width = width;
            this.height = height;
            this.data = new Uint8ClampedArray(width * height * 4);
        }
    }
    globalScope.ImageData = ImageDataShim;
}

// ---------------------------------------------------------------------------
// WebGPU **类** stub：复用 feng3d 已有的 packages/feng3d/src/test/webgpu-stub.ts
// （注入 GPUTexture / GPUBuffer 占位类，供 @feng3d/webgpu 加载时的
//  `GPUTexture.prototype.createView` monkey-patch 使用）。
// 复用而不复制，避免两套 stub 各自漂移。
// ---------------------------------------------------------------------------
await import('./packages/feng3d/src/test/webgpu-stub');

// ---------------------------------------------------------------------------
// WebGPU 常量表
//
// 这些枚举在浏览器里由 GPU 实现挂在全局上，Node 下不存在。依照
// @webgpu/types 的取值填入实际数值（与 W3C WebGPU 规范一致），
// 而不是随意造数——否则依赖位运算的代码会算出错误结果。
// ---------------------------------------------------------------------------
const WEBGPU_CONSTANTS = {
    // 缓冲用途位标志（可按位或）
    GPUBufferUsage: {
        MAP_READ: 0x0001,
        MAP_WRITE: 0x0002,
        COPY_SRC: 0x0004,
        COPY_DST: 0x0008,
        INDEX: 0x0010,
        VERTEX: 0x0020,
        UNIFORM: 0x0040,
        STORAGE: 0x0080,
        INDIRECT: 0x0100,
        QUERY_RESOLVE: 0x0200,
    },
    // 纹理用途位标志
    GPUTextureUsage: {
        COPY_SRC: 0x01,
        COPY_DST: 0x02,
        TEXTURE_BINDING: 0x04,
        STORAGE_BINDING: 0x08,
        RENDER_ATTACHMENT: 0x10,
    },
    // 着色器阶段位标志
    GPUShaderStage: {
        VERTEX: 0x1,
        FRAGMENT: 0x2,
        COMPUTE: 0x4,
    },
    // 映射模式位标志
    GPUMapMode: {
        READ: 0x0001,
        WRITE: 0x0002,
    },
    // 颜色写入位标志
    GPUColorWrite: {
        RED: 0x1,
        GREEN: 0x2,
        BLUE: 0x4,
        ALPHA: 0x8,
        ALL: 0xf,
    },
    // 以下为普通字符串 / 数值枚举，取值即规范字面量
    GPUIndexFormat: { uint16: 'uint16', uint32: 'uint32' },
    GPUVertexFormat: {
        uint8x2: 'uint8x2', uint8x4: 'uint8x4',
        sint8x2: 'sint8x2', sint8x4: 'sint8x4',
        unorm8x2: 'unorm8x2', unorm8x4: 'unorm8x4',
        snorm8x2: 'snorm8x2', snorm8x4: 'snorm8x4',
        uint16x2: 'uint16x2', uint16x4: 'uint16x4',
        sint16x2: 'sint16x2', sint16x4: 'sint16x4',
        unorm16x2: 'unorm16x2', unorm16x4: 'unorm16x4',
        snorm16x2: 'snorm16x2', snorm16x4: 'snorm16x4',
        float16x2: 'float16x2', float16x4: 'float16x4',
        float32: 'float32', float32x2: 'float32x2',
        float32x3: 'float32x3', float32x4: 'float32x4',
        uint32: 'uint32', uint32x2: 'uint32x2',
        uint32x3: 'uint32x3', uint32x4: 'uint32x4',
        sint32: 'sint32', sint32x2: 'sint32x2',
        sint32x3: 'sint32x3', sint32x4: 'sint32x4',
        'unorm10-10-10-2': 'unorm10-10-10-2',
    },
    GPUVertexStepMode: { vertex: 'vertex', instance: 'instance' },
    GPUPrimitiveTopology: {
        'point-list': 'point-list',
        'line-list': 'line-list',
        'line-strip': 'line-strip',
        'triangle-list': 'triangle-list',
        'triangle-strip': 'triangle-strip',
    },
    GPULoadOp: { load: 'load', clear: 'clear' },
    GPUStoreOp: { store: 'store', discard: 'discard' },
    GPUAddressMode: {
        clampToEdge: 'clamp-to-edge',
        repeat: 'repeat',
        mirrorRepeat: 'mirror-repeat',
    },
    GPUFilterMode: { nearest: 'nearest', linear: 'linear' },
    GPUMipmapFilterMode: { nearest: 'nearest', linear: 'linear' },
    GPUCompareFunction: {
        never: 'never', less: 'less', equal: 'equal',
        'less-equal': 'less-equal', greater: 'greater',
        'not-equal': 'not-equal', 'greater-equal': 'greater-equal',
        always: 'always',
    },
    GPUBlendFactor: {
        zero: 'zero', one: 'one', src: 'src', 'one-minus-src': 'one-minus-src',
        'src-alpha': 'src-alpha', 'one-minus-src-alpha': 'one-minus-src-alpha',
        dst: 'dst', 'one-minus-dst': 'one-minus-dst', 'dst-alpha': 'dst-alpha',
        'one-minus-dst-alpha': 'one-minus-dst-alpha',
        'src-alpha-saturated': 'src-alpha-saturated',
        constant: 'constant', 'one-minus-constant': 'one-minus-constant',
        src1: 'src1', 'one-minus-src1': 'one-minus-src1',
        'src1-alpha': 'src1-alpha', 'one-minus-src1-alpha': 'one-minus-src1-alpha',
    },
    GPUBlendOperation: {
        add: 'add', subtract: 'subtract', 'reverse-subtract': 'reverse-subtract',
        min: 'min', max: 'max',
    },
    GPUStencilOperation: {
        keep: 'keep', zero: 'zero', replace: 'replace', invert: 'invert',
        'increment-clamp': 'increment-clamp', 'decrement-clamp': 'decrement-clamp',
        'increment-wrap': 'increment-wrap', 'decrement-wrap': 'decrement-wrap',
    },
    GPUCullMode: { none: 'none', front: 'front', back: 'back' },
    GPUFrontFace: { ccw: 'ccw', cw: 'cw' },
    GPUTextureDimension: { '1d': '1d', '2d': '2d', '3d': '3d' },
    GPUTextureViewDimension: {
        '1d': '1d', '2d': '2d', '2d-array': '2d-array', cube: 'cube',
        'cube-array': 'cube-array', '3d': '3d',
    },
    GPUTextureSampleType: {
        float: 'float', 'unfilterable-float': 'unfilterable-float',
        depth: 'depth', sint: 'sint', uint: 'uint',
    },
    GPUQueryType: { occlusion: 'occlusion', timestamp: 'timestamp' },
    GPUFeatureName: {
        depthClipControl: 'depth-clip-control',
        depth32floatStencil8: 'depth32float-stencil8',
        textureCompressionBC: 'texture-compression-bc',
        timestampQuery: 'timestamp-query',
        indirectFirstInstance: 'indirect-first-instance',
    },
};

for (const [name, value] of Object.entries(WEBGPU_CONSTANTS))
{
    if (typeof globalThis[name] === 'undefined')
    {
        globalThis[name] = Object.freeze(value);
    }
}
