import type {
    BufferBinding,
    ComputePass,
    IndicesDataTypes,
    RenderObject,
    RenderPipeline,
    VertexAttributes,
} from '@feng3d/webgpu';
import { Buffer as BufferClass } from '@feng3d/webgpu';
import { code as commandGeneratorShaderCode } from '../compute/CommandGenerator.wgsl.js';
import type {
    CameraUniformData,
    Material,
    ObjectData,
} from './types.js';
import {
    CAMERA_DATA_SIZE,
    DRAW_INDEXED_INDIRECT_SIZE,
    FRUSTUM_DATA_SIZE,
    MATERIAL_DATA_SIZE,
    OBJECT_DATA_SIZE,
} from './types.js';

const COMMAND_GENERATOR_SHADER = commandGeneratorShaderCode;

/**
 * GPU驱动渲染输入数据
 *
 * 对应计算着色器的输入绑定
 */
export interface GPUDrivenInput
{
    /**
     * 物体数据
     *
     * 对应 @binding(0) var<storage, read> objects
     */
    readonly objects: readonly ObjectData[];

    /**
     * 材质数据
     *
     * 对应 @binding(1) var<storage, read> materials
     */
    readonly materials: readonly Material[];

    /**
     * 相机数据（包含视锥体）
     *
     * 对应 @binding(2) var<uniform> cameraUniform
     */
    readonly camera: CameraUniformData;

    /**
     * 顶点数据
     */
    readonly vertices: VertexAttributes;

    /**
     * 索引数据
     */
    readonly indices: IndicesDataTypes;

    /**
     * 渲染管线
     */
    readonly renderPipeline: RenderPipeline;
}

/**
 * 创建 GPU 驱动渲染的 ComputePass 和 RenderObject
 *
 * 返回计算着色器通道和渲染对象，外部决定如何组装成 Submit
 */
export function createGPUDriven(input: GPUDrivenInput): {
    /**
     * 计算着色器通道
     *
     * 执行视锥剔除、LOD选择、生成间接绘制命令
     */
    readonly computePass: ComputePass;

    /**
     * 不透明物体渲染对象
     *
     * 使用计算着色器生成的 opaqueCmds 进行间接绘制
     */
    readonly opaqueRenderObject: RenderObject;

    /**
     * 透明物体渲染对象
     *
     * 使用计算着色器生成的 transparentCmds 进行间接绘制
     */
    readonly transparentRenderObject: RenderObject;

    /**
     * 输入缓冲区绑定
     *
     * 用于渲染着色器访问物体数据
     */
    readonly objectsBuffer: BufferBinding<readonly ObjectData[]>;
}
{
    const {
        objects,
        materials,
        camera,
        vertices,
        indices,
        renderPipeline,
    } = input;

    const objectCount = objects.length;
    const materialCount = materials.length;

    // 输入缓冲区 - 对应着色器 @binding(0-3)
    const objectsBuffer: BufferBinding<readonly ObjectData[]> = {
        value: objects,
        bufferView: new Uint8Array(objectCount * OBJECT_DATA_SIZE),
    };

    const materialsBuffer: BufferBinding<readonly Material[]> = {
        value: materials,
        bufferView: new Uint8Array(materialCount * MATERIAL_DATA_SIZE),
    };

    const cameraBuffer: BufferBinding<CameraUniformData> = {
        value: camera,
        bufferView: new Uint8Array(CAMERA_DATA_SIZE + FRUSTUM_DATA_SIZE),
    };

    const objectCountBuffer: BufferBinding<{ count: number }> = {
        value: { count: objectCount },
    };

    // 输出缓冲区 - 对应着色器 @binding(4-7)
    const opaqueCmdsBuffer: BufferBinding<readonly[]> = {
        bufferView: new Uint8Array(objectCount * DRAW_INDEXED_INDIRECT_SIZE),
    };

    const opaqueCountersBuffer: BufferBinding<readonly number[]> = {
        bufferView: new Uint32Array(materialCount),
    };

    const transparentCmdsBuffer: BufferBinding<readonly[]> = {
        bufferView: new Uint8Array(objectCount * DRAW_INDEXED_INDIRECT_SIZE),
    };

    const transparentCounterBuffer: BufferBinding<{ count: number }> = {
        bufferView: new Uint32Array(1),
    };

    // 计算着色器通道
    const computePass: ComputePass = {
        __type__: 'ComputePass',
        computeObjects: [
            {
                pipeline: {
                    compute: {
                        code: COMMAND_GENERATOR_SHADER,
                        entryPoint: 'main',
                    },
                },
                bindingResources: {
                    // @binding(0) objects
                    objects: objectsBuffer,
                    // @binding(1) materials
                    materials: materialsBuffer,
                    // @binding(2) cameraUniform
                    cameraUniform: cameraBuffer,
                    // @binding(3) objectCount
                    objectCount: objectCountBuffer,
                    // @binding(4) opaqueCmds
                    opaqueCmds: opaqueCmdsBuffer,
                    // @binding(5) opaqueCounters
                    opaqueCounters: opaqueCountersBuffer,
                    // @binding(6) transparentCmds
                    transparentCmds: transparentCmdsBuffer,
                    // @binding(7) transparentCounter
                    transparentCounter: transparentCounterBuffer,
                },
                workgroups: {
                    workgroupCountX: Math.ceil(objectCount / 64),
                    workgroupCountY: 1,
                    workgroupCountZ: 1,
                },
            },
        ],
    };

    // 不透明物体渲染对象
    const opaqueRenderObject: RenderObject = {
        __type__: 'RenderObject',
        pipeline: renderPipeline,
        vertices,
        indices,
        bindingResources: {
            objects: objectsBuffer,
        },
        draw: {
            __type__: 'DrawIndexedIndirect',
            buffer: BufferClass.getBuffer(opaqueCmdsBuffer.bufferView.buffer),
            offset: 0,
        },
    };

    // 透明物体渲染对象
    const transparentRenderObject: RenderObject = {
        __type__: 'RenderObject',
        pipeline: renderPipeline,
        vertices,
        indices,
        bindingResources: {
            objects: objectsBuffer,
        },
        draw: {
            __type__: 'DrawIndexedIndirect',
            buffer: BufferClass.getBuffer(transparentCmdsBuffer.bufferView.buffer),
            offset: 0,
        },
    };

    return {
        computePass,
        opaqueRenderObject,
        transparentRenderObject,
        objectsBuffer,
    };
}
