import { $set, Color4, CubeGeometry, LoadImageTexture2D, Node3D, StandardMaterial, StandardUniforms, Vector3 } from 'feng3d';

const root = new Node3D();
root.addComponent('WebGLRenderer3D');

const scene = root.addComponent('Scene3D');
scene.background = new Color4(0.408, 0.38, 0.357, 1.0);

const camera = new Node3D().addComponent('Camera3D');
camera.entity.position = new Vector3(0, 1, -10);
scene.entity.addChild(camera.entity);

const cube = new Node3D();
cube.z = 3;
cube.y = -1;
scene.entity.addChild(cube);

// 变化旋转与颜色
setInterval(function ()
{
    cube.ry += 1;
}, 15);

const model = cube.addComponent('Mesh3D');
model.geometry = $set(new CubeGeometry(), { width: 1, height: 1, depth: 1, segmentsW: 1, segmentsH: 1, segmentsD: 1, tile6: false });
// model.geometry = new PlaneGeometry();
// 材质
const textureMaterial = model.material = new StandardMaterial();
const uniforms = <StandardUniforms>textureMaterial.uniforms;
uniforms.s_diffuse = $set(new LoadImageTexture2D(), { url: '../../m.png' });
// textureMaterial.uniforms.s_diffuse.url = '../../nonpowerof2.png';
uniforms.s_diffuse.format = 'RGBA';
// textureMaterial.diffuseMethod.alphaThreshold = 0.1;

uniforms.s_diffuse.anisotropy = 16;
uniforms.u_diffuse.a = 0.2;

textureMaterial.renderParams.enableBlend = true;
