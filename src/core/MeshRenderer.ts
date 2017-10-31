module feng3d
{
    export class MeshRenderer extends Component
    {
        get single() { return true; }

        /**
         * Returns the instantiated Mesh assigned to the mesh filter.
         */
        @serialize()
        @oav()
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
        private _geometry: Geometry;

        /**
         * 材质
         * Returns the first instantiated Material assigned to the renderer.
         */
        @serialize()
        @oav()
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
        private _material: Material;

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

        private onBoundsInvalid(event: EventVO<Geometry>)
        {
            this.gameObject.dispatch(<any>event.type, event.data);
        }
    }
}