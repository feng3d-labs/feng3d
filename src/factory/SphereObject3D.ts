module feng3d
{

    /**
     * 球体3D对象
     * @author feng 2017-02-06
     */
    export class SphereObject3D extends Object3D
    {

        /**
         * 构建3D对象
         */
        constructor(name = "sphere")
        {

            super(name);
            var mesh = this.getOrCreateComponentByClass(MeshFilter);
            mesh.geometry = new SphereGeometry();
            this.getOrCreateComponentByClass(MeshRenderer);
        }
    }
}