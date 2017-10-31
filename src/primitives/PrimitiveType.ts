module feng3d
{
    export interface PrimitiveType
    {
        Plane: "Plane",
        Cube: "Cube",
        Sphere: "Sphere",
        Capsule: "Capsule",
        Cylinder: "Cylinder",
        Cone: "Cone",
        Torus: "Torus",
    };

    export var PrimitiveType = {
        Plane: "Plane",
        Cube: "Cube",
        Sphere: "Sphere",
        Capsule: "Capsule",
        Cylinder: "Cylinder",
        Cone: "Cone",
        Torus: "Torus",
    };

    export interface GameObjectType extends PrimitiveType
    {
        GameObject: "GameObject"
    }

    export var GameObjectType = {
        GameObject: "GameObject",
        ...PrimitiveType,
    };
}