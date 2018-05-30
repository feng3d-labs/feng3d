namespace feng3d
{
    export var gameObjectFactory: GameObjectFactory;

    export class GameObjectFactory
    {
        createGameObject(name = "GameObject")
        {
            var gameobject = GameObject.create(name);
            return gameobject;
        }

        createCube(name: string = "cube")
        {
            var gameobject = GameObject.create(name);
            var model = gameobject.addComponent(MeshRenderer);
            model.geometry = new CubeGeometry();
            return gameobject;
        }

        createPlane(name: string = "plane")
        {
            var gameobject = GameObject.create(name);
            var model = gameobject.addComponent(MeshRenderer);
            model.geometry = new PlaneGeometry();
            model.material = materialFactory.create("standard");
            return gameobject;
        }

        createCylinder(name: string = "cylinder")
        {
            var gameobject = GameObject.create(name);
            var model = gameobject.addComponent(MeshRenderer);
            model.geometry = new CylinderGeometry();
            model.material = materialFactory.create("standard");
            return gameobject;
        }

        createCone(name: string = "Cone")
        {
            var gameobject = GameObject.create(name);
            var model = gameobject.addComponent(MeshRenderer);
            model.geometry = new ConeGeometry();
            model.material = materialFactory.create("standard");
            return gameobject;
        }

        createTorus(name: string = "Torus")
        {
            var gameobject = GameObject.create(name);
            var model = gameobject.addComponent(MeshRenderer);
            model.geometry = new TorusGeometry();
            model.material = materialFactory.create("standard");
            return gameobject;
        }

        createTerrain(name: string = "Terrain")
        {
            var gameobject = GameObject.create(name);
            gameobject.addComponent(Terrain);
            return gameobject;
        }

        createSphere(name: string = "sphere")
        {
            var gameobject = GameObject.create(name);
            var model = gameobject.addComponent(MeshRenderer);
            model.geometry = new SphereGeometry();
            model.material = materialFactory.create("standard");
            return gameobject;
        }

        createCapsule(name: string = "capsule")
        {
            var gameobject = GameObject.create(name);
            var model = gameobject.addComponent(MeshRenderer);
            model.geometry = new CapsuleGeometry();
            model.material = materialFactory.create("standard");
            return gameobject;
        }

        createCamera(name: string = "Camera")
        {
            var gameobject = GameObject.create(name);
            gameobject.addComponent(Camera);
            return gameobject;
        }

        createPointLight(name: string = "PointLight")
        {
            var gameobject = GameObject.create(name);
            gameobject.addComponent(PointLight);
            return gameobject;
        }

        createParticle(name = "Particle")
        {
            var _particleMesh = GameObject.create("particle");
            var particleSystem = _particleMesh.addComponent(ParticleSystem);

            // particleSystem.numParticles = 1000;
            // //通过函数来创建粒子初始状态
            // particleSystem.generateFunctions.push({
            //     generate: (particle) =>
            //     {
            //         particle.birthTime = Math.random() * 5 - 5;
            //         particle.lifetime = 5;
            //         var degree2 = Math.random() * Math.PI * 2;
            //         var r = Math.random() * 1;
            //         particle.velocity = new Vector3(r * Math.cos(degree2), r * 2, r * Math.sin(degree2));
            //     }, priority: 0
            // });
            // particleSystem.cycle = 10;
            return _particleMesh;
        }

        createWater(name: string = "water")
        {
            var gameobject = GameObject.create(name);
            gameobject.addComponent(Water);
            return gameobject;
        }
    }

    gameObjectFactory = new GameObjectFactory();
}