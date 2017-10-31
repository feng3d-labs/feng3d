module feng3d
{
    export interface RenderAtomicComponent extends RenderAtomic { }

    export class RenderAtomicComponent extends Component
    {
        /**
         * 顶点索引缓冲
         */
        indexBuffer: Index;

        /**
         * 渲染程序
         */
        shader = new Shader();

        /**
         * 属性数据列表
         */
        attributes: Attributes = <any>{};

        /**
         * Uniform渲染数据
         */
        uniforms: Uniforms = <any>{};

        /**
         * 渲染实例数量
         */
        instanceCount: number | (() => number);

        init(gameObject: GameObject)
        {
            super.init(gameObject)

            renderdatacollector.collectRenderDataHolder(this.gameObject, this);

            this.uniforms.u_mvMatrix = () => lazy.getvalue(this.uniforms.u_modelMatrix).clone().append(lazy.getvalue(this.uniforms.u_viewMatrix));
            this.uniforms.u_ITMVMatrix = () => lazy.getvalue(this.uniforms.u_mvMatrix).clone().invert().transpose();

            this.gameObject.on("renderdataChange", this.onrenderdataChange, this);
        }

        update()
        {
            this.changefuncs.forEach(element =>
            {
                element(this);
            });
            this.changefuncs.length = 0;
        }

        private onrenderdataChange(event: EventVO<updaterenderDataFunc | updaterenderDataFunc[]>)
        {
            this.changefuncs = this.changefuncs.concat(event.data);
        }

        private changefuncs: updaterenderDataFunc[] = [];
    }
}