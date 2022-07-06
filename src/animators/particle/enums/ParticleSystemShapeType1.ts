namespace feng3d
{

    /**
     * The emission shape (Shuriken).
     * 
     * 发射的形状
     */
    export enum ParticleSystemShapeType1
    {
        /**
         * Emit from a sphere.
         * 
         * 从球体的体积中发射。
         */
        Sphere,

        /**
         * Emit from a half-sphere.
         * 
         * 从半球体的体积发射。
         */
        Hemisphere,

        /**
         * Emit from a cone.
         * 
         * 从圆锥体发射。
         */
        Cone,

        /**
         * Emit from the volume of a box.
         * 
         * 从一个盒子的体积中发出。
         */
        Box,

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
         * Emit from an edge.
         * 
         * 从边缘发出。
         */
        Edge,
    }
}