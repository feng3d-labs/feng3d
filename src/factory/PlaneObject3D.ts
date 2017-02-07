module feng3d {

    /**
     * 平面3D对象
     * @author feng 2017-02-06
     */
    export class PlaneObject3D extends Object3D {

        /**
         * 构建3D对象
         */
        constructor(name = "plane") {
            
            super(name);
            var mesh = this.getOrCreateComponentByClass(MeshFilter);
            mesh.geometry = new PlaneGeometry();
            this.getOrCreateComponentByClass(MeshRenderer);
        }
    }
}