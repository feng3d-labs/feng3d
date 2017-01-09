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
            var mesh = object3D.getOrCreateComponentByClass(MeshFilter);
            mesh.geometry = primitives.createPlane();
            object3D.getOrCreateComponentByClass(MeshRenderer);
            return object3D;
        }

        /** 
         * 创建立方体
         */
        public createCube() {
            var object3D = new Object3D("cube");
            var mesh = object3D.getOrCreateComponentByClass(MeshFilter);
            mesh.geometry = primitives.createCube();
            object3D.getOrCreateComponentByClass(MeshRenderer);
            return object3D;
        }

        /** 
         * 创建球体
         */
        public createSphere() {
            var object3D = new Object3D("sphere");
            var mesh = object3D.getOrCreateComponentByClass(MeshFilter);
            mesh.geometry = primitives.createSphere();
            object3D.getOrCreateComponentByClass(MeshRenderer);
            return object3D;
        }

        /** 
         * 创建胶囊
         */
        public createCapsule() {
            var object3D = new Object3D("capsule");
            var mesh = object3D.getOrCreateComponentByClass(MeshFilter);
            mesh.geometry = primitives.createCapsule();
            object3D.getOrCreateComponentByClass(MeshRenderer);
            return object3D;
        }

        /** 
         * 创建圆柱体
         */
        public createCylinder() {
            var object3D = new Object3D("cylinder");
            var mesh = object3D.getOrCreateComponentByClass(MeshFilter);
            mesh.geometry = primitives.createCylinder();
            object3D.getOrCreateComponentByClass(MeshRenderer);
            return object3D;
        }

        /**
         * 创建天空盒
         */
        public createSkyBox(images: HTMLImageElement[]) {
            var object3D = new Object3D("skyBox");
            object3D.getOrCreateComponentByClass(MeshFilter).geometry = primitives.createSkyBox();
            object3D.getOrCreateComponentByClass(MeshRenderer).material = new SkyBoxMaterial(images);
            return object3D;
        }

        public createParticle() {
            var object3D = new Object3D("particle");
            object3D.getOrCreateComponentByClass(MeshFilter).geometry = new ParticleGeometry();
            object3D.getOrCreateComponentByClass(MeshRenderer).material = new ParticleMaterial();
            var particleAnimator = object3D.getOrCreateComponentByClass(ParticleAnimator);
            particleAnimator.addComponent(new ParticlePositionComponent());
            particleAnimator.addComponent(new ParticleVelocityComponent());
            return object3D;
        }
    }

    /**
     * 3D对象工厂
     */
    export var $object3DFactory = new Object3DFactory();
}