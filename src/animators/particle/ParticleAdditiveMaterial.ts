namespace feng3d
{
    /**
     * UnityShader "Particles/Additive"
     */
    export class ParticleAdditiveUniforms
    {
        __class__: "feng3d.ParticleAdditiveUniforms" = "feng3d.ParticleAdditiveUniforms";

        /**
         * 点绘制时点的尺寸
         */
        @serialize
        @oav()
        u_PointSize = 1;

        @serialize
        @oav()
        u_tintColor = new Color4(0.5, 0.5, 0.5, 0.5);

        /**
         * 粒子贴图
         */
        @serialize
        @oav({ tooltip: "粒子贴图" })
        s_particle = Texture2D.default;
        
        /**
         * 粒子贴图使用的UV变换
         */
        @serialize
        @oav({ tooltip: "粒子贴图使用的UV变换" })
        u_s_particle_transform = new Vector4(1, 1, 0, 0);

        @serialize
        @oav()
        u_softParticlesFactor = 1.0;
    }

    shaderConfig.shaders["particle_additive"].cls = ParticleAdditiveUniforms;
}