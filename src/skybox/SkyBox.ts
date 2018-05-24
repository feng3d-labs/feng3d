namespace feng3d
{
    /**
     * 天空盒组件
     */
    export class SkyBox extends Component
    {
        @serialize
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

        preRender(renderAtomic: RenderAtomic)
        {
            renderAtomic.uniforms.s_skyboxTexture = () => this.s_skyboxTexture;
        }
    }
}