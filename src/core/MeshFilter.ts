namespace feng3d
{
    /**
     * A class to access the Mesh of the mesh filter.
     * Use this with a procedural mesh interface. See Also: Mesh class.
     */
    export class MeshFilter extends Component
    {
        /**
         * Returns the instantiated Mesh assigned to the mesh filter.
         */
        @serialize
        get mesh()
        {
            return this._mesh;
        }
        set mesh(value)
        {
            if (this._mesh == value)
                return;
            if (this._mesh)
            {
                this.removeRenderDataHolder(this._mesh);
            }
            this._mesh = value;
            if (this._mesh)
            {
                this.addRenderDataHolder(this._mesh);
            }
        }
        private _mesh: Geometry;

        constructor(gameObject: GameObject)
        {
            super(gameObject);
        }

        /**
         * 销毁
         */
        dispose()
        {
            this.mesh = null;
            super.dispose();
        }
    }
}