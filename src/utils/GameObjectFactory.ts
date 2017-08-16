namespace feng3d
{
    export var GameObjectFactory = {
        create: create,
        createCube: createCube,
        createPlane: createPlane,
        createCylinder: createCylinder,
        createSphere: createSphere,
        createCapsule: createCapsule,
    }

    function create(name = "GameObject")
    {
        var gameobject = GameObject.create(name);
        gameobject.mouseEnabled = true;
        if (name == "GameObject")
            return gameobject;
        gameobject.addComponent(MeshRenderer).material = new StandardMaterial();
        var meshFilter = gameobject.addComponent(MeshFilter);
        switch (name)
        {
            case "Plane":
                meshFilter.mesh = new PlaneGeometry();
                break;
            case "Cube":
                meshFilter.mesh = new CubeGeometry();
                break;
            case "Sphere":
                meshFilter.mesh = new SphereGeometry();
                break;
            case "Capsule":
                meshFilter.mesh = new CapsuleGeometry();
                break;
            case "Cylinder":
                meshFilter.mesh = new CylinderGeometry();
                break;
            case "Cone":
                meshFilter.mesh = new ConeGeometry();
                break;
            case "Torus":
                meshFilter.mesh = new TorusGeometry();
                break;
            case "Particle":
                meshFilter.mesh = new TorusGeometry();
                break;
        }
        return gameobject;
    }

    function createCube(name: string = "cube")
    {
        var gameobject = GameObject.create(name);
        var model = gameobject.addComponent(MeshRenderer);
        gameobject.addComponent(MeshFilter).mesh = new CubeGeometry();
        model.material = new StandardMaterial();
        return gameobject;
    }

    function createPlane(name: string = "plane")
    {
        var gameobject = GameObject.create(name);
        var model = gameobject.addComponent(MeshRenderer);
        gameobject.addComponent(MeshFilter).mesh = new PlaneGeometry();
        model.material = new StandardMaterial();
        return gameobject;
    }

    function createCylinder(name: string = "cylinder")
    {
        var gameobject = GameObject.create(name);
        var model = gameobject.addComponent(MeshRenderer);
        gameobject.addComponent(MeshFilter).mesh = new CylinderGeometry();
        model.material = new StandardMaterial();
        return gameobject;
    }

    function createSphere(name: string = "sphere")
    {
        var gameobject = GameObject.create(name);
        var model = gameobject.addComponent(MeshRenderer);
        gameobject.addComponent(MeshFilter).mesh = new SphereGeometry();
        model.material = new StandardMaterial();
        return gameobject;
    }

    function createCapsule(name: string = "capsule")
    {
        var gameobject = GameObject.create(name);
        var model = gameobject.addComponent(MeshRenderer);
        gameobject.addComponent(MeshFilter).mesh = new CapsuleGeometry();
        model.material = new StandardMaterial();
        return gameobject;
    }

    function createParticle(name = "Particle")
    {
        var _particleMesh = GameObject.create("particle");
        _particleMesh.addComponent(MeshFilter).mesh = new PlaneGeometry(10, 10, 1, 1, false);
        var material = _particleMesh.addComponent(MeshRenderer).material = new PointMaterial();
        material.enableBlend = true;

        var particleAnimationSet = new ParticleAnimationSet();
        particleAnimationSet.numParticles = 20000;
        //通过函数来创建粒子初始状态
        particleAnimationSet.generateFunctions.push({
            generate: (particle) =>
            {
                particle.birthTime = Math.random() * 5 - 5;
                particle.lifetime = 5;
                var degree1 = Math.random() * Math.PI;
                var degree2 = Math.random() * Math.PI * 2;
                var r = Math.random() * 50 + 400;
                particle.velocity = new Vector3D(r * Math.sin(degree1) * Math.cos(degree2), r * Math.cos(degree1) * Math.cos(degree2), r * Math.sin(degree2));
            }, priority: 0
        });
        var particleAnimator = _particleMesh.addComponent(ParticleAnimator);
        particleAnimator.animatorSet = particleAnimationSet;
        particleAnimator.cycle = 10;
        return _particleMesh;
    }
}