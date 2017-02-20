module feng3d
{

    /**
     * 天空盒3D对象
     * @author feng 2017-02-06
     */
    export class ParticleObject3D extends Object3D
    {

        /**
         * 构建3D对象
         */
        constructor(name = "particle")
        {

            super(name);
            this.getOrCreateComponentByClass(MeshFilter).geometry = new PointGeometry();
            this.getOrCreateComponentByClass(MeshRenderer).material = new ParticleMaterial();
            var particleAnimator = this.getOrCreateComponentByClass(ParticleAnimator);
            particleAnimator.addComponent(new ParticlePosition());
            particleAnimator.addComponent(new ParticleVelocity());
        }
    }
}