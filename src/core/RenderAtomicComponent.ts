namespace feng3d
{
    // export interface RenderAtomicComponent extends RenderAtomic { }

    export class RenderAtomicComponent extends Component
    {
        showInInspector = false;
        serializable = false;
        
        readonly renderAtomic = new RenderAtomic();

        init(gameObject: GameObject)
        {
            super.init(gameObject)

            renderdatacollector.collectRenderDataHolder(this.gameObject, this.renderAtomic);

            var uniforms = this.renderAtomic.uniforms;
            uniforms.u_mvMatrix = () => lazy.getvalue(uniforms.u_modelMatrix).clone().append(lazy.getvalue(uniforms.u_viewMatrix));
            uniforms.u_ITMVMatrix = () => lazy.getvalue(uniforms.u_mvMatrix).clone().invert().transpose();

            this.gameObject.on("renderdataChange", this.onrenderdataChange, this);
        }

        update()
        {
            this.changefuncs.forEach(element =>
            {
                element(this.renderAtomic);
            });
            this.changefuncs.length = 0;
        }

        private onrenderdataChange(event: Event<updaterenderDataFunc | updaterenderDataFunc[]>)
        {
            this.changefuncs = this.changefuncs.concat(event.data);
        }

        private changefuncs: updaterenderDataFunc[] = [];
    }
}