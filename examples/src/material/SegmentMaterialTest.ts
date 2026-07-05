import { Camera, Color4, Object3D, reactive, Renderable, Scene, SegmentGeometry, Vector3, View, logic, cameraLogic, sceneLogic, createObject3D, createCamera, createScene, createRenderable, getDefaultMaterial} from 'feng3d';
const sceneObject3D = createObject3D(); reactive(sceneObject3D).name = "Untitled";
const scene = createScene(); reactive(sceneObject3D).components.push(scene);
scene.background = new Color4(0.408, 0.38, 0.357, 1.0);

const cameraObject3D = createObject3D(); reactive(cameraObject3D).name = "Main Camera";
logic(cameraObject3D);
const camera = createCamera(); reactive(cameraObject3D).components.push(camera);
{ const _r = reactive(cameraLogic(camera).object3D.position); _r.x = 0; _r.y = 1; _r.z = -10; }
reactive(sceneLogic(scene).object3D).children.push(cameraLogic(camera).object3D);

const engine = new View(null, sceneObject3D);

const segment = createObject3D(); reactive(segment).name = "segment";
reactive(segment.position).z = 3;
reactive(sceneLogic(scene).object3D).children.push(segment);

//初始化材质
const model = createRenderable(); reactive(segment).components.push(model);
model.material = getDefaultMaterial("Segment-Material");
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
    reactive(segment.rotation).y += 1;
}, 15);
