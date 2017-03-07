module feng3d
{
    /**
     * 平面3D对象
     * @author feng 2017-02-06
     */
    export class PlaneObject3D extends Object3D
    {
        public planeGeometry: PlaneGeometry;

        /**
         * 构建3D对象
         */
        constructor(width = 100, name = "plane")
        {
            super(name);
            var mesh = this.getOrCreateComponentByClass(MeshFilter);
            this.planeGeometry = mesh.geometry = new PlaneGeometry(width, width);
            this.getOrCreateComponentByClass(MeshRenderer);
        }
    }
}