import { RenderPipeline, VertexAttributes } from "@feng3d/webgpu";

export interface PointCloud
{
    /** 渲染管线 */
    readonly pipeline: RenderPipeline;
    /** 顶点属性 */
    readonly vertices: VertexAttributes;
    /** 顶点数量 */
    readonly vertexCount: number;
}