namespace feng3d
{
    export var gameObjectFactory: GameObjectFactory;

    export class GameObjectFactory
    {
        createGameObject(name = "GameObject")
        {
            return Object.setValue(new GameObject(), { name: name });
        }

        createCube(name = "cube")
        {
            return Object.setValue(new GameObject(), {
                name: name,
                components: [{ __class__: "feng3d.MeshModel", geometry: Geometry.cube },]
            });
        }

        createPlane(name = "plane")
        {
            return Object.setValue(new GameObject(), {
                name: name,
                components: [{ __class__: "feng3d.MeshModel", geometry: Geometry.plane },]
            });
        }

        createCylinder(name = "cylinder")
        {
            return Object.setValue(new GameObject(), {
                name: name,
                components: [{ __class__: "feng3d.MeshModel", geometry: Geometry.cylinder },]
            });
        }

        createCone(name = "Cone")
        {
            return Object.setValue(new GameObject(), {
                name: name,
                components: [{ __class__: "feng3d.MeshModel", geometry: Geometry.cone },]
            });
        }

        createTorus(name = "Torus")
        {
            return Object.setValue(new GameObject(), {
                name: name,
                components: [{ __class__: "feng3d.MeshModel", geometry: Geometry.torus },]
            });
        }

        createSphere(name = "sphere")
        {
            return Object.setValue(new GameObject(), {
                name: name,
                components: [{ __class__: "feng3d.MeshModel", geometry: Geometry.sphere },]
            });
        }

        createCapsule(name = "capsule")
        {
            return Object.setValue(new GameObject(), {
                name: name,
                components: [{ __class__: "feng3d.MeshModel", geometry: Geometry.capsule },]
            });
        }

        createTerrain(name = "Terrain")
        {
            return Object.setValue(new GameObject(), {
                name: name,
                components: [{ __class__: "feng3d.Terrain" },]
            });
        }

        createCamera(name = "Camera")
        {
            return Object.setValue(new GameObject(), {
                name: name,
                components: [{ __class__: "feng3d.Camera" },]
            });
        }

        createPointLight(name = "PointLight")
        {
            return Object.setValue(new GameObject(), {
                name: name,
                components: [{ __class__: "feng3d.PointLight" },]
            });
        }

        createDirectionalLight(name = "DirectionalLight")
        {
            return Object.setValue(new GameObject(), {
                name: name,
                components: [{ __class__: "feng3d.DirectionalLight" },]
            });
        }

        createSpotLight(name = "SpotLight")
        {
            return Object.setValue(new GameObject(), {
                name: name,
                components: [{ __class__: "feng3d.SpotLight" },]
            });
        }

        createParticle(name = "Particle")
        {
            return Object.setValue(new GameObject(), {
                name: name,
                components: [{ __class__: "feng3d.Transform", rx: -90 }, { __class__: "feng3d.ParticleSystem" },],
            });
        }

        createWater(name = "water")
        {
            return Object.setValue(new GameObject(), {
                name: name,
                components: [{ __class__: "feng3d.Water" },],
            });
        }
    }

    gameObjectFactory = new GameObjectFactory();
}