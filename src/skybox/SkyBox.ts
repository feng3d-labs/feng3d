namespace feng3d
{

    export interface ComponentMap { SkyBox: SkyBox; }

    /**
     * 天空盒组件
     */
    export class SkyBox extends Component
    {
        __class__: "feng3d.SkyBox" = "feng3d.SkyBox";

        @serializeAssets
        @oav({ component: "OAVPick", componentParam: { accepttype: "texturecube", datatype: "texturecube" } })
        s_skyboxTexture = new TextureCube();

        constructor()
        {
            super();
            //
        }

        init(gameObject: GameObject)
        {
            super.init(gameObject)
        }

        beforeRender(gl: GL, renderAtomic: RenderAtomic, scene3d: Scene3D, camera: Camera)
        {
            renderAtomic.uniforms.s_skyboxTexture = () => this.s_skyboxTexture;
        }
    }
}