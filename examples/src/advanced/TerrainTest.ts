import { Object3D, reactive, ticker, View, Texture2D, Vector4 } from 'feng3d';

const root = '/terrain/';

function createTerrainMaterial()
{
    const s_diffuse = new Texture2D(); s_diffuse.source = { url: root + 'terrain_diffuse.jpg' };
    const s_normal = new Texture2D(); s_normal.source = { url: root + 'terrain_normals.jpg' };

    return {
        __type__: 'StandardMaterial' as const,
        uniforms: {
            u_splatRepeats: { __type__: 'Color4', r: 1, g: 50, b: 50, a: 50 },
        },
        s_diffuse,
        s_normal,
    };
}

function createHeightMap()
{
    const t = new Texture2D();
    t.source = { url: root + 'terrain_heights.jpg' };
    return t;
}

const sceneObject3D: Object3D = {
    __type__: 'Object3D',
    name: 'Untitled',
    components: [{
        __type__: 'Scene',
        background: { __type__: 'Color4', r: 0.408, g: 0.38, b: 0.357, a: 1.0 },
        ambientColor: { __type__: 'Color4', r: 0.2, g: 0.2, b: 0.2, a: 1.0 },
    }],
    children: [{
        __type__: 'Object3D',
        name: 'Main Camera',
        position: { x: 0, y: 80, z: 0 },
        components: [{
            __type__: 'Camera',
        }, {
            __type__: 'FPSController',
        }],
    }, {
        __type__: 'Object3D',
        name: 'terrain',
        components: [{
            __type__: 'MeshRenderer',
            geometry: { __type__: 'TerrainGeometry', width: 500, height: 100, depth: 500, segmentsW: 100, segmentsH: 100, heightMap: createHeightMap() } as any,
            material: createTerrainMaterial(),
        }],
    }, {
        __type__: 'Object3D',
        name: 'light1',
        position: { x: 0, y: 1000, z: 0 },
        components: [{
            __type__: 'PointLight',
            range: 5000,
            color: { __type__: 'Color4', r: 1, g: 1, b: 1, a: 1 },
        }],
    }],
};

const engine = new View(null, sceneObject3D);

// 光源旋转动画
const light1 = sceneObject3D.children!.find(c => c.name === 'light1')!;
ticker.onframe(() =>
{
    const time = Date.now();
    const angle = time / 1000 / 5;
    reactive(light1.position).y = Math.sin(angle) * 1000;
    reactive(light1.position).z = Math.cos(angle) * 1000;
});
