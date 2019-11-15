namespace feng3d
{
    /**
     * UnityShader "Particles/Alpha Blended Premultiply"
     */
    export class ParticlesAlphaBlendedPremultiplyUniforms
    {
        __class__: "feng3d.ParticlesAlphaBlendedPremultiplyUniforms" = "feng3d.ParticlesAlphaBlendedPremultiplyUniforms";

        /**
         * 粒子贴图
         */
        @serialize
        @oav({ tooltip: "粒子贴图" })
        s_particle = Texture2D.defaultParticle;

        /**
         * 粒子贴图使用的UV变换
         */
        @serialize
        @oav({ tooltip: "粒子贴图使用的UV变换" })
        u_s_particle_transform = new Vector4(1, 1, 0, 0);

        /**
         * @todo
         */
        @serialize
        @oav()
        u_softParticlesFactor = 1.0;
    }

    shaderConfig.shaders["Particles_AlphaBlendedPremultiply"].cls = ParticlesAlphaBlendedPremultiplyUniforms;
    shaderConfig.shaders["Particles_AlphaBlendedPremultiply"].renderParams = {
        enableBlend: true,
        sfactor: BlendFactor.ONE,
        dfactor: BlendFactor.ONE_MINUS_DST_ALPHA,
        depthMask: false
    };
}