import * as feng3d from 'feng3d';

const scene = feng3d.serialization.setValue(new feng3d.GameObject(), { name: "Untitled" }).addComponent(feng3d.Scene);
scene.background = new feng3d.Color4(0.408, 0.38, 0.357, 1.0);

const camera = feng3d.serialization.setValue(new feng3d.GameObject(), { name: "Main Camera" }).addComponent(feng3d.Camera);
{ const _r = feng3d.reactive(camera.transform.position); _r.x = 0; _r.y = 1; _r.z = -10; }
scene.gameObject.addChild(camera.gameObject);

const engine = new feng3d.View(null, scene, camera);

const cube = new feng3d.GameObject();
feng3d.reactive(cube.transform.position).z = -7;
feng3d.reactive(cube.transform.position).y = 0;
scene.gameObject.addChild(cube);

const model = cube.addComponent(feng3d.Renderable);
model.geometry = feng3d.serialization.setValue(new feng3d.CubeGeometry(), { width: 1, height: 1, depth: 1, segmentsW: 1, segmentsH: 1, segmentsD: 1, tile6: false });
//材质
const material = model.material = feng3d.serialization.setValue(new feng3d.StandardMaterial(), {
    s_diffuse: {
        __class__: "Texture2D",
        source: { url: '/m.png' }
    },
    u_fogMode: feng3d.FogMode.LINEAR,
    u_fogColor: new feng3d.Color3(1, 1, 0),
    u_fogMinDistance: 2,
    u_fogMaxDistance: 3,
} as any);


feng3d.ticker.onframe(() => {
    feng3d.reactive(cube.transform.rotation).y += 1;
});

