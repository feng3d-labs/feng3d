module feng3d
{
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