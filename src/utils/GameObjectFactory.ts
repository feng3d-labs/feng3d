namespace feng3d
{
    export var gameObjectFactory: GameObjectFactory;

    export class GameObjectFactory
    {
        createGameObject(name = "GameObject")
        {
            return serialization.setValue(new GameObject(), { name: name });
        }

        createCube(name = "cube")
        {
            return serialization.setValue(new GameObject(), {
                name: name,
                components: [{ __class__: "feng3d.MeshModel", geometry: Geometry.cube },]
            });
        }

        createPlane(name = "plane")
        {
            return serialization.setValue(new GameObject(), {
                name: name,
                components: [{ __class__: "feng3d.MeshModel", geometry: Geometry.plane },]
            });
        }

        createCylinder(name = "cylinder")
        {
            return serialization.setValue(new GameObject(), {
                name: name,
                components: [{ __class__: "feng3d.MeshModel", geometry: Geometry.cylinder },]
            });
        }

        createCone(name = "Cone")
        {
            return serialization.setValue(new GameObject(), {
                name: name,
                components: [{ __class__: "feng3d.MeshModel", geometry: Geometry.cone },]
            });
        }

        createTorus(name = "Torus")
        {
            return serialization.setValue(new GameObject(), {
                name: name,
                components: [{ __class__: "feng3d.MeshModel", geometry: Geometry.torus },]
            });
        }

        createSphere(name = "sphere")
        {
            return serialization.setValue(new GameObject(), {
                name: name,
                components: [{ __class__: "feng3d.MeshModel", geometry: Geometry.sphere },]
            });
        }

        createCapsule(name = "capsule")
        {
            return serialization.setValue(new GameObject(), {
                name: name,
                components: [{ __class__: "feng3d.MeshModel", geometry: Geometry.capsule },]
            });
        }

        createTerrain(name = "Terrain")
        {
            return serialization.setValue(new GameObject(), {
                name: name,
                components: [{ __class__: "feng3d.Terrain" },]
            });
        }

        createCamera(name = "Camera")
        {
            return serialization.setValue(new GameObject(), {
                name: name,
                components: [{ __class__: "feng3d.Camera" },]
            });
        }

        createPointLight(name = "PointLight")
        {
            return serialization.setValue(new GameObject(), {
                name: name,
                components: [{ __class__: "feng3d.PointLight" },]
            });
        }

        createDirectionalLight(name = "DirectionalLight")
        {
            return serialization.setValue(new GameObject(), {
                name: name,
                components: [{ __class__: "feng3d.DirectionalLight" },]
            });
        }

        createSpotLight(name = "SpotLight")
        {
            return serialization.setValue(new GameObject(), {
                name: name,
                components: [{ __class__: "feng3d.SpotLight" },]
            });
        }

        createParticle(name = "Particle")
        {
            return serialization.setValue(new GameObject(), {
                name: name,
                components: [{ __class__: "feng3d.Transform", rx: -90 }, { __class__: "feng3d.ParticleSystem" },],
            });
        }

        createWater(name = "water")
        {
            return serialization.setValue(new GameObject(), {
                name: name,
                components: [{ __class__: "feng3d.Water" },],
            });
        }
    }

    gameObjectFactory = new GameObjectFactory();
}