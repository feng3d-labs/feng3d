var feng3d;
(function (feng3d) {
    feng3d.GameObjectFactory = {
        create: create,
        createCube: createCube,
        createPlane: createPlane,
        createCylinder: createCylinder,
        createSphere: createSphere,
        createCapsule: createCapsule,
    };
    function create(name) {
        if (name === void 0) { name = "GameObject"; }
        var gameobject = feng3d.GameObject.create(name);
        gameobject.mouseEnabled = true;
        if (name == "GameObject")
            return gameobject;
        gameobject.addComponent(feng3d.MeshRenderer).material = new feng3d.StandardMaterial();
        var meshFilter = gameobject.addComponent(feng3d.MeshFilter);
        switch (name) {
            case "Plane":
                meshFilter.mesh = new feng3d.PlaneGeometry();
                break;
            case "Cube":
                meshFilter.mesh = new feng3d.CubeGeometry();
                break;
            case "Sphere":
                meshFilter.mesh = new feng3d.SphereGeometry();
                break;
            case "Capsule":
                meshFilter.mesh = new feng3d.CapsuleGeometry();
                break;
            case "Cylinder":
                meshFilter.mesh = new feng3d.CylinderGeometry();
                break;
            case "Cone":
                meshFilter.mesh = new feng3d.ConeGeometry();
                break;
            case "Torus":
                meshFilter.mesh = new feng3d.TorusGeometry();
                break;
            case "Particle":
                meshFilter.mesh = new feng3d.TorusGeometry();
                break;
        }
        return gameobject;
    }
    function createCube(name) {
        if (name === void 0) { name = "cube"; }
        var gameobject = feng3d.GameObject.create(name);
        var model = gameobject.addComponent(feng3d.MeshRenderer);
        gameobject.addComponent(feng3d.MeshFilter).mesh = new feng3d.CubeGeometry();
        model.material = new feng3d.StandardMaterial();
        return gameobject;
    }
    function createPlane(name) {
        if (name === void 0) { name = "plane"; }
        var gameobject = feng3d.GameObject.create(name);
        var model = gameobject.addComponent(feng3d.MeshRenderer);
        gameobject.addComponent(feng3d.MeshFilter).mesh = new feng3d.PlaneGeometry();
        model.material = new feng3d.StandardMaterial();
        return gameobject;
    }
    function createCylinder(name) {
        if (name === void 0) { name = "cylinder"; }
        var gameobject = feng3d.GameObject.create(name);
        var model = gameobject.addComponent(feng3d.MeshRenderer);
        gameobject.addComponent(feng3d.MeshFilter).mesh = new feng3d.CylinderGeometry();
        model.material = new feng3d.StandardMaterial();
        return gameobject;
    }
    function createSphere(name) {
        if (name === void 0) { name = "sphere"; }
        var gameobject = feng3d.GameObject.create(name);
        var model = gameobject.addComponent(feng3d.MeshRenderer);
        gameobject.addComponent(feng3d.MeshFilter).mesh = new feng3d.SphereGeometry();
        model.material = new feng3d.StandardMaterial();
        return gameobject;
    }
    function createCapsule(name) {
        if (name === void 0) { name = "capsule"; }
        var gameobject = feng3d.GameObject.create(name);
        var model = gameobject.addComponent(feng3d.MeshRenderer);
        gameobject.addComponent(feng3d.MeshFilter).mesh = new feng3d.CapsuleGeometry();
        model.material = new feng3d.StandardMaterial();
        return gameobject;
    }
    function createParticle(name) {
        if (name === void 0) { name = "Particle"; }
        var _particleMesh = feng3d.GameObject.create("particle");
        _particleMesh.addComponent(feng3d.MeshFilter).mesh = new feng3d.PlaneGeometry(10, 10, 1, 1, false);
        var material = _particleMesh.addComponent(feng3d.MeshRenderer).material = new feng3d.PointMaterial();
        material.enableBlend = true;
        var particleAnimationSet = new feng3d.ParticleAnimationSet();
        particleAnimationSet.numParticles = 20000;
        //通过函数来创建粒子初始状态
        particleAnimationSet.generateFunctions.push({
            generate: function (particle) {
                particle.birthTime = Math.random() * 5 - 5;
                particle.lifetime = 5;
                var degree1 = Math.random() * Math.PI;
                var degree2 = Math.random() * Math.PI * 2;
                var r = Math.random() * 50 + 400;
                particle.velocity = new feng3d.Vector3D(r * Math.sin(degree1) * Math.cos(degree2), r * Math.cos(degree1) * Math.cos(degree2), r * Math.sin(degree2));
            }, priority: 0
        });
        var particleAnimator = _particleMesh.addComponent(feng3d.ParticleAnimator);
        particleAnimator.animatorSet = particleAnimationSet;
        particleAnimator.cycle = 10;
        return _particleMesh;
    }
})(feng3d || (feng3d = {}));
//# sourceMappingURL=GameObjectFactory.js.map