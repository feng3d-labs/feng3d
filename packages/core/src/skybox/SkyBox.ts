import { Camera } from "../cameras/Camera";
import { RegisterComponent } from "../component/Component";
import { Component3D } from "../component/Component3D";
import { AddComponentMenu } from "../Menu";
import { RenderAtomic } from "@feng3d/renderer";
import { Scene } from "../scene/Scene";
import { TextureCube } from "../textures/TextureCube";
import { oav } from "@feng3d/objectview";
import { serialize } from "@feng3d/serialization";

declare module "../component/Component"
{
    export interface ComponentMap { SkyBox: SkyBox; }
}

/**
 * 天空盒组件
 */
@AddComponentMenu("SkyBox/SkyBox")
@RegisterComponent({ name: 'SkyBox' })
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
