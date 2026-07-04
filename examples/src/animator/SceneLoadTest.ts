import { Object3D, loader, Scene, serialization, View } from 'feng3d';
const view3D = new View();

loader.loadText("/scene/Untitled.scene.json").then((content) => {
    const json = JSON.parse(content);
    const sceneobject: Object3D = serialization.deserialize(json);
    const scene = sceneobject.components.find(c => c instanceof Scene) as Scene;

    view3D.scene = scene;
});
