declare namespace feng3d {
    var GameObjectFactory: {
        create: (name?: string) => GameObject;
        createCube: (name?: string) => GameObject;
        createPlane: (name?: string) => GameObject;
        createCylinder: (name?: string) => GameObject;
        createSphere: (name?: string) => GameObject;
        createCapsule: (name?: string) => GameObject;
    };
}
