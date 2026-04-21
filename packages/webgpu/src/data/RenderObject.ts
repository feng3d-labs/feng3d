import { BindingResources } from './BindingResources';
import { RenderPipeline } from './RenderPipeline';
import { ScissorRect } from './ScissorRect';
import { VertexAttribute, VertexAttributes } from './VertexAttributes';

/**
 * 渲染对象，包含一次渲染时包含的所有数据。
 */
export interface RenderObject
{
    /**
     * 数据类型。
     */
    __type__?: 'RenderObject';

    /**
     * 视窗。
     *
     * 描述渲染在画布的哪个区域，默认整个画布。
     */
    readonly viewport?: import('./Viewport').Viewport;

    /**
     * 光栅化阶段中使用的剪刀矩形。
     */
    readonly scissorRect?: ScissorRect;

    /**
     * 渲染管线描述。
     */
    readonly pipeline: RenderPipeline;

    /**
     * 顶点属性数据映射。
     */
    readonly vertices?: VertexAttributes;

    /**
     * 顶点索引数据。
     */
    readonly indices?: IndicesDataTypes;

    /**
     * 绘制。
     */
    readonly draw?: IDraw;

    /**
     * 绑定资源。
     *
     * 与着色器中名称对应的绑定资源（纹理、采样器、统一数据、存储数据等）。
     */
    readonly bindingResources?: BindingResources;
}

export class RenderObject
{
    /**
     * 获取顶点数量。
     *
     * @returns 顶点数量。
     */
    static getNumVertex(geometry: RenderObject)
    {
        const attributes = geometry.vertices;
        const vertexList = Object.keys(attributes).map((v) => attributes[v]).filter((v) => (v.data && v.stepMode !== 'instance'));

        const count = vertexList.length > 0 ? VertexAttribute.getVertexCount(vertexList[0]) : 0;

        // 验证所有顶点属性数据的顶点数量一致。
        if (vertexList.length > 0)
        {
            console.assert(vertexList.every((v) => count === VertexAttribute.getVertexCount(v)));
        }

        return count;
    }

    /**
     * 获取实例数量。
     *
     * @returns 实例数量。
     */
    static getInstanceCount(geometry: RenderObject)
    {
        const attributes = geometry.vertices;
        const vertexList = Object.keys(attributes).map((v) => attributes[v]).filter((v) => (v.data && v.stepMode === 'instance'));

        const count = vertexList.length > 0 ? VertexAttribute.getVertexCount(vertexList[0]) : 1;

        // 验证所有顶点属性数据的顶点数量一致。
        if (vertexList.length > 0)
        {
            console.assert(vertexList.every((v) => count === VertexAttribute.getVertexCount(v)));
        }

        return count;
    }

    static getDraw(geometry: RenderObject): import('./DrawIndexed').DrawIndexed | import('./DrawVertex').DrawVertex
    {
        if (geometry['_draw']) return geometry['_draw'];

        const instanceCount = RenderObject.getInstanceCount(geometry);

        if (geometry.indices)
        {
            return {
                __type__: 'DrawIndexed',
                indexCount: geometry.indices.length,
                firstIndex: 0,
                instanceCount,
            };
        }

        return {
            __type__: 'DrawVertex',
            vertexCount: RenderObject.getNumVertex(geometry),
            instanceCount,
        };
    }
}

/**
 * 顶点索引数据类型。
 */
export type IndicesDataTypes = Uint16Array | Uint32Array;

/**
 * 绘制图形。
 */
export type IDraw = import('./DrawVertex').DrawVertex | import('./DrawIndexed').DrawIndexed;
