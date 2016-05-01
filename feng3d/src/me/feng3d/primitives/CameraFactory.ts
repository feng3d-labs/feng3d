module me.feng3d.factory {

    /**
     * 创建摄像机3D对象
     */
    export function createCamera(): Object3D {

        var camera = new Object3D();
        camera.addComponent(new Camera());
        return camera;
    }
}