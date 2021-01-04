import { serialize } from "@feng3d/serialization";
import { oav } from "@feng3d/objectview";
import { RenderAtomic } from "@feng3d/renderer";

import { Component, RegisterComponent } from "../component/Component";
import { AddComponentMenu } from "../Menu";
import { Scene } from "../scene/Scene";
import { TextureCube } from "../textures/TextureCube";
import { Camera } from "../cameras/Camera";

export interface ComponentMap { SkyBox: SkyBox; }

/**
 * 天空盒组件
 */
@AddComponentMenu("SkyBox/SkyBox")
@RegisterComponent()
export class SkyBox extends Component
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
