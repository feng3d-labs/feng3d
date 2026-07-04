import { Object3D, loader, Scene, serialization, View, object3DLogic } from 'feng3d';
const view3D = new View();

loader.loadText("/scene/Untitled.scene.json").then((content) => {
    const json = JSON.parse(content);
    const sceneobject: Object3D = serialization.deserialize(json);
    const scene = object3DLogic(sceneobject).getComponent(Scene);

    view3D.scene = scene;
});
