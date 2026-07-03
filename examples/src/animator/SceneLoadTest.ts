import * as feng3d from 'feng3d';
const view3D = new feng3d.View();

feng3d.loader.loadText("/scene/Untitled.scene.json").then((content) => {
    const json = JSON.parse(content);
    const sceneobject: feng3d.GameObject = feng3d.serialization.deserialize(json);
    const scene = sceneobject.getComponent(feng3d.Scene);

    view3D.scene = scene;
});

