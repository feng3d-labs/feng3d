import { serialization, GameObject, Scene, Color4, Camera, Vector3, View, Renderable, CubeGeometry, Material, StandardUniforms, Texture2D, TextureFormat } from 'feng3d';

const scene = serialization.setValue(new GameObject(), { name: 'Untitled' }).addComponent(Scene);
scene.background = new Color4(0.408, 0.38, 0.357, 1.0);

const camera = serialization.setValue(new GameObject(), { name: 'Main Camera' }).addComponent(Camera);
camera.transform.position = new Vector3(0, 1, -10);
scene.gameObject.addChild(camera.gameObject);

const engine = new View(null, scene, camera);

const cube = new GameObject();
cube.transform.z = 3;
cube.transform.y = -1;
scene.gameObject.addChild(cube);

// 变化旋转与颜色
setInterval(function ()
{
    cube.transform.ry += 1;
}, 15);

const model = cube.addComponent(Renderable);
model.geometry = serialization.setValue(new CubeGeometry(), { width: 1, height: 1, depth: 1, segmentsW: 1, segmentsH: 1, segmentsD: 1, tile6: false });
// model.geometry = new PlaneGeometry();
// 材质
const textureMaterial = model.material = new Material();
const uniforms = <StandardUniforms>textureMaterial.uniforms;
uniforms.s_diffuse = new Texture2D();
uniforms.s_diffuse.source = { url: '../../resources/m.png' };
// textureMaterial.uniforms.s_diffuse.url = 'resources/nonpowerof2.png';
uniforms.s_diffuse.format = TextureFormat.RGBA;
// textureMaterial.diffuseMethod.alphaThreshold = 0.1;

uniforms.s_diffuse.anisotropy = 16;
uniforms.u_diffuse.a = 0.2;

textureMaterial.renderParams.enableBlend = true;
