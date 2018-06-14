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
        camera: Camera;

        bias = 0;

        radius = 1;

        mapSize = new Vector2(512, 512);

        map = null;

        matrix = new Matrix4x4();

        constructor(camera: Camera)
        {
            this.camera = camera;
        }
    }
}