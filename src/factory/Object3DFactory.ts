module feng3d {

    /**
     * 3D对象工厂
     * @author feng 2016-12-19
     */
    export class Object3DFactory {

        /** 
         * 创建平面
         */
        public createPlane() {
            var object3D = new Object3D("plane");
            var mesh = object3D.getOrCreateComponentByClass(Mesh);
            mesh.geometry = primitives.createPlane();
            return object3D;
        }

        /** 
         * 创建立方体
         */
        public createCube() {
            var object3D = new Object3D("cube");
            var mesh = object3D.getOrCreateComponentByClass(Mesh);
            mesh.geometry = primitives.createCube();
            return object3D;
        }

        /** 
         * 创建球体
         */
        public createSphere() {
            var object3D = new Object3D("sphere");
            var mesh = object3D.getOrCreateComponentByClass(Mesh);
            mesh.geometry = primitives.createSphere();
            return object3D;
        }

        /** 
         * 创建胶囊
         */
        public createCapsule() {
            var object3D = new Object3D("capsule");
            var mesh = object3D.getOrCreateComponentByClass(Mesh);
            mesh.geometry = primitives.createCapsule();
            return object3D;
        }

        /** 
         * 创建圆柱体
         */
        public createCylinder() {
            var object3D = new Object3D("cylinder");
            var mesh = object3D.getOrCreateComponentByClass(Mesh);
            mesh.geometry = primitives.createCylinder();
            return object3D;
        }

        /**
         * 创建天空盒
         */
        public createSkyBox(images: HTMLImageElement[]) {
            var object3D = new Object3D("skyBox");
            object3D.getOrCreateComponentByClass(Mesh).geometry = primitives.createSkyBox();
            object3D.getOrCreateComponentByClass(MeshRenderer).material = new SkyBoxMaterial(images);
            return object3D;
        }
    }

    /**
     * 3D对象工厂
     */
    export var $object3DFactory = new Object3DFactory();
}