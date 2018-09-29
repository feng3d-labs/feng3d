namespace feng3d
{
    export var gameObjectFactory: GameObjectFactory;

    export class GameObjectFactory
    {
        createGameObject(name = "GameObject")
        {
            return new GameObject().value({ name: name });
        }

        createCube(name = "cube")
        {
            return new GameObject().value({
                name: name,
                components: [{ __class__: "feng3d.MeshModel", geometry: Geometry.cube },]
            });
        }

        createPlane(name = "plane")
        {
            return new GameObject().value({
                name: name,
                components: [{ __class__: "feng3d.MeshModel", geometry: Geometry.plane },]
            });
        }

        createCylinder(name = "cylinder")
        {
            return new GameObject().value({
                name: name,
                components: [{ __class__: "feng3d.MeshModel", geometry: Geometry.cylinder },]
            });
        }

        createCone(name = "Cone")
        {
            return new GameObject().value({
                name: name,
                components: [{ __class__: "feng3d.MeshModel", geometry: Geometry.cone },]
            });
        }

        createTorus(name = "Torus")
        {
            return new GameObject().value({
                name: name,
                components: [{ __class__: "feng3d.MeshModel", geometry: Geometry.torus },]
            });
        }

        createSphere(name = "sphere")
        {
            return new GameObject().value({
                name: name,
                components: [{ __class__: "feng3d.MeshModel", geometry: Geometry.sphere },]
            });
        }

        createCapsule(name = "capsule")
        {
            return new GameObject().value({
                name: name,
                components: [{ __class__: "feng3d.MeshModel", geometry: Geometry.capsule },]
            });
        }

        createTerrain(name = "Terrain")
        {
            return new GameObject().value({
                name: name,
                components: [{ __class__: "feng3d.Terrain" },]
            });
        }

        createCamera(name = "Camera")
        {
            return new GameObject().value({
                name: name,
                components: [{ __class__: "feng3d.Camera" },]
            });
        }

        createPointLight(name = "PointLight")
        {
            return new GameObject().value({
                name: name,
                components: [{ __class__: "feng3d.PointLight" },]
            });
        }

        createDirectionalLight(name = "DirectionalLight")
        {
            return new GameObject().value({
                name: name,
                components: [{ __class__: "feng3d.DirectionalLight" },]
            });
        }

        createSpotLight(name = "SpotLight")
        {
            return new GameObject().value({
                name: name,
                components: [{ __class__: "feng3d.SpotLight" },]
            });
        }

        createParticle(name = "Particle")
        {
            return new GameObject().value({
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

        createWater(name = "water")
        {
            return new GameObject().value({
                name: name,
                components: [{ __class__: "feng3d.Water" },],
            });
        }
    }

    gameObjectFactory = new GameObjectFactory();
}