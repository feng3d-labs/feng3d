import { WebGPU } from '@feng3d/webgpu';
import { CustomGeometry, geometryUtils, logic, Object3D, reactive, Scene, SphereGeometry, StandardMaterial, View } from 'feng3d';

/**
 * 移植自 three.js examples/webgl_buffergeometry_uint.html。
 *
 * 原示例：500000 个随机三角面（非索引 BufferGeometry）分散在立方体内，按位置顶点色着色，
 * MeshPhongMaterial{vertexColors, DoubleSide}，AmbientLight + 两个 DirectionalLight，每帧旋转。
 * 展示超过 65535 顶点的几何体需要 32 位索引（uint）支持。
 *
 * feng3d 适配：
 * - 索引提升为 uint32 由库自动处理：Geometry.ts 的 getRenderData 检测 maxIndex > 65535 时
 *   用 Uint32Array，否则 Uint16Array。为触发该路径，需用一个 maxIndex 超过 65535 的索引几何体。
 *   原示例是非索引的（drawArrays），feng3d 渲染管线走 indexBuffer，故这里改用高细分球体
 *   （segmentsW/H=256 → 66049 顶点）作为「大索引几何体」示例，maxIndex 远超 65535。
 * - 顶点色按 Y 高度 HSL 着色（彩虹带），通过 SphereGeometry 生成 positions/indices 后克隆到
 *   CustomGeometry 注入 colors（与 webgl_geometry_colors 同样手法）。
 * - MeshPhongMaterial{vertexColors} → StandardMaterial（顶点色默认开启）。
 * - AmbientLight → Scene.ambientColor；DirectionalLight 直接用（强度对齐 1/π 衰减）。
 * - setAnimationLoop → requestAnimationFrame。
 */

const webgpuCanvas = document.getElementById('webgpu') as HTMLCanvasElement;
const webgpu = await new WebGPU().init();

let scene: Scene;

// ---- 高细分球体（顶点数 > 65535，强制 uint32 索引） ----
// segmentsW=256, segmentsH=256 → (256+1)*(256+1) = 66049 顶点，maxIndex=66048 > 65535
const RADIUS = 800;
const sphereSrc = logic({ __type__: 'SphereGeometry', radius: RADIUS, segmentsW: 256, segmentsH: 256 } as SphereGeometry);

// ---- HSL → RGB（对应 three.js Color.setHSL） ----
function hslToRgb(h: number, s: number, l: number): [number, number, number]
{
    if (s === 0) return [l, l, l];
    const hue2rgb = (p: number, q: number, t: number): number =>
    {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1 / 6) return p + (q - p) * 6 * t;
        if (t < 1 / 2) return q;
        if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;

        return p;
    };
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;

    return [hue2rgb(p, q, h + 1 / 3), hue2rgb(p, q, h), hue2rgb(p, q, h - 1 / 3)];
}

/**
 * 把球体基底数据 + 自定义着色规则合成 CustomGeometry（positions/normals/indices/colors/uvs）。
 *
 * @param src 球体 logic（提供 positions/normals/indices）
 * @param colorFn 顶点颜色映射（y, radius）→ [r, g, b]
 */
function makeColoredGeometry(
    src: ReturnType<typeof logic>,
    colorFn: (y: number, radius: number) => [number, number, number],
): CustomGeometry
{
    const positions = src.positions as number[];
    const indices = src.indices as number[];
    // 重新算法线，保证光照正确（球体自带法线可用，这里直接复用基底 normals）
    const normals = (src.normals as number[]) ?? geometryUtils.createVertexNormals(indices, positions);

    const vCount = positions.length / 3;
    const colors: number[] = [];
    const uvs: number[] = [];
    for (let i = 0; i < vCount; i++)
    {
        const y = positions[i * 3 + 1];
        const [r, g, b] = colorFn(y, RADIUS);
        // feng3d a_color 是 vec4（含 alpha）
        colors.push(r, g, b, 1);
        // uvs 占位（StandardMaterial vertex shader 声明 @location(3) uv，必须提供非空）
        uvs.push(0, 0);
    }

    const geo: CustomGeometry = { __type__: 'CustomGeometry' };
    const geoLogic = logic(geo);
    geoLogic.positions = positions;
    geoLogic.normals = normals;
    geoLogic.colors = colors;
    geoLogic.uvs = uvs;
    (geoLogic as unknown as { indices: number[] }).indices = indices;

    return geo;
}

