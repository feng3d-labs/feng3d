namespace feng3d
{

    export interface UniformsMap { particle: ParticleUniforms }

    export class ParticleUniforms
    {
        __class__: "feng3d.ParticleUniforms" = "feng3d.ParticleUniforms";

        /**
         * 点绘制时点的尺寸
         */
        @serialize
        @oav()
        u_PointSize = 1;

        /**
         * 漫反射纹理
         */
        @serialize
        @oav({ block: "diffuse" })
        s_diffuse = Texture2D.defaultParticle;

        /**
         * 基本颜色
         */
        @serialize
        @oav({ block: "diffuse" })
        u_diffuse = new Color4(1, 1, 1, 1);

        /**
         * 透明阈值，透明度小于该值的像素被片段着色器丢弃
         */
        @serialize
        @oav({ block: "diffuse" })
        u_alphaThreshold = 0;
    }

    shaderConfig.shaders["particle"].cls = ParticleUniforms;
    shaderConfig.shaders["particle"].renderParams = { enableBlend: true, depthMask: false, sfactor: BlendFactor.ONE, dfactor: BlendFactor.ONE_MINUS_SRC_COLOR, cullFace: CullFace.NONE };

    Material.particle = AssetData.addAssetData("Particle-Material", serialization.setValue(Material.create("particle"), {
        name: "Particle-Material", assetId: "Particle-Material", hideFlags: HideFlags.NotEditable,
    }));
}