namespace feng3d
{
    export interface UniformsTypes { Particles_Additive: ParticlesAdditiveUniforms }

    /**
     * UnityShader "Particles/Additive"
     */
    export class ParticlesAdditiveUniforms
    {
        __class__: "feng3d.ParticlesAdditiveUniforms";

        @serialize
        @oav()
        _TintColor = new Color4(0.5, 0.5, 0.5, 0.5);

        /**
         * 粒子贴图
         */
        @serialize
        @oav({ tooltip: "粒子贴图" })
        _MainTex = Texture2D.defaultParticle;

        /**
         * 粒子贴图使用的UV变换
         */
        @serialize
        @oav({ tooltip: "粒子贴图使用的UV变换" })
        _MainTex_ST = new Vector4(1, 1, 0, 0);

        /**
         * @todo
         */
        @serialize
        @oav()
        _InvFade = 1.0;
    }

    shaderConfig.shaders["Particles_Additive"].cls = ParticlesAdditiveUniforms;
    shaderConfig.shaders["Particles_Additive"].renderParams = {
        enableBlend: true,
        sfactor: BlendFactor.SRC_ALPHA,
        dfactor: BlendFactor.ONE,
        colorMask: ColorMask.RGB,
        cullFace: CullFace.NONE,
        depthMask: false,
    };

    export interface DefaultMaterial
    {
        "Particle-Material": Material;
    }
    Material.setDefault("Particle-Material", { shaderName: "Particles_Additive" });
}