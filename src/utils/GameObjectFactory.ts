namespace feng3d
{
    export var gameObjectFactory: GameObjectFactory;

    export class GameObjectFactory
    {
        createGameObject(name = "GameObject")
        {
            var gameobject = new GameObject({ name: name });
            return gameobject;
        }

        createCube(name: string = "cube")
        {
            var gameobject = new GameObject({ name: name });
            var model = gameobject.addComponent(Model);
            model.geometry = new CubeGeometry();
            return gameobject;
        }

        createPlane(name: string = "plane")
        {
            var gameobject = new GameObject({ name: name });
            var model = gameobject.addComponent(Model);
            model.geometry = new PlaneGeometry({ width: 10, height: 10 });
            model.material = new StandardMaterial();
            return gameobject;
        }

        createCylinder(name: string = "cylinder")
        {
            var gameobject = new GameObject({ name: name });
            var model = gameobject.addComponent(Model);
            model.geometry = new CylinderGeometry();
            model.material = new StandardMaterial();
            return gameobject;
        }

        createCone(name: string = "Cone")
        {
            var gameobject = new GameObject({ name: name });
            var model = gameobject.addComponent(Model);
            model.geometry = new ConeGeometry();
            model.material = new StandardMaterial();
            return gameobject;
        }

        createTorus(name: string = "Torus")
        {
            var gameobject = new GameObject({ name: name });
            var model = gameobject.addComponent(Model);
            model.geometry = new TorusGeometry();
            model.material = new StandardMaterial();
            return gameobject;
        }

        createTerrain(name: string = "Terrain")
        {
            var gameobject = new GameObject({ name: name });
            gameobject.addComponent(Terrain);
            return gameobject;
        }

        createSphere(name: string = "sphere")
        {
            var gameobject = new GameObject({ name: name });
            var model = gameobject.addComponent(Model);
            model.geometry = new SphereGeometry();
            model.material = new StandardMaterial();
            return gameobject;
        }

        createCapsule(name: string = "capsule")
        {
            var gameobject = new GameObject({ name: name });
            var model = gameobject.addComponent(Model);
            model.geometry = new CapsuleGeometry();
            model.material = new StandardMaterial();
            return gameobject;
        }

        createCamera(name: string = "Camera")
        {
            var gameobject = new GameObject({ name: name });
            gameobject.addComponent(Camera);
            return gameobject;
        }

        createPointLight(name: string = "PointLight")
        {
            var gameobject = new GameObject({ name: name });
            gameobject.addComponent(PointLight);
            return gameobject;
        }

        createParticle(name = "Particle")
        {
            var _particleMesh = new GameObject({ name: name });
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
            var gameobject = new GameObject({ name: name });
            gameobject.addComponent(Water);
            return gameobject;
        }
    }

    gameObjectFactory = new GameObjectFactory();
}