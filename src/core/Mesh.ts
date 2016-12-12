module feng3d {

    /**
     * 网格
     * @author feng 2016-12-12
     */
    export class Mesh extends Object3DComponent {

        private _geometry: Geometry;

        /**
         * 几何体
         */
        public get geometry(): Geometry {

            return this._geometry;
        }

        public set geometry(value: Geometry) {

            this._geometry && this.removeComponent(this._geometry);
            this._geometry = value;
            this._geometry && this.addComponent(this._geometry);
        }

    }
}