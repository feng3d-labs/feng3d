import { BindingResources } from './BindingResources';
import { DrawVertex } from './DrawVertex';
import { VertexAttributes, VertexData } from './VertexAttributes';
import { VertexState } from './VertexState';

export interface TransformFeedbackPass
{
    /**
     * 数据类型。
     */
    readonly __type__: 'TransformFeedbackPass';

    /**
     * 变换反馈对象列表。
     */
    transformFeedbackObjects: TransformFeedbackObject[];
}

export interface TransformFeedbackObject
{
    /**
     * 渲染管线描述。
     */
    readonly pipeline: TransformFeedbackPipeline;

    /**
     * 顶点属性数据映射。
     */
    vertices: VertexAttributes;

    /**
     * 根据顶点数据绘制图元。
     */
    readonly draw: DrawVertex;

    /**
     * Uniform渲染数据
     */
    uniforms?: BindingResources;

    /**
     * 回写顶点着色器中输出到缓冲区。
     */
    transformFeedback: TransformFeedback;
}

export interface TransformFeedbackPipeline
{
    /**
     * 顶点着色器阶段描述。
     */
    readonly vertex: VertexState;

    /**
     * 回写变量。
     */
    transformFeedbackVaryings: TransformFeedbackVaryings;
}

export interface TransformFeedbackVaryings
{
    /**
     * 回写变量列表。
     */
    varyings: string[];

    /**
     * 交叉或者分离。
     */
    bufferMode: 'INTERLEAVED_ATTRIBS' | 'SEPARATE_ATTRIBS';
}

/**
 * 变换反馈。
 */
export interface TransformFeedback
{
    /**
     * 绑定缓冲区列表。
     */
    bindBuffers: TransformFeedbacBindBuffer[];
}

export interface TransformFeedbacBindBuffer
{
    index: number;

    data: VertexData;
}
