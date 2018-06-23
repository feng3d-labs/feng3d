namespace feng3d
{
    /**
     * 灯光阴影
     * 
     * #### 参考
     * 1. https://github.com/mrdoob/three.js/blob/dev/src/lights/LightShadow.js
     */
    export class LightShadow
    {
        /**
         * 投影摄像机
         */
        camera: Camera;

        bias = 0;

        radius = 1;

        /**
         * 阴影图尺寸
         */
        mapSize = new Vector2(512, 512);

        map = null;

        matrix = new Matrix4x4();

        /**
         * 观察摄像机
         */
        @watch("viewCameraChange")
        viewCamera: Camera;

        // /**
        //  * 是否失效
        //  */
        // protected invalid = true;

        constructor()
        {
            this.camera = GameObject.create("LightShadowCamera").addComponent(Camera);
        }

        protected viewCameraChange()
        {
            // this.invalid = true;
        }
    }
}