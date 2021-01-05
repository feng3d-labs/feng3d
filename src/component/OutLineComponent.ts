
@AddComponentMenu("Rendering/OutLineComponent")
@RegisterComponent()
export class OutLineComponent extends Component
{
    __class__: "feng3d.OutLineComponent";

    @oav()
    @serialize
    size = 1;

    @oav()
    @serialize
    color = new Color4(0.2, 0.2, 0.2, 1.0);

    @oav()
    @serialize
    outlineMorphFactor = 0.0;

    beforeRender(renderAtomic: RenderAtomic, scene: Scene, camera: Camera)
    {
        renderAtomic.uniforms.u_outlineSize = this.size;
        renderAtomic.uniforms.u_outlineColor = this.color;
        renderAtomic.uniforms.u_outlineMorphFactor = this.outlineMorphFactor;
    }
}
