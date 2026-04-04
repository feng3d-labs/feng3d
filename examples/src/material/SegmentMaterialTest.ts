import { $set, Color4, Material, Node3D, Segment, SegmentGeometry, Vector3 } from 'feng3d';

const root = new Node3D();
root.addComponent('WebGLRenderer3D');

const scene = root.addComponent('Scene3D');
scene.background = new Color4(0.408, 0.38, 0.357, 1.0);

const camera = new Node3D().addComponent('Camera3D');
camera.entity.position = new Vector3(0, 1, -10);
scene.entity.addChild(camera.entity);

const segment = $set(new Node3D(), { name: 'segment' });
segment.z = 3;
scene.entity.addChild(segment);

// 初始化材质
const model = segment.addComponent('Mesh3D');
model.material = Material.getDefault('Segment-Material');
const segmentGeometry = model.geometry = new SegmentGeometry();
const segments: Segment[] = [];

const length = 200;
const height = 2 / Math.PI;
let preVec: Vector3;
for (let x = -length; x <= length; x++)
{
    const angle = x / length * Math.PI;
    if (preVec === undefined)
    {
        preVec = new Vector3(x / 100, Math.sin(angle) * height, 0);
    }
    else
    {
        const vec = new Vector3(x / 100, Math.sin(angle) * height, 0);

        const segment = new Segment();
        segment.start = preVec;
        segment.end = vec;
        segments.push(segment);

        preVec = vec;
    }
}

segmentGeometry.segments = segments;

// 变化旋转
setInterval(function ()
{
    segment.ry += 1;
}, 15);
