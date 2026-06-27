/**
 * 顶点属性接口 (WebGL 兼容层)
 */
export interface Attribute
{
    /**
     * 属性名称
     */
    name: string;

    /**
     * 数据
     */
    data: Float32Array | Uint8Array | Uint16Array | Uint32Array | Int8Array | Int16Array | Int32Array;

    /**
     * 每个顶点的分量数
     */
    size: number;

    /**
     * 是否归一化
     */
    normalized?: boolean;

    /**
     * 步长
     */
    stride?: number;

    /**
     * 偏移
     */
    offset?: number;

    /**
     * 实例化步进模式
     */
    instanceDivisor?: number;
}

/**
 * 顶点属性集合 (WebGL 兼容层)
 */
export interface Attributes
{
    [name: string]: Attribute;
}

/**
 * 索引数据类 (WebGL 兼容层)
 */
export class Index
{
    /**
     * 索引数据
     */
    data: Uint16Array | Uint32Array;

    constructor(data: Uint16Array | Uint32Array)
    {
        this.data = data;
    }

    /**
     * 获取索引数量
     */
    get count(): number
    {
        return this.data.length;
    }
}

/**
 * 几何数据类 (WebGL 兼容层)
 */
export class GeometryData
{
    /**
     * 顶点属性
     */
    attributes: Attributes = {};

    /**
     * 索引数据
     */
    index?: Index;

    /**
     * 添加顶点属性
     */
    addAttribute(attribute: Attribute): void
    {
        this.attributes[attribute.name] = attribute;
    }

    /**
     * 获取顶点属性
     */
    getAttribute(name: string): Attribute | undefined
    {
        return this.attributes[name];
    }

    /**
     * 移除顶点属性
     */
    removeAttribute(name: string): boolean
    {
        if (this.attributes[name])
        {
            delete this.attributes[name];
            return true;
        }
        return false;
    }

    /**
     * 设置索引数据
     */
    setIndex(data: Uint16Array | Uint32Array): void
    {
        this.index = new Index(data);
    }

    /**
     * 获取顶点数量
     */
    getVertexCount(): number
    {
        const keys = Object.keys(this.attributes);
        if (keys.length === 0) return 0;

        const firstAttr = this.attributes[keys[0]];
        return firstAttr.data.length / firstAttr.size;
    }
}