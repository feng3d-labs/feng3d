declare namespace feng3d {
    var GeometryUtils: {
        createVertexNormals: (indices: number[] | Uint16Array, positions: number[] | Float32Array, useFaceWeights?: boolean) => number[];
        createVertexTangents: (indices: number[] | Uint16Array, positions: number[] | Float32Array, uvs: number[] | Float32Array, useFaceWeights?: boolean) => number[];
    };
}
