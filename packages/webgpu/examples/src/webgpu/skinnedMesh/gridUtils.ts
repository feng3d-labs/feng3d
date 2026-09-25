import { RenderPipeline, VertexAttributes } from '@feng3d/webgpu';

import { gridIndices, gridJoints, gridVertices, gridWeights } from './gridData';

// Uses constant grid data to create appropriately sized GPU Buffers for our skinned grid
export const createSkinnedGridBuffers = () =>
{
    // Utility function that creates GPUBuffers from data

    const vertices: VertexAttributes = {
        vert_pos: { data: gridVertices, format: 'float32x2' },
        joints: { data: gridJoints, format: 'uint32x4' },
        weights: { data: gridWeights, format: 'float32x4' },
    };

    return {
        vertices,
        indices: gridIndices,
    };
};

export const createSkinnedGridRenderPipeline = (
    vertexShader: string,
    fragmentShader: string,
) =>
{
    const material: RenderPipeline = {
        label: 'SkinnedGridRenderer',
        vertex: {
            code: vertexShader,
        },
        fragment: {
            code: fragmentShader,
        },
        primitive: {
            topology: 'line-list',
        },
    };

    return material;
};
