import * as feng3d from 'feng3d';
const scene = feng3d.serialization.setValue(new feng3d.GameObject(), { name: "Untitled" }).addComponent(feng3d.Scene);
scene.background = new feng3d.Color4(0.408, 0.38, 0.357, 1.0);

const camera = feng3d.serialization.setValue(new feng3d.GameObject(), { name: "Main Camera" }).addComponent(feng3d.Camera);
camera.transform.position = new feng3d.Vector3(0, 1, -10);
scene.gameObject.addChild(camera.gameObject);

const engine = new feng3d.View(null, scene, camera);

const cube = new feng3d.GameObject();
cube.transform.z = 3;
cube.transform.y = -1;
scene.gameObject.addChild(cube);

//变化旋转与颜色
setInterval(() => {
    cube.transform.ry += 1;
}, 15);

const model = cube.addComponent(feng3d.Renderable);
model.geometry = feng3d.serialization.setValue(new feng3d.CubeGeometry(), { width: 1, height: 1, depth: 1, segmentsW: 1, segmentsH: 1, segmentsD: 1, tile6: false });
//材质
const textureMaterial = model.material = new feng3d.Material();
const uniforms = textureMaterial.uniforms as feng3d.StandardUniforms;
uniforms.s_diffuse = new feng3d.Texture2D();
uniforms.s_diffuse.source = { url: 'resources/m.png' };
uniforms.s_diffuse.format = feng3d.TextureFormat.RGBA;
uniforms.s_diffuse.anisotropy = 16;
uniforms.u_diffuse.a = 0.2;

textureMaterial.renderParams.enableBlend = true;

