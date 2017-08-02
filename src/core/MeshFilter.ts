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
        get mesh()
        {
            return this._mesh;
        }
        set mesh(value)
        {
            if (this._mesh == value)
                return;
            if (this.mesh)
            {
                this.removeRenderDataHolder(this.mesh);
            }
            this._mesh = value;
            if (this.mesh)
            {
                this.addRenderDataHolder(this.mesh);
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