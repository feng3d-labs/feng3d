import { GameObject, loader, Scene, serialization, View } from 'feng3d';
const view3D = new View();

loader.loadText("/scene/Untitled.scene.json").then((content) => {
    const json = JSON.parse(content);
    const sceneobject: GameObject = serialization.deserialize(json);
    const scene = sceneobject.getComponent(Scene);

    view3D.scene = scene;
});
