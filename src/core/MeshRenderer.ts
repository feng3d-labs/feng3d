namespace feng3d
{
    export class MeshRenderer extends Component
    {
        get single() { return true; }

        /**
         * Returns the instantiated Mesh assigned to the mesh filter.
         */
        @oav({ componentParam: { dragparam: { accepttype: "geometry", datatype: "geometry" } } })
        @serialize()
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
                this.removeRenderDataHolder(this._geometry);
                this._geometry.off("boundsInvalid", this.onBoundsInvalid, this);
            }
            this._geometry = value;
            if (this._geometry)
            {
                this.addRenderDataHolder(this._geometry);
                this._geometry.on("boundsInvalid", this.onBoundsInvalid, this);
            }
        }
        private _geometry: Geometry = new CubeGeometry();

        /**
         * 材质
         * Returns the first instantiated Material assigned to the renderer.
         */
        @oav({ componentParam: { dragparam: { accepttype: "material", datatype: "material" } } })
        @serialize()
        get material() { return this._material }
        set material(value)
        {
            if (this._material == value)
                return;
            if (this._material)
                this.removeRenderDataHolder(this._material);
            this._material = value;
            if (this._material)
                this.addRenderDataHolder(this.material);
        }
        private _material: Material = new StandardMaterial();

        init(gameObject: GameObject)
        {
            super.init(gameObject);

            //
            this.createUniformData("u_modelMatrix", () => this.transform.localToWorldMatrix);
            this.createUniformData("u_ITModelMatrix", () => this.transform.ITlocalToWorldMatrix);
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