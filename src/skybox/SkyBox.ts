namespace feng3d
{
    export interface ComponentMap { SkyBox: SkyBox; }

    /**
     * 天空盒组件
     */
    export class SkyBox extends Component
    {
        __class__: "feng3d.SkyBox";

        @serialize
        @oav({ component: "OAVPick", componentParam: { accepttype: "texturecube", datatype: "texturecube" } })
        s_skyboxTexture = TextureCube.default;

        beforeRender(gl: GL, renderAtomic: RenderAtomic, scene: Scene, camera: Camera)
        {
            renderAtomic.uniforms.s_skyboxTexture = () => this.s_skyboxTexture;
        }
    }
}