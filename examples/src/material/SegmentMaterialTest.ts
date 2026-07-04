import { Camera, Color4, GameObject, Material, reactive, Renderable, Scene, SegmentGeometry, serialization, Vector3, View } from 'feng3d';
const scene = serialization.setValue(new GameObject(), { name: "Untitled" }).addComponent(Scene);
scene.background = new Color4(0.408, 0.38, 0.357, 1.0);

const camera = serialization.setValue(new GameObject(), { name: "Main Camera" }).addComponent(Camera);
{ const _r = reactive(camera.transform.position); _r.x = 0; _r.y = 1; _r.z = -10; }
scene.gameObject.addChild(camera.gameObject);

const engine = new View(null, scene, camera);

const segment = serialization.setValue(new GameObject(), { name: "segment" });
reactive(segment.transform.position).z = 3;
scene.gameObject.addChild(segment);

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
