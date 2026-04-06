import { Camera, Color4, FPSController, GameObject, Scene, serialization, Vector3, View } from 'feng3d';

    const scene = serialization.setValue(new GameObject(), { name: 'Untitled' }).addComponent(Scene);
    scene.background = new Color4(0.408, 0.38, 0.357, 1.0);

    const camera = serialization.setValue(new GameObject(), { name: 'Main Camera' }).addComponent(Camera);
    camera.transform.position = new Vector3(0, 1, -10);
    scene.gameObject.addChild(camera.gameObject);

    const engine = new View(null, scene, camera);

    const cube = GameObject.createPrimitive('Cube');
    scene.gameObject.addChild(cube);

    const sphere = GameObject.createPrimitive('Sphere');
    sphere.transform.position = new Vector3(-1.50, 0, 0);
    scene.gameObject.addChild(sphere);

    const capsule = GameObject.createPrimitive('Capsule');
    capsule.transform.position = new Vector3(3, 0, 0);
    scene.gameObject.addChild(capsule);

    const cylinder = GameObject.createPrimitive('Cylinder');
    cylinder.transform.position = new Vector3(-3, 0, 0);
    scene.gameObject.addChild(cylinder);

    camera.transform.z = -5;
    camera.transform.lookAt(new Vector3());
    //
    camera.gameObject.addComponent(FPSController);
