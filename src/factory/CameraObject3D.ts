module feng3d
{
    /**
     * 摄像机3D对象
     * @author feng 2017-02-06
     */
    export class CameraObject3D extends Object3D
    {
        public camera: Camera3D;

        constructor(name = "camera")
        {
            super(name);
            this.camera = new Camera3D();
            this.addComponent(this.camera);
        }
    }
}