// 按 Y 坐标 HSL 着色（彩虹色带）
const sphereGeometry = makeColoredGeometry(sphereSrc, (y, r) => hslToRgb((y / r + 1) / 2, 1.0, 0.5));

let meshRotation: { readonly x: number; readonly y: number; readonly z: number };

const view: View = {
    __type__: 'View',
    canvas: webgpuCanvas,
    root: {
        __type__: 'Object3D',
        name: 'Untitled',
        components: [scene = {
            __type__: 'Scene',
            // Scene.background = 0x050505
            background: { __type__: 'Color4', r: 0.02, g: 0.02, b: 0.02, a: 1 },
            // AmbientLight(0xcccccc) 近似：温和的环境光避免背光面纯黑
            ambientColor: { __type__: 'Color4', r: 0.5, g: 0.5, b: 0.5, a: 1 },
        }],
        children: [
            // 相机：PerspectiveCamera(27, aspect, 1, 3500)，position.z=2750
            {
                __type__: 'Object3D',
                name: 'Main Camera',
                position: { x: 0, y: 0, z: 2750 },
                components: [{
                    __type__: 'PerspectiveCamera',
                    fov: 27,
                    aspect: webgpuCanvas.width / webgpuCanvas.height,
                    near: 1,
                    far: 3500,
                }],
            },
            // 大索引球体 mesh：旋转动画（rotation.x = time*0.25, rotation.y = time*0.5）
            {
                __type__: 'Object3D',
                name: 'mesh',
                rotation: meshRotation = { x: 0, y: 0, z: 0 },
                components: [{
                    __type__: 'MeshRenderer',
                    geometry: sphereGeometry,
                    // MeshPhongMaterial{color:0xd5d5d5, specular:0xffffff, shininess:250, vertexColors}
                    material: {
                        __type__: 'StandardMaterial',
                        uniforms: {
                            u_diffuse: { __type__: 'Color4', r: 0.835, g: 0.835, b: 0.835, a: 1 },
                            u_specular: { __type__: 'Color4', r: 1, g: 1, b: 1, a: 1 },
                            u_glossiness: 0.5,
                            // 无环境贴图，置 0 关闭环境反射避免全黑
                            u_reflectivity: 0,
                        },
                    } as StandardMaterial,
                }],
            },
            // 方向光 1：position(1,1,1)，intensity 1.5
            {
                __type__: 'Object3D',
                name: 'DirLight1',
                position: { x: 1, y: 1, z: 1 },
                components: [{
                    __type__: 'DirectionalLight',
                    color: { __type__: 'Color3', r: 1, g: 1, b: 1 },
                    // three.js MeshPhong 漫反射含 1/π 衰减，强度 1.5 → 1.5/π
                    intensity: 1.5 / Math.PI,
                }],
            },
            // 方向光 2：position(0,-1,0)，intensity 4.5
            {
                __type__: 'Object3D',
                name: 'DirLight2',
                position: { x: 0, y: -1, z: 0 },
                components: [{
                    __type__: 'DirectionalLight',
                    color: { __type__: 'Color3', r: 1, g: 1, b: 1 },
                    intensity: 4.5 / Math.PI,
                }],
            },
        ],
    },
};

const viewLogic = logic(view);
void scene; // 引用避免未使用告警

// ---- animate（对应原示例 setAnimationLoop + 每帧旋转） ----
const startTime = Date.now();

function animate(): void
{
    const time = (Date.now() - startTime) / 1000;
    reactive(meshRotation).x = time * 0.25;
    reactive(meshRotation).y = time * 0.5;

    webgpu.submit(viewLogic.submit);
    requestAnimationFrame(animate);
}

requestAnimationFrame(animate);
