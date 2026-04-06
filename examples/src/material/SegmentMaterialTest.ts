import { serialization, GameObject, Scene, Color4, Camera, Vector3, View, Renderable, Material, SegmentGeometry } from 'feng3d';

const scene = serialization.setValue(new GameObject(), { name: 'Untitled' }).addComponent(Scene);
scene.background = new Color4(0.408, 0.38, 0.357, 1.0);

const camera = serialization.setValue(new GameObject(), { name: 'Main Camera' }).addComponent(Camera);
camera.transform.position = new Vector3(0, 1, -10);
scene.gameObject.addChild(camera.gameObject);

const engine = new View(null, scene, camera);

const segment = serialization.setValue(new GameObject(), { name: 'segment' });
segment.transform.z = 3;
scene.gameObject.addChild(segment);

// 初始化材质
const model = segment.addComponent(Renderable);
model.material = Material.getDefault('Segment-Material');
const segmentGeometry = model.geometry = new SegmentGeometry();

const length = 200;
const height = 2 / Math.PI;
let preVec: Vector3;
for (let x = -length; x <= length; x++)
{
    const angle = x / length * Math.PI;
    if (preVec === null)
    {
        preVec = new Vector3(x / 100, Math.sin(angle) * height, 0);
    }
    else
    {
        const vec = new Vector3(x / 100, Math.sin(angle) * height, 0);
        segmentGeometry.addSegment({ start: preVec, end: vec });
        preVec = vec;
    }
}

// 变化旋转
setInterval(function ()
{
    segment.transform.ry += 1;
}, 15);
