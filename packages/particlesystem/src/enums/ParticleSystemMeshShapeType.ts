/**
 * The mesh emission type.
 *
 * 网格发射类型。
 */
export enum ParticleSystemMeshShapeType
{
    /**
     * Emit from the vertices of the mesh.
     *
     * 从网格的顶点发出。
     */
    Vertex,

    /**
     * Emit from the edges of the mesh.
     *
     * 从网格的边缘发出。
     */
    Edge,

    /**
     * Emit from the surface of the mesh.
     *
     * 从网格表面发出。
     */
    Triangle,
}
