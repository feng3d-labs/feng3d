namespace feng3d
{
    export var GameObjectFactory = {
        create: create,
        createGameObject: createGameObject,
        createCube: createCube,
        createPlane: createPlane,
        createCylinder: createCylinder,
        createSphere: createSphere,
        createCapsule: createCapsule,
        createCone: createCone,
        createTorus: createTorus,
        createParticle: createParticle,
        createCamera: createCamera,
        createPointLight: createPointLight,
    }

    function create(name = "GameObject")
    {
        var gameobject = GameObject.create(name);
        gameobject.mouseEnabled = true;
        if (name == "GameObject")
            return gameobject;
        var meshRenderer = gameobject.addComponent(MeshRenderer);
        meshRenderer.material = new StandardMaterial();
        switch (name)
        {
            case "Plane":
                meshRenderer.geometry = new PlaneGeometry();
                break;
            case "Cube":
                meshRenderer.geometry = new CubeGeometry();
                break;
            case "Sphere":
                meshRenderer.geometry = new SphereGeometry();
                break;
            case "Capsule":
                meshRenderer.geometry = new CapsuleGeometry();
                break;
            case "Cylinder":
                meshRenderer.geometry = new CylinderGeometry();
                break;
            case "Cone":
                meshRenderer.geometry = new ConeGeometry();
                break;
            case "Torus":
                meshRenderer.geometry = new TorusGeometry();
                break;
            case "Particle":
                meshRenderer.geometry = new TorusGeometry();
                break;
        }
        return gameobject;
    }

    function createGameObject(name = "GameObject")
    {
        var gameobject = GameObject.create(name);
        return gameobject;
    }

    function createCube(name: string = "cube")
    {
        var gameobject = GameObject.create(name);
        var model = gameobject.addComponent(MeshRenderer);
        model.geometry = new CubeGeometry();
        model.material = new StandardMaterial();
        return gameobject;
    }

    function createPlane(name: string = "plane")
    {
        var gameobject = GameObject.create(name);
        var model = gameobject.addComponent(MeshRenderer);
        model.geometry = new PlaneGeometry();
        model.material = new StandardMaterial();
        return gameobject;
    }

    function createCylinder(name: string = "cylinder")
    {
        var gameobject = GameObject.create(name);
        var model = gameobject.addComponent(MeshRenderer);
        model.geometry = new CylinderGeometry();
        model.material = new StandardMaterial();
        return gameobject;
    }

    function createCone(name: string = "Cone")
    {
        var gameobject = GameObject.create(name);
        var model = gameobject.addComponent(MeshRenderer);
        model.geometry = new ConeGeometry();
        model.material = new StandardMaterial();
        return gameobject;
    }

    function createTorus(name: string = "Torus")
    {
        var gameobject = GameObject.create(name);
        var model = gameobject.addComponent(MeshRenderer);
        model.geometry = new TorusGeometry();
        model.material = new StandardMaterial();
        return gameobject;
    }

    function createSphere(name: string = "sphere")
    {
        var gameobject = GameObject.create(name);
        var model = gameobject.addComponent(MeshRenderer);
        model.geometry = new SphereGeometry();
        model.material = new StandardMaterial();
        return gameobject;
    }

    function createCapsule(name: string = "capsule")
    {
        var gameobject = GameObject.create(name);
        var model = gameobject.addComponent(MeshRenderer);
        model.geometry = new CapsuleGeometry();
        model.material = new StandardMaterial();
        return gameobject;
    }

    function createCamera(name: string = "Camera")
    {
        var gameobject = GameObject.create(name);
        gameobject.addComponent(Camera);
        return gameobject;
    }

    function createPointLight(name: string = "PointLight")
    {
        var gameobject = GameObject.create(name);
        gameobject.addComponent(PointLight);
        return gameobject;
    }

    function createParticle(name = "Particle")
    {
        var _particleMesh = GameObject.create("particle");
        var meshRenderer = _particleMesh.addComponent(MeshRenderer);
        meshRenderer.geometry = new PointGeometry();
        var material = meshRenderer.material = new StandardMaterial();
        material.renderMode = RenderMode.POINTS;

        var particleAnimator = _particleMesh.addComponent(ParticleAnimator);
        particleAnimator.numParticles = 1000;
        //通过函数来创建粒子初始状态
        particleAnimator.generateFunctions.push({
            generate: (particle) =>
            {
                particle.birthTime = Math.random() * 5 - 5;
                particle.lifetime = 5;
                var degree2 = Math.random() * Math.PI * 2;
                var r = Math.random() * 100;
                particle.velocity = new Vector3D(r * Math.cos(degree2), r * 2, r * Math.sin(degree2));
            }, priority: 0
        });
        particleAnimator.cycle = 10;
        return _particleMesh;
    }
}