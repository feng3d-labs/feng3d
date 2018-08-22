namespace feng3d
{
    export var gameObjectFactory: GameObjectFactory;

    export class GameObjectFactory
    {
        createGameObject(name = "GameObject")
        {
            return new GameObject({ name: name });
        }

        createCube(name: string = "cube")
        {
            return new GameObject({
                name: name, components: [
                    { __class__: "feng3d.Model", geometry: new CubeGeometry() },
                ]
            });
        }

        createPlane(name: string = "plane")
        {
            return new GameObject({
                name: name,
                components: [{ __class__: "feng3d.Model", geometry: new PlaneGeometry({ width: 10, height: 10 }) },]
            });
        }

        createCylinder(name: string = "cylinder")
        {
            return new GameObject({
                name: name,
                components: [{ __class__: "feng3d.Model", geometry: new CylinderGeometry() },]
            });
        }

        createCone(name: string = "Cone")
        {
            return new GameObject({
                name: name,
                components: [{ __class__: "feng3d.Model", geometry: new ConeGeometry() },]
            });
        }

        createTorus(name: string = "Torus")
        {
            return new GameObject({
                name: name,
                components: [{ __class__: "feng3d.Model", geometry: new TorusGeometry() },]
            });
        }

        createSphere(name: string = "sphere")
        {
            return new GameObject({
                name: name,
                components: [{ __class__: "feng3d.Model", geometry: new SphereGeometry() },]
            });
        }

        createCapsule(name: string = "capsule")
        {
            return new GameObject({
                name: name,
                components: [{ __class__: "feng3d.Model", geometry: new CapsuleGeometry() },]
            });
        }

        createTerrain(name: string = "Terrain")
        {
            return new GameObject({
                name: name,
                components: [{ __class__: "feng3d.Terrain" },]
            });
        }

        createCamera(name: string = "Camera")
        {
            return new GameObject({
                name: name,
                components: [{ __class__: "feng3d.Camera" },]
            });
        }

        createPointLight(name: string = "PointLight")
        {
            return new GameObject({
                name: name,
                components: [{ __class__: "feng3d.PointLight" },]
            });
        }

        createParticle(name = "Particle")
        {
            return new GameObject({
                name: name,
                components: [{ __class__: "feng3d.ParticleSystem" },],
            });

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
        }

        createWater(name: string = "water")
        {
            return new GameObject({
                name: name,
                components: [{ __class__: "feng3d.Water" },],
            });
        }
    }

    gameObjectFactory = new GameObjectFactory();
}