import { $set, Color3, Color4, Node3D, ShadowType, Terrain3DGeometry, Terrain3DMaterial, ticker, Vector3, Vector4 } from 'feng3d';

const root = new Node3D();
root.addComponent('WebGLRenderer3D');

const scene = root.addComponent('Scene3D');
scene.background = new Color4(0.408, 0.38, 0.357, 1.0);

const camera = new Node3D().addComponent('Camera3D');
camera.entity.position = new Vector3(0, 1, -10);
scene.entity.addChild(camera.entity);

camera.entity.x = 0;
camera.entity.y = 80;
camera.entity.z = 0;
// camera.entity.lookAt(new Vector3());
camera.entity.addComponent('FPSController3D');

const rootPath = '../../terrain/';
//
const terrain = $set(new Node3D(), { name: 'terrain' });
const model = terrain.addComponent('Mesh3D');
// model.geometry = new TerrainGeometry();
model.geometry = $set(new Terrain3DGeometry(), {
    heightMapUrl: `${rootPath}terrain_heights.jpg`,
    width: 500, height: 100, depth: 500,
    segmentsW: 100,
    segmentsH: 100,
});
const material = new Terrain3DMaterial().init({
    uniforms: {
        s_diffuse: { __class__: 'LoadImageTexture2D', url: `${rootPath}terrain_diffuse.jpg` },
        s_normal: { __class__: 'LoadImageTexture2D', url: `${rootPath}terrain_normals.jpg` },
        //
        s_blendTexture: { __class__: 'LoadImageTexture2D', url: `${rootPath}terrain_splats.png`, minFilter: 'LINEAR_MIPMAP_LINEAR' },
        s_splatTexture1: { __class__: 'LoadImageTexture2D', url: `${rootPath}beach.jpg`, minFilter: 'LINEAR_MIPMAP_LINEAR' },
        s_splatTexture2: { __class__: 'LoadImageTexture2D', url: `${rootPath}grass.jpg`, minFilter: 'LINEAR_MIPMAP_LINEAR' },
        s_splatTexture3: { __class__: 'LoadImageTexture2D', url: `${rootPath}rock.jpg`, minFilter: 'LINEAR_MIPMAP_LINEAR' },
        u_splatRepeats: new Vector4(1, 50, 50, 50),
    }
});

model.material = material;
scene.entity.addChild(terrain);

scene.ambientColor.setTo(0.2, 0.2, 0.2, 1.0);

// 初始化光源
const light1 = new Node3D();
const pointLight1 = light1.addComponent('PointLight3D');
pointLight1.range = 5000;
pointLight1.color = new Color3(1, 1, 1);
pointLight1.shadowType = ShadowType.PCF_Shadows;
light1.y = 1000;
scene.entity.addChild(light1);

