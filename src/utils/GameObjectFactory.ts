namespace feng3d
{
    export var gameObjectFactory: GameObjectFactory;

    export class GameObjectFactory
    {
        createGameObject(name = "GameObject")
        {
            return serialization.setValue(new GameObject(), { name: name });
        }

        createCube(name = "Cube")
        {
            var g = serialization.setValue(new GameObject(), {
                name: name,
                components: [{ __class__: "feng3d.MeshModel", geometry: Geometry.getDefault("Cube") },]
            });
            return g;
        }

        createPlane(name = "Plane")
        {
            var g = serialization.setValue(new GameObject(), {
                name: name,
                components: [{ __class__: "feng3d.MeshModel", geometry: Geometry.getDefault("Plane") },]
            });
            return g;
        }

        createQuad(name = "Quad")
        {
            var g = serialization.setValue(new GameObject(), {
                name: name,
                components: [{ __class__: "feng3d.MeshModel", geometry: Geometry.getDefault("Quad") },]
            });
            return g;
        }

        createCylinder(name = "Cylinder")
        {
            var g = serialization.setValue(new GameObject(), {
                name: name,
                components: [{ __class__: "feng3d.MeshModel", geometry: Geometry.getDefault("Cylinder") },]
            });
            return g;
        }

        createCone(name = "Cone")
        {
            return serialization.setValue(new GameObject(), {
                name: name,
                components: [{ __class__: "feng3d.MeshModel", geometry: Geometry.getDefault("Cone") },]
            });
        }

        createTorus(name = "Torus")
        {
            return serialization.setValue(new GameObject(), {
                name: name,
                components: [{ __class__: "feng3d.MeshModel", geometry: Geometry.getDefault("Torus") },]
            });
        }

        createSphere(name = "Sphere")
        {
            var sphere = serialization.setValue(new GameObject(), {
                name: name,
                components: [{ __class__: "feng3d.MeshModel", geometry: Geometry.getDefault("Sphere") },]
            });
            return sphere;
        }

        createCapsule(name = "Capsule")
        {
            var g = serialization.setValue(new GameObject(), {
                name: name,
                components: [{ __class__: "feng3d.MeshModel", geometry: Geometry.getDefault("Capsule") },]
            });
            return g;
        }

        createSegment(name = "Segment")
        {
            var g = serialization.setValue(new GameObject(), {
                name: name,
                components: [{ __class__: "feng3d.MeshModel", geometry: new SegmentGeometry(), material: Material.getDefaultMaterial("Segment-Material") },]
            });
            return g;
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

        createPointLight(name = "Point light")
        {
            return serialization.setValue(new GameObject(), {
                name: name,
                components: [{ __class__: "feng3d.PointLight" },]
            });
        }

        createDirectionalLight(name = "Directional light")
        {
            return serialization.setValue(new GameObject(), {
                name: name,
                components: [{ __class__: "feng3d.DirectionalLight" },]
            });
        }

        createSpotLight(name = "Spotlight")
        {
            return serialization.setValue(new GameObject(), {
                name: name,
                components: [{ __class__: "feng3d.SpotLight" },]
            });
        }

        createParticle(name = "Particle System")
        {
            return serialization.setValue(new GameObject(), {
                name: name,
                components: [{ __class__: "feng3d.Transform", rx: -90 }, { __class__: "feng3d.ParticleSystem" },],
            });
        }

        createWater(name = "Water")
        {
            return serialization.setValue(new GameObject(), {
                name: name,
                components: [{ __class__: "feng3d.Water" },],
            });
        }
    }

    gameObjectFactory = new GameObjectFactory();
}