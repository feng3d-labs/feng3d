namespace feng3d
{
    export interface ComponentMap { SkyBox: SkyBox; }

    /**
     * 天空盒组件
     */
    @AddComponentMenu("SkyBox/SkyBox")
    @RegisterComponent()
    export class SkyBox extends Component
    {
        __class__: "feng3d.SkyBox";

        // /**
        //  * The material used by the skybox.
        //  */
        // @serialize
        // material: Material;

        @serialize
        @oav({ component: "OAVPick", componentParam: { accepttype: "texturecube", datatype: "texturecube" } })
        s_skyboxTexture = TextureCube.default;

        beforeRender(renderAtomic: RenderAtomic, scene: Scene, camera: Camera)
        {
            renderAtomic.uniforms.s_skyboxTexture = () => this.s_skyboxTexture;
        }
    }
}