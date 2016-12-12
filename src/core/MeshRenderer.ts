module feng3d {

    /**
     * 网格渲染器
     * @author feng 2016-12-12
     */
    export class MeshRenderer extends Object3DComponent {

        private _material: Material;

        /**
         * 材质
         */
        public get material(): Material {

            return this._material;
        }

        public set material(value: Material) {

            this._material && this.removeComponent(this._material);
            this._material = value;
            this._material && this.addComponent(this._material);
        }

        constructor() {
            
            super();
            this.material = new Material();
        }

    }
}