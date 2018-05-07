namespace feng3d
{
    export class MeshRenderer extends Behaviour
    {
        get single() { return true; }

        /**
         * Returns the instantiated Mesh assigned to the mesh filter.
         */
        @oav({ componentParam: { dragparam: { accepttype: "geometry", datatype: "geometry" } } })
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
        @oav({ componentParam: { dragparam: { accepttype: "material", datatype: "material" } } })
        @serialize
        get material() { return this._material }
        set material(value)
        {
            if (this._material == value)
                return;
            this._material = value;
        }
        private _material: Material;

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
            this._material.preRender(renderAtomic);
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
            this.gameObject.dispatch(<any>event.type, event.data);
        }
    }
}