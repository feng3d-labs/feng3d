namespace feng3d
{
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
        Sphere,

        /**
         * Emit from the surface of a sphere.
         * 
         * 从球体表面发射。
         */
        SphereShell,

        /**
         * Emit from a half-sphere.
         * 
         * 从半球体的体积发射。
         */
        Hemisphere,

        /**
         * Emit from the surface of a half-sphere.
         * 
         * 从半球体的表面发射。
         */
        HemisphereShell,

        /**
         * Emit from a cone.
         * 
         * 从圆锥体发射。
         */
        Cone,

        /**
         * Emit from the base surface of a cone.
         * 
         * 从圆锥体的基面发射。
         */
        ConeShell,

        /**
         * Emit from the volume of a cone.
         * 
         * 从一个圆锥体的体积发出。
         */
        ConeVolume,

        /**
         * Emit from the surface of a cone.
         * 
         * 从一个圆锥体的表面发射。
         */
        ConeVolumeShell,

        /**
         * Emit from the volume of a box.
         * 
         * 从一个盒子的体积中发出。
         */
        Box,

        /**
         * Emit from the surface of a box.
         * 
         * 从盒子表面发射。
         */
        BoxShell,

        /**
         * Emit from the edges of a box.
         * 
         * 从盒子的边缘发出。
         */
        BoxEdge,

        /**
         * Emit from a mesh.
         * 
         * 从一个网格中发出。
         * 
         * @todo
         */
        Mesh,

        /**
         * Emit from a mesh renderer.
         * 
         * 从一个网格渲染器发射。
         * 
         * @todo
         */
        MeshRenderer,

        /**
         * Emit from a skinned mesh renderer.
         * 
         * 从蒙皮网格渲染器发出。
         * 
         * @todo
         */
        SkinnedMeshRenderer,

        /**
         * Emit from a circle.
         * 
         * 从一个圆发出。
         */
        Circle,

        /**
         * Emit from the edge of a circle.
         * 
         * 从圆的边缘发出。
         */
        CircleEdge,

        /**
         * Emit from an edge.
         * 
         * 从边缘发出。
         */
        SingleSidedEdge,
    }
}