namespace feng3d
{
    /**
     * 发射形状
     */
    export enum ParticleSystemShapeType
    {
        /**
         * 从球体的体积中发射。
         * Emit from a sphere.
         */
        Sphere,
        /**
         * 从半球体的体积发射。
         * Emit from a half-sphere.
         */
        Hemisphere,
        /**
         * 从圆锥体发射。
         * Emit from a cone.
         */
        Cone,
        /**
         * 从一个盒子的体积中发出。
         * Emit from the volume of a box.
         */
        Box,
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
         * 从边缘发出。
         * Emit from an edge.
         */
        SingleSidedEdge,
    }
}