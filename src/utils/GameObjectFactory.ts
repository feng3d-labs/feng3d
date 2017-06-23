module feng3d
{
    export class GameObjectFactory
    {
        public static createCube(name: string = "cube")
        {
            var gameobject = new GameObject(name);
            var model = gameobject.getOrCreateComponentByClass(Model);
            model.geometry = new CubeGeometry();
            model.material = new StandardMaterial();
            return gameobject;
        }

        public static createPlane(name: string = "plane")
        {
            var gameobject = new GameObject(name);
            var model = gameobject.getOrCreateComponentByClass(Model);
            model.geometry = new PlaneGeometry();
            model.material = new StandardMaterial();
            return gameobject;
        }

        public static createCylinder(name: string = "cylinder")
        {
            var gameobject = new GameObject(name);
            var model = gameobject.getOrCreateComponentByClass(Model);
            model.geometry = new CylinderGeometry();
            model.material = new StandardMaterial();
            return gameobject;
        }

        public static createSphere(name: string = "sphere")
        {
            var gameobject = new GameObject(name);
            var model = gameobject.getOrCreateComponentByClass(Model);
            model.geometry = new SphereGeometry();
            model.material = new StandardMaterial();
            return gameobject;
        }

        public static createCapsule(name: string = "capsule")
        {
            var gameobject = new GameObject(name);
            var model = gameobject.getOrCreateComponentByClass(Model);
            model.geometry = new CapsuleGeometry();
            model.material = new StandardMaterial();
            return gameobject;
        }
    }
}