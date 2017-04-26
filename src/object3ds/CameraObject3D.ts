module feng3d
{
    /**
     * 摄像机3D对象
     * @author feng 2017-02-06
     */
    export class CameraObject3D extends GameObject
    {
        public camera: Camera;

        constructor(name = "camera")
        {
            super(name);
            this.camera = new PerspectiveCamera();
            this.addComponent(this.camera);
        }
    }
}