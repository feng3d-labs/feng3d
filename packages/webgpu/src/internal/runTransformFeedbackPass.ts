import { BindingResources } from '../data/BindingResources';
import { TransformFeedbackPass, TransformFeedbackObject } from '../data/TransformFeedbackPass';

import { runComputePass } from './runComputePass';
import { ComputeObject } from '../data/ComputeObject';
import { ComputePass } from '../data/ComputePass';
import { ComputePipeline } from '../data/ComputePipeline';

/**
 * 在 WebGPU 中运行 TransformFeedbackPass。
 * 将 TransformFeedback 转换为 ComputePass 执行。
 */
export function runTransformFeedbackPass(device: GPUDevice, commandEncoder: GPUCommandEncoder, transformFeedbackPass: TransformFeedbackPass)
{
    const computePass: ComputePass = {
        __type__: 'ComputePass',
        computeObjects: [],
    };

    transformFeedbackPass.transformFeedbackObjects.forEach((transformFeedbackObject) =>
    {
        const computeObject = convertToComputeObject(transformFeedbackObject);

        if (computeObject)
        {
            computePass.computeObjects.push(computeObject);
        }
    });

    if (computePass.computeObjects.length > 0)
    {
        runComputePass(device, commandEncoder, computePass);
    }
}

/**
 * 将 TransformFeedbackObject 转换为 ComputeObject。
 */
function convertToComputeObject(transformFeedbackObject: TransformFeedbackObject): ComputeObject | null
{
    const pipeline = transformFeedbackObject.pipeline;

    // 从 vertex.wgsl 获取计算着色器代码
    const computeCode = pipeline.vertex.wgsl;

    if (!computeCode)
    {
        console.warn('TransformFeedbackPass: 未提供 vertex.wgsl 计算着色器代码，WebGPU 无法模拟 Transform Feedback');

        return null;
    }

    // 创建计算管线
    const computePipeline: ComputePipeline = {
        compute: { code: computeCode },
    };

    // 构建绑定资源
    const bindingResourcesObj: Record<string, unknown> = {};

    // 添加 uniforms
    if (transformFeedbackObject.uniforms)
    {
        Object.assign(bindingResourcesObj, transformFeedbackObject.uniforms);
    }

    // 添加输入数据（从 vertices 中提取，每个属性绑定为独立的缓冲区）
    const vertices = transformFeedbackObject.vertices;

    if (vertices)
    {
        for (const [attrName, attrValue] of Object.entries(vertices))
        {
            // 使用 inputData_属性名 格式绑定每个输入缓冲区
            bindingResourcesObj[`inputData_${attrName}`] = { bufferView: attrValue.data };
        }
    }

    // 获取缓冲区模式
    const bufferMode = pipeline.transformFeedbackVaryings?.bufferMode ?? 'INTERLEAVED_ATTRIBS';
    const varyings = pipeline.transformFeedbackVaryings?.varyings ?? [];
    const transformFeedback = transformFeedbackObject.transformFeedback;

    if (bufferMode === 'SEPARATE_ATTRIBS')
    {
        // 分离模式：为每个 varying 绑定独立的输出缓冲区
        if (transformFeedback?.bindBuffers)
        {
            for (let i = 0; i < transformFeedback.bindBuffers.length && i < varyings.length; i++)
            {
                const bindBuffer = transformFeedback.bindBuffers[i];
                const varyingName = varyings[i];

                // 使用 outputData_gl_Position 或 outputData_v_color 格式
                bindingResourcesObj[`outputData_${varyingName}`] = { bufferView: bindBuffer.data };
            }
        }
    }
    else
    {
        // 交错模式：使用单一输出缓冲区
        if (transformFeedback?.bindBuffers?.length > 0)
        {
            const outputData = transformFeedback.bindBuffers[0].data;

            bindingResourcesObj['outputData'] = { bufferView: outputData };
        }
    }

    // 计算工作组数量
    const vertexCount = transformFeedbackObject.draw.vertexCount || 0;
    const workgroupSize = 64; // 默认工作组大小
    const workgroupCountX = Math.ceil(vertexCount / workgroupSize);

    return {
        pipeline: computePipeline,
        bindingResources: bindingResourcesObj as BindingResources,
        workgroups: { workgroupCountX },
    };
}
