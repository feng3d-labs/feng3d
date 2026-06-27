/**
 * 缓冲区目标枚举 (WebGL 兼容层)
 */
export enum BufferTarget
{
    ARRAY_BUFFER = 'vertex',
    ELEMENT_ARRAY_BUFFER = 'index',
    UNIFORM_BUFFER = 'uniform',
    STORAGE_BUFFER = 'storage',
}

/**
 * 缓冲区用途枚举 (WebGL 兼容层)
 */
export enum BufferUsage
{
    STATIC_DRAW = 'static',
    DYNAMIC_DRAW = 'dynamic',
    STREAM_DRAW = 'stream',
}

/**
 * 缓冲区数据类型 (WebGL 兼容层)
 */
export enum BufferDataType
{
    BYTE = 'sint8',
    UNSIGNED_BYTE = 'uint8',
    SHORT = 'sint16',
    UNSIGNED_SHORT = 'uint16',
    INT = 'sint32',
    UNSIGNED_INT = 'uint32',
    FLOAT = 'float32',
}

/**
 * 缓冲区类 (WebGL 兼容层)
 */
export class Buffer
{
    private static _idCounter = 0;

    /**
     * 缓冲区 ID
     */
    _id: number;

    /**
     * 缓冲区目标
     */
    target: BufferTarget = BufferTarget.ARRAY_BUFFER;

    /**
     * 缓冲区用途
     */
    usage: BufferUsage = BufferUsage.STATIC_DRAW;

    /**
     * 缓冲区大小 (字节)
     */
    size = 0;

    /**
     * GPU 缓冲区
     */
    _gpuBuffer?: GPUBuffer;

    /**
     * 缓冲区数据
     */
    _data?: ArrayBufferView;

    constructor()
    {
        this._id = Buffer._idCounter++;
    }

    /**
     * 设置缓冲区数据
     */
    setData(data: ArrayBufferView): void
    {
        this._data = data;
        this.size = data.byteLength;
    }

    /**
     * 获取缓冲区数据
     */
    getData(): ArrayBufferView | undefined
    {
        return this._data;
    }
}