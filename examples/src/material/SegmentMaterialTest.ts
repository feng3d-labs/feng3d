import { Object3D, reactive, View } from 'feng3d';

// 生成正弦曲线段集
const length = 200;
const height = 2 / Math.PI;
const segments: { start: { x: number; y: number; z: number }; end: { x: number; y: number; z: number }; startColor: { __type__: 'Color4'; r: number; g: number; b: number; a: number }; endColor: { __type__: 'Color4'; r: number; g: number; b: number; a: number } }[] = [];
let preX = -length / 100;
let preY = Math.sin(-Math.PI) * height;
for (let x = -length + 1; x <= length; x++)
{
    const angle = x / length * Math.PI;
    const curX = x / 100;
    const curY = Math.sin(angle) * height;
    segments.push({
        start: { x: preX, y: preY, z: 0 },
        end: { x: curX, y: curY, z: 0 },
        startColor: { __type__: 'Color4', r: 1, g: 1, b: 1, a: 1 },
        endColor: { __type__: 'Color4', r: 1, g: 1, b: 1, a: 1 },
    });
    preX = curX;
    preY = curY;
}

const sceneObject3D: Object3D = {
    __type__: 'Object3D',
    name: 'Untitled',
    components: [{
        __type__: 'Scene',
        background: { __type__: 'Color4', r: 0.408, g: 0.38, b: 0.357, a: 1.0 },
    }],
    children: [{
        __type__: 'Object3D',
        name: 'Main Camera',
        position: { x: 0, y: 1, z: -10 },
        components: [{
            __type__: 'Camera',
        }],
    }, {
        __type__: 'Object3D',
        name: 'segment',
        position: { x: 0, y: 0, z: 3 },
        components: [{
            __type__: 'MeshRenderer',
            geometry: { __type__: 'SegmentGeometry', segments } as any,
            material: { __type__: 'SegmentMaterial' },
        }],
    }],
};

const engine = new View(null, sceneObject3D);

// 变化旋转
setInterval(() =>
{
    const segment = sceneObject3D.children!.find(c => c.name === 'segment')!;
    reactive(segment.rotation).y += 1;
}, 15);
