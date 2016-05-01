module me.feng3d.factory {

    /**
     * 创建摄像机3D对象
     */
    export function createCamera(): Object3D {

        var camera = new Object3D();
        camera.addComponent(new Camera());
        return camera;
    }

    /**
     * 创建3D基元对象
     */
    export function createPrimitive(primitive: PrimitiveType): Object3D {

        var plane = new Object3D();

        switch (primitive) {
            case PrimitiveType.Plane:
                plane.addComponent(primitives.createPlane());
                break;
            default:
                throw `无法创建3D基元对象 ${primitive}`;
        }

        return plane;
    }
}