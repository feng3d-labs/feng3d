namespace feng3d
{
    export type WaterMaterial = Material & { uniforms: WaterUniforms; };

    export interface MaterialFactory
    {
        create(shader: "water", raw?: gPartial<WaterMaterial>): WaterMaterial;
    }

    export class WaterUniforms
    {
        u_textureMatrix = new Matrix4x4();

        @oav()
        @serialize
        u_alpha = 1.0;

        @oav()
        @serialize
        u_time = 0.0;

        @oav()
        @serialize
        u_size = 1.0;

        @oav()
        @serialize
        u_distortionScale = 20.0;

        @oav()
        @serialize
        u_sunColor = new Color3().fromUnit(0x7F7F7F);

        @oav()
        @serialize
        u_sunDirection = new Vector3(0.70707, 0.70707, 0);

        @oav()
        @serialize
        u_waterColor = new Color3().fromUnit(0x555555);

        @oav()
        @serialize
        s_mirrorSampler = new Texture2D();

        @oav()
        @serialize
        s_normalSampler = new Texture2D();
    }

    shaderConfig.shaders["water"].cls = WaterUniforms;
}