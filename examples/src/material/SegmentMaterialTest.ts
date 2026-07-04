import { Camera, Color4, Object3D, Material, reactive, Renderable, Scene, SegmentGeometry, Vector3, View } from 'feng3d';
const sceneObject3D = new Object3D(); sceneObject3D.name = "Untitled";
const scene = sceneObject3D.addComponent(Scene);
scene.background = new Color4(0.408, 0.38, 0.357, 1.0);

const cameraObject3D = new Object3D(); cameraObject3D.name = "Main Camera";
const camera = cameraObject3D.addComponent(Camera);
{ const _r = reactive(camera.transform.position); _r.x = 0; _r.y = 1; _r.z = -10; }
scene.object3D.addChild(camera.object3D);

const engine = new View(null, scene, camera);

const segment = new Object3D(); segment.name = "segment";
reactive(segment.transform.position).z = 3;
scene.object3D.addChild(segment);

//初始化材质
const model = segment.addComponent(Renderable);
model.material = Material.getDefault("Segment-Material");
const segmentGeometry = model.geometry = new SegmentGeometry();

const length = 200;
const height = 2 / Math.PI;
let preVec: Vector3;
for (let x = -length; x <= length; x++) {
    const angle = x / length * Math.PI;
    if (preVec == null) {
        preVec = new Vector3(x / 100, Math.sin(angle) * height, 0);
    } else {
        const vec = new Vector3(x / 100, Math.sin(angle) * height, 0);
        segmentGeometry.addSegment({ start: preVec, end: vec });
        preVec = vec;
    }
}

//变化旋转
setInterval(() => {
    reactive(segment.transform.rotation).y += 1;
}, 15);
