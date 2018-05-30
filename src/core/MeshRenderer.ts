namespace feng3d
{
    export interface ComponentRawMap
    {
        MeshRendererRaw: MeshRendererRaw
    }

    export interface MeshRendererRaw
    {
        __class__: "feng3d.MeshRenderer",
        geometry?: Geometrys,
        material?: ValueOf<MaterialRawMap>;
    }

    export class MeshRenderer extends Behaviour
    {
        get single() { return true; }

        /**
         * Returns the instantiated Mesh assigned to the mesh filter.
         */
        @oav({ component: "OAVPick", componentParam: { tooltip: "几何体，提供模型以形状", accepttype: "geometry", datatype: "geometry" } })
        @serialize
        get geometry()
        {
            return this._geometry;
        }
        set geometry(value)
        {
            if (this._geometry == value)
                return;
            if (this._geometry)
            {
                this._geometry.off("boundsInvalid", this.onBoundsInvalid, this);
            }
            this._geometry = value;
            if (this._geometry)
            {
                this._geometry.on("boundsInvalid", this.onBoundsInvalid, this);
            }
        }
        private _geometry: Geometry;

        /**
         * 材质
         * Returns the first instantiated Material assigned to the renderer.
         */
        @oav({ component: "OAVPick", componentParam: { tooltip: "材质，提供模型以皮肤", accepttype: "material", datatype: "material" } })
        @serialize
        @watch("materialChanged")
        material: Material;

        init(gameObject: GameObject)
        {
            super.init(gameObject);

            if (!this.geometry)
                this.geometry = new CubeGeometry();

            if (!this.material)
                this.material = materialFactory.create("standard");
        }

        preRender(renderAtomic: RenderAtomic)
        {
            renderAtomic.uniforms.u_modelMatrix = () => this.transform.localToWorldMatrix;
            renderAtomic.uniforms.u_ITModelMatrix = () => this.transform.ITlocalToWorldMatrix;
            renderAtomic.uniforms.u_mvMatrix = () => lazy.getvalue(renderAtomic.uniforms.u_modelMatrix).clone().append(lazy.getvalue(renderAtomic.uniforms.u_viewMatrix));
            renderAtomic.uniforms.u_ITMVMatrix = () => lazy.getvalue(renderAtomic.uniforms.u_mvMatrix).clone().invert().transpose();

            //
            this._geometry.preRender(renderAtomic);
            this.material.preRender(renderAtomic);
        }

        /**
         * 销毁
         */
        dispose()
        {
            this.geometry = <any>null;
            this.material = <any>null;
            super.dispose();
        }

        private onBoundsInvalid(event: Event<Geometry>)
        {
            if (this.gameObject)
                this.gameObject.dispatch(<any>event.type, event.data);
        }

        private materialChanged()
        {
            if (this.material && this.material.constructor == Object)
            {
                error("material 必须继承与 Material!");
            }
        }
    }
}