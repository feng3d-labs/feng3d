import { vec3, vec2 } from 'wgpu-matrix';

// Defines what to pass to pipeline to render mesh
export interface Renderable
{
  vertexBuffer: GPUBuffer;
  indexBuffer: GPUBuffer;
  indexCount: number;
  bindGroup?: GPUBindGroup;
}

export interface Mesh
{
  vertices: Float32Array;
  indices: Uint16Array | Uint32Array;
  vertexStride: number;
}

export const getMeshPosAtIndex = (mesh: Mesh, index: number) =>
{
    const arr = new Float32Array(
        mesh.vertices.buffer,
        index * mesh.vertexStride + 0,
        3,
    );

    return vec3.fromValues(arr[0], arr[1], arr[2]);
};

export const getMeshNormalAtIndex = (mesh: Mesh, index: number) =>
{
    const arr = new Float32Array(
        mesh.vertices.buffer,
        index * mesh.vertexStride + 3 * Float32Array.BYTES_PER_ELEMENT,
        3,
    );

    return vec3.fromValues(arr[0], arr[1], arr[2]);
};

export const getMeshUVAtIndex = (mesh: Mesh, index: number) =>
{
    const arr = new Float32Array(
        mesh.vertices.buffer,
        index * mesh.vertexStride + 6 * Float32Array.BYTES_PER_ELEMENT,
        2,
    );

    return vec2.fromValues(arr[0], arr[1]);
};
