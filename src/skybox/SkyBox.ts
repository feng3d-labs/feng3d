namespace feng3d
{
    export interface ComponentMap { SkyBox: SkyBox; }

    /**
     * 天空盒组件
     */
    @AddComponentMenu("SkyBox/SkyBox")
    @RegisterComponent()
    export class SkyBox extends Component3D
    {
        __class__: "feng3d.SkyBox";

        @serialize
        @oav({ component: "OAVPick", componentParam: { accepttype: "texturecube", datatype: "texturecube" } })
        s_skyboxTexture = TextureCube.default;

        beforeRender(renderAtomic: RenderAtomic, scene: Scene, camera: Camera)
        {
            renderAtomic.uniforms.s_skyboxTexture = () => this.s_skyboxTexture;
        }
    }
}