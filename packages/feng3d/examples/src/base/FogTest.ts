import { $set, Color3, Color4, CubeGeometry, FogMode, Node3D, StandardMaterial, ticker, Vector3 } from 'feng3d';

const root = new Node3D();
root.addComponent('WebGLRenderer3D');

const scene = root.addComponent('Scene3D');
scene.background = new Color4(0.408, 0.38, 0.357, 1.0);

const camera = new Node3D().addComponent('Camera3D');
camera.entity.position = new Vector3(0, 1, -10);
scene.node.addChild(camera.entity);

const cube = new Node3D();
cube.z = -7;
cube.y = 0;
scene.node.addChild(cube);

const model = cube.addComponent('Mesh3D');
model.geometry = $set(new CubeGeometry(), { width: 1, height: 1, depth: 1, segmentsW: 1, segmentsH: 1, segmentsD: 1, tile6: false });
// 材质
const material = model.material = new StandardMaterial().init({
    uniforms: {
        s_diffuse: {
            __class__: 'LoadImageTexture2D',
            url: '../../m.png'
        },
        u_fogMode: FogMode.LINEAR,
        u_fogColor: new Color3(1, 1, 0),
        u_fogMinDistance: 2,
        u_fogMaxDistance: 3,
    },
    renderParams: { enableBlend: true }
});

ticker.onFrame(() =>
{
    cube.ry += 1;
});
