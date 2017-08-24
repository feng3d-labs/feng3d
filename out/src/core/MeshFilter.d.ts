declare namespace feng3d {
    /**
     * A class to access the Mesh of the mesh filter.
     * Use this with a procedural mesh interface. See Also: Mesh class.
     */
    class MeshFilter extends Component {
        /**
         * Returns the instantiated Mesh assigned to the mesh filter.
         */
        mesh: Geometry;
        private _mesh;
        constructor(gameObject: GameObject);
        /**
         * 销毁
         */
        dispose(): void;
    }
}
