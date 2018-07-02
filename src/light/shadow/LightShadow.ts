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

        constructor()
        {
            this.camera = GameObject.create("LightShadowCamera").addComponent(Camera);
        }
    }
}