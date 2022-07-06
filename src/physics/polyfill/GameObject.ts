namespace feng3d
{
    functionwrap.extendFunction(GameObject, "createPrimitive", (g, type) =>
    {
        if (type == "Cube")
        {
            g.addComponent("BoxCollider");
            g.addComponent("Rigidbody");
        } else if (type == "Plane")
        {
            g.addComponent("PlaneCollider");
            g.addComponent("Rigidbody");
        } else if (type == "Cylinder")
        {
            g.addComponent("CylinderCollider");
            g.addComponent("Rigidbody");
        } else if (type == "Sphere")
        {
            g.addComponent("SphereCollider");
            g.addComponent("Rigidbody");
        } else if (type == "Capsule")
        {
            g.addComponent("CapsuleCollider");
            g.addComponent("Rigidbody");
        } else if (type == "Cloth")
        {
            g.addComponent("Cloth")
        }
        return g;
    });
    export interface PrimitiveGameObject
    {
        Cloth: GameObject;
    }
}