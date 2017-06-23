namespace feng3d
{
    export class GameObjectFactory
    {
        public static createCube(name: string = "cube")
        {
            var gameobject = new GameObject(name);
            var model = gameobject.addComponent(MeshRenderer);
            gameobject.addComponent(MeshFilter).mesh = new CubeGeometry();
            model.material = new StandardMaterial();
            return gameobject;
        }

        public static createPlane(name: string = "plane")
        {
            var gameobject = new GameObject(name);
            var model = gameobject.addComponent(MeshRenderer);
            gameobject.addComponent(MeshFilter).mesh = new PlaneGeometry();
            model.material = new StandardMaterial();
            return gameobject;
        }

        public static createCylinder(name: string = "cylinder")
        {
            var gameobject = new GameObject(name);
            var model = gameobject.addComponent(MeshRenderer);
            gameobject.addComponent(MeshFilter).mesh = new CylinderGeometry();
            model.material = new StandardMaterial();
            return gameobject;
        }

        public static createSphere(name: string = "sphere")
        {
            var gameobject = new GameObject(name);
            var model = gameobject.addComponent(MeshRenderer);
            gameobject.addComponent(MeshFilter).mesh = new SphereGeometry();
            model.material = new StandardMaterial();
            return gameobject;
        }

        public static createCapsule(name: string = "capsule")
        {
            var gameobject = new GameObject(name);
            var model = gameobject.addComponent(MeshRenderer);
            gameobject.addComponent(MeshFilter).mesh = new CapsuleGeometry();
            model.material = new StandardMaterial();
            return gameobject;
        }
    }
}