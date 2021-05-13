import { Camera } from "../cameras/Camera";
import { RegisterComponent } from "../component/Component";
import { Component3D } from "../component/Component3D";
import { AddComponentMenu } from "../Menu";
import { RenderAtomic } from "../renderer/data/RenderAtomic";
import { Scene } from "../scene/Scene";
import { TextureCube } from "../textures/TextureCube";
import { oav } from "../utils/ObjectView";
import { serialize } from "../utils/Serialization";

declare module "../component/Component"
{
    export interface ComponentMap { SkyBox: SkyBox; }
}

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
    s_skyboxTexture: TextureCube = TextureCube.default;

    beforeRender(renderAtomic: RenderAtomic, scene: Scene, camera: Camera)
    {
        renderAtomic.uniforms.s_skyboxTexture = () => this.s_skyboxTexture;
    }
}
