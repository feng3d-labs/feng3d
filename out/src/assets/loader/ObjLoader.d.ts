declare namespace feng3d {
    /**
     * Obj模型加载类
     * @author feng 2017-01-18
     */
    var ObjLoader: {
        load: (url: string, material: Material, completed?: (object3D: GameObject) => void) => void;
    };
}
