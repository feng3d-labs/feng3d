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
        public get mesh()
        {
            return this._mesh || defaultGeometry;
        }
        public set mesh(value)
        {
            if (this._mesh == value)
                return;
            if(this._mesh)
            {
                this.removeRenderDataHolder(this.mesh);
            }
            this._mesh = value;
            this.addRenderDataHolder(this.mesh);
        }
        private _mesh: Geometry;

        constructor()
        {
            super();
            this.addRenderDataHolder(this.mesh);
        }
    }
}