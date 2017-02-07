module feng3d {

    /**
     * 胶囊体3D对象
     * @author feng 2017-02-06
     */
    export class CapsuleObject3D extends Object3D {

        /**
         * 构建3D对象
         */
        constructor(name = "capsule") {

            super(name);
            var mesh = this.getOrCreateComponentByClass(MeshFilter);
            mesh.geometry = new CapsuleGeometry();
            this.getOrCreateComponentByClass(MeshRenderer);
        }
    }
}