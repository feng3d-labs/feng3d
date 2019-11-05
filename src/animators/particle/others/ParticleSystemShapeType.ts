namespace feng3d
{
    /**
     * 发射形状
     */
    export enum ParticleSystemShapeType
    {
        /**
         * 从球体的体积中发射。
         * Emit from the volume of a sphere.
         */
        Sphere,
        /**
         * 从球体表面发射。
         * Emit from the surface of a sphere.
         */
        SphereShell,
        /**
         * 从半球体的体积中发出。
         * Emit from the volume of a half-sphere.
         */
        Hemisphere,
        /**
         * 从圆锥体的基面发射。
         * Emit from the base surface of a cone.
         */
        Cone,
        /**
         * 从圆锥体的基面发射。
         * Emit from the base surface of a cone.
         */
        ConeShell,
        /**
         * 从一个圆锥体的体积发出。
         * Emit from the volume of a cone.
         */
        ConeVolume,
        /**
         * 从一个圆锥体的表面发射。
         * Emit from the surface of a cone.
         */
        ConeVolumeShell,
        /**
         * 从一个盒子的体积中发出。
         * Emit from the volume of a box.
         */
        Box,
        /**
         * 从盒子的边缘发出。
         * Emit from the edges of a box.
         */
        BoxShell,
        /**
         * 从盒子表面发射。
         * Emit from the surface of a box.
         */
        BoxEdge,
        /**
         * 从一个网格中发出。
         * Emit from a mesh.
         */
        Mesh,
        /**
         * 从一个网格渲染器发射。
         * Emit from a mesh renderer.
         */
        MeshRenderer,
        /**
         * 从蒙皮网格渲染器发出。
         * Emit from a skinned mesh renderer.
         */
        SkinnedMeshRenderer,
        /**
         * 从一个圆发出。
         * Emit from a circle.
         */
        Circle,
        /**
         * 从圆的边缘发出。
         * Emit from the edge of a circle.
         */
        CircleEdge,
        /**
         * 从边缘发出。
         * Emit from an edge.
         */
        SingleSidedEdge,
    }
}