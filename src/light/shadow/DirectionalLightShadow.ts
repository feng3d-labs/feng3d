namespace feng3d
{
    export class DirectionalLightShadow extends LightShadow
    {
        constructor()
        {
            super();
            this.camera.lens = new OrthographicLens(- 0.5, 0.5, 0.5, - 0.5, 0.05, 500);
        }

        /**
         * 通过主摄像机进行更新
         * @param viewCamera 主摄像机
         */
        updateByCamera(viewCamera: Camera)
        {
            viewCamera
        }

        protected viewCameraChange()
        {
            this.viewCamera.viewBox

        }
    }
}