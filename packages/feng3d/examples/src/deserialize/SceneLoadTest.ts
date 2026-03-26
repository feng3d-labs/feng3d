import { $deserialize, loader, Node3D } from 'feng3d';

const root = new Node3D();

loader.loadText('../../scene/Untitled.scene.json').then((content) =>
{
    root.addComponent('WebGLRenderer3D');
    const json = JSON.parse(content);
    const sceneobject: Node3D = $deserialize(json);
    root.addChild(sceneobject);
});
