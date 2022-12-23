/**
 * 发射形状
 */
export enum ParticleSystemShapeType
{
    /**
     * Emit from a sphere.
     *
     * 从球体的体积中发射。
     */
    Sphere = 0,

    /**
     * Emit from the surface of a sphere.
     *
     * 从球体表面发射。
     */
    SphereShell = 1,

    /**
     * Emit from a half-sphere.
     *
     * 从半球体的体积发射。
     */
    Hemisphere = 2,

    /**
     * Emit from the surface of a half-sphere.
     *
     * 从半球体的表面发射。
     */
    HemisphereShell = 3,

    /**
     * Emit from a cone.
     *
     * 从圆锥体发射。
     */
    Cone = 4,

    /**
     * Emit from the base surface of a cone.
     *
     * 从圆锥体的基面发射。
     */
    ConeShell = 7,

    /**
     * Emit from the volume of a cone.
     *
     * 从一个圆锥体的体积发出。
     */
    ConeVolume = 8,

    /**
     * Emit from the surface of a cone.
     *
     * 从一个圆锥体的表面发射。
     */
    ConeVolumeShell = 9,

    /**
     * Emit from the volume of a box.
     *
     * 从一个盒子的体积中发出。
     */
    Box = 5,

    /**
     * Emit from the surface of a box.
     *
     * 从盒子表面发射。
     */
    BoxShell = 15,

    /**
     * Emit from the edges of a box.
     *
     * 从盒子的边缘发出。
     */
    BoxEdge = 16,

    /**
     * Emit from a mesh.
     *
     * 从一个网格中发出。
     *
     * @todo
     */
    Mesh = 6,

    /**
     * Emit from a mesh renderer.
     *
     * 从一个网格渲染器发射。
     *
     * @todo
     */
    MeshRenderer = 13,

    /**
     * Emit from a skinned mesh renderer.
     *
     * 从蒙皮网格渲染器发出。
     *
     * @todo
     */
    SkinnedMeshRenderer = 14,

    /**
     * Emit from a circle.
     *
     * 从一个圆发出。
     */
    Circle = 10,

    /**
     * Emit from the edge of a circle.
     *
     * 从圆的边缘发出。
     */
    CircleEdge = 11,

    /**
     * Emit from an edge.
     *
     * 从边缘发出。
     */
    SingleSidedEdge = 12,
}
