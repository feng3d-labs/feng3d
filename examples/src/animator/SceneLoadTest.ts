import { GameObject, Scene, View, loader, serialization } from 'feng3d';

const view3D = new View();

loader.loadText('../../resources/scene/Untitled.scene.json').then((content) =>
{
    const json = JSON.parse(content);
    const sceneobject: GameObject = serialization.deserialize(json);
    const scene = sceneobject.getComponent(Scene);

    view3D.scene = scene;
});
