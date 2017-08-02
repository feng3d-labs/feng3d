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
        gameobject.transform.mouseEnabled = true;
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
}