import { WebGPU } from '@feng3d/webgpu';
import { Color4, createTextureFromUrl, Object3D, PerspectiveCamera, reactive, raycaster, Ray3, Scene, SegmentGeometry, SegmentMaterial, StandardMaterial, View, createSegment, logic } from 'feng3d';
import { windowEventProxy } from '@feng3d/shortcut';
import { Matrix4x4, Vector3 } from '@feng3d/math';

/**
 * 移植自 three.js examples/webgl_interactive_voxelpainter.html。
 *
 * 原示例：点击地面网格放置体素方块（BoxGeometry 50³），shift+click 删除。
 * 红色半透明 roll-over 预览方块跟随鼠标。AmbientLight + DirectionalLight 光照。
 * Raycaster 射线拾取地面/已有体素，命中点 + 面法线决定新体素位置。
 *
 * feng3d 适配：
 * - 固定相机（与原版一致）：position(500,800,1300) lookAt(0,0,0)。
 * - GridHelper → SegmentGeometry 程序化生成 1000×1000、每格 50 的网格。
 * - 射线拾取：raycaster.pick(ray, objects) + camera.getRay3D(x, y)，
 *   用命中的 localPosition/localNormal 经物体 worldMatrix 转世界坐标。
 * - 体素堆叠：新体素位置 = 命中点 + 世界法线，再按 50 对齐到网格中心。
 * - AmbientLight → Scene.ambientColor；DirectionalLight 直接用。
 * - MeshLambertMaterial → StandardMaterial（glossiness 0）。
 */

const webgpuCanvas = document.getElementById('webgpu') as HTMLCanvasElement;
const webgpu = await new WebGPU().init();

// 先加载原版体素纹理（square-outline-textured.png），再构造 View
const voxelTexture = await createTextureFromUrl('/square-outline-textured.png');

let scene: Scene;
let camera: PerspectiveCamera;

// 体素尺寸（与原版一致）
const VOXEL = 50;
// 地面尺寸（与原版 GridHelper 一致：1000，每格 50 = 20 格）
const GRID_SIZE = 1000;
const GRID_DIVISIONS = 20;
const GRID_STEP = GRID_SIZE / GRID_DIVISIONS; // 50

// 临时向量（避免循环内分配）
const _worldPos = new Vector3();
const _worldNormal = new Vector3();

// 体素材质（橙色 0xfeb74c + 原版 square-outline 纹理）
const voxelMaterial: StandardMaterial = {
    __type__: 'StandardMaterial',
    uniforms: {
        u_diffuse: { __type__: 'Color4', r: 0xfe / 255, g: 0xb7 / 255, b: 0x4c / 255, a: 1 },
        u_specular: { __type__: 'Color4', r: 0, g: 0, b: 0, a: 1 },
        u_glossiness: 0,
        u_reflectivity: 0,
    },
    s_diffuse: voxelTexture,
};

// 程序化生成网格（SegmentGeometry）
function buildGrid(): SegmentGeometry
{
    const half = GRID_SIZE / 2;
    const segments = [];
    const lineColor = { r: 0.5, g: 0.5, b: 0.5, a: 1 };

    const mkSeg = (x1: number, z1: number, x2: number, z2: number) =>
    {
        const s = createSegment();
        s.start.x = x1; s.start.y = 0; s.start.z = z1;
        s.end.x = x2; s.end.y = 0; s.end.z = z2;
        (s as { startColor: Color4 }).startColor = { __type__: 'Color4', r: lineColor.r, g: lineColor.g, b: lineColor.b, a: lineColor.a };
        (s as { endColor: Color4 }).endColor = { __type__: 'Color4', r: lineColor.r, g: lineColor.g, b: lineColor.b, a: lineColor.a };

        return s;
    };

    for (let i = 0; i <= GRID_DIVISIONS; i++)
    {
        const p = -half + i * GRID_STEP;
        // 平行 X 轴
        segments.push(mkSeg(-half, p, half, p));
        // 平行 Z 轴
        segments.push(mkSeg(p, -half, p, half));
    }

    return { __type__: 'SegmentGeometry', segments };
}

const view: View = {
    __type__: 'View',
    canvas: webgpuCanvas,
    root: {
        __type__: 'Object3D',
        name: 'Untitled',
        components: [scene = {
            __type__: 'Scene',
            // 原版 background = 0xf0f0f0
            background: { __type__: 'Color4', r: 0.941, g: 0.941, b: 0.941, a: 1 },
            // AmbientLight(0x606060, 3) 近似
            ambientColor: { __type__: 'Color4', r: 0.376, g: 0.376, b: 0.376, a: 1 },
        }],
        children: [
            // 相机：PerspectiveCamera(45, aspect, 1, 10000) position(500,800,1300) lookAt(0,0,0)
            {
                __type__: 'Object3D',
                name: 'Main Camera',
                position: { x: 500, y: 800, z: 1300 },
                components: [camera = {
                    __type__: 'PerspectiveCamera',
                    fov: 45,
                    aspect: webgpuCanvas.width / webgpuCanvas.height,
                    near: 1,
                    far: 10000,
                }],
            },
            // roll-over 预览方块（红色半透明）
            {
                __type__: 'Object3D',
                name: 'rollOver',
                position: { x: 0, y: 0, z: 0 },
                components: [{
                    __type__: 'MeshRenderer',
                    geometry: { __type__: 'CubeGeometry', width: VOXEL, height: VOXEL, depth: VOXEL },
                    material: {
                        __type__: 'StandardMaterial',
                        uniforms: {
                            u_diffuse: { __type__: 'Color4', r: 1, g: 0, b: 0, a: 0.5 },
                            u_specular: { __type__: 'Color4', r: 0, g: 0, b: 0, a: 1 },
                            u_glossiness: 0,
                            u_reflectivity: 0,
                        },
                    } as StandardMaterial,
                }],
            },
            // 网格辅助线（对应原版 GridHelper(1000, 20)，灰白色）
            // feng3d 用 SegmentGeometry + SegmentMaterial（line-list 拓扑）实现
            {
                __type__: 'Object3D',
                name: 'grid',
                position: { x: 0, y: 0, z: 0 },
                components: [{
                    __type__: 'MeshRenderer',
                    geometry: buildGrid(),
                    material: {
                        __type__: 'SegmentMaterial',
                        uniforms: {
                            u_segmentColor: { __type__: 'Color4', r: 1, g: 1, b: 1, a: 1 },
                        },
                    } as SegmentMaterial,
                }],
            },
            // 不可见地面（仅用于射线拾取）：对应原版 plane（rotateX -π/2，visible=false）
            // feng3d 用 alpha=0 材质近似「不可见但可拾取」
            {
                __type__: 'Object3D',
                name: 'plane',
                position: { x: 0, y: 0, z: 0 },
                rotation: { x: -Math.PI / 2, y: 0, z: 0 },
                mouseEnabled: true,
                components: [{
                    __type__: 'MeshRenderer',
                    geometry: { __type__: 'PlaneGeometry', width: GRID_SIZE, height: GRID_SIZE },
                    material: {
                        __type__: 'StandardMaterial',
                        uniforms: {
                            u_diffuse: { __type__: 'Color4', r: 0.941, g: 0.941, b: 0.941, a: 0 },
                            u_specular: { __type__: 'Color4', r: 0, g: 0, b: 0, a: 1 },
                            u_glossiness: 0,
                            u_reflectivity: 0,
                        },
                    } as StandardMaterial,
                }],
            },
            // 方向光：DirectionalLight(0xffffff, 3) position(1,0.75,0.5).normalize()
            {
                __type__: 'Object3D',
                name: 'DirLight',
                position: { x: 1, y: 0.75, z: 0.5 },
                components: [{
                    __type__: 'DirectionalLight',
                    color: { __type__: 'Color3', r: 1, g: 1, b: 1 },
                    intensity: 3,
                }],
            },
        ],
    },
};

const viewLogic = logic(view);
const cameraObj = view.root!.children![0];
const rollOverObj = view.root!.children![1];
const planeObj = view.root!.children![3];

// 固定相机朝向原点（与原版一致）
logic(cameraObj).lookAt({ x: 0, y: 0, z: 0 } as never);

// shift 键状态（EventProxy 未暴露 shiftKey，自行监听 keydown/keyup）
let isShiftDown = false;
windowEventProxy.on('keydown', (e) =>
{
    if (e.data.keyCode === 16) isShiftDown = true;
});
windowEventProxy.on('keyup', (e) =>
{
    if (e.data.keyCode === 16) isShiftDown = false;
});

// ---- 射线拾取 ----
function getMouseRay(): Ray3 | null
{
    const rect = webgpuCanvas.getBoundingClientRect();
    const sx = windowEventProxy.clientX - rect.left;
    const sy = windowEventProxy.clientY - rect.top;
    const gx = (sx * 2 - rect.width) / rect.width;
    const gy = -(sy * 2 - rect.height) / rect.height;

    return logic(camera).getRay3D(gx, gy);
}

/** 拾取目标物体列表：不可见地面 + 所有已放置体素 */
function getPickObjects(): Object3D[]
{
    // 只保留已挂载（MeshRenderer 的 entity 已就绪）的体素，避免新加入的体素
    // 在首次渲染前 entity 未初始化导致 raycaster 内部 logic(undefined) 报错。
    // （entity 声明类型为 Entity，运行时是场景根 Object3D，断言取 children）
    const voxels = (logic(scene).entity as Object3D).children!.filter(c =>
    {
        if (c.name !== 'voxel') return false;
        const mr = c.components?.find(comp => (comp as { __type__: string }).__type__ === 'MeshRenderer');
        const mrLogic = mr && logic(mr as never);

        return mrLogic && (mrLogic as { entity?: unknown }).entity;
    });

    return [planeObj, ...voxels];
}

/**
 * 计算鼠标射线在世界空间的命中信息。
 *
 * raycaster.pick 返回的 localPosition/localNormal 在被拾取物体的局部空间，
 * 这里通过物体的 worldMatrix（local2world）变换到世界空间，
 * 模拟原版 `intersect.point` + `intersect.face.normal`（Mesh 世界法线）。
 */
function getWorldHit(): { hitObject: Object3D; worldPos: Vector3; worldNormal: Vector3 } | null
{
    const ray = getMouseRay();
    if (!ray) return null;

    const objects = getPickObjects();
    if (objects.length === 0) return null;

    const hit = raycaster.pick(ray, objects);
    if (!hit || !hit.object3D || !hit.localPosition || !hit.localNormal) return null;

    // 局部坐标 → 世界坐标
    const l2w: Matrix4x4 = logic(hit.object3D).local2world;
    l2w.transformPoint3(hit.localPosition, _worldPos);
    // 局部方向 → 世界方向（法线，用旋转部分即可，物体无非均匀缩放）
    l2w.transformVector3(hit.localNormal, _worldNormal);

    return { hitObject: hit.object3D, worldPos: _worldPos, worldNormal: _worldNormal };
}

/**
 * 原版定位逻辑：
 *   rollOverMesh.position.copy(intersect.point).add(intersect.face.normal);
 *   rollOverMesh.position.divideScalar(50).floor().multiplyScalar(50).addScalar(25);
 *
 * 即：命中点 + 法线，再按 50 对齐到网格中心（25 偏移）。
 */
function snapPosition(worldPos: Vector3, worldNormal: Vector3, out: { x: number; y: number; z: number })
{
    const x = worldPos.x + worldNormal.x;
    const y = worldPos.y + worldNormal.y;
    const z = worldPos.z + worldNormal.z;

    out.x = Math.floor(x / VOXEL) * VOXEL + VOXEL / 2;
    out.y = Math.floor(y / VOXEL) * VOXEL + VOXEL / 2;
    out.z = Math.floor(z / VOXEL) * VOXEL + VOXEL / 2;
}

/** 鼠标移动：更新 roll-over 预览位置 */
windowEventProxy.on('mousemove', () =>
{
    const result = getWorldHit();
    if (!result) return;

    const newPos = { x: 0, y: 0, z: 0 };
    snapPosition(result.worldPos, result.worldNormal, newPos);
    reactive(rollOverObj).position = newPos;
});

/** 点击：放置/删除体素 */
windowEventProxy.on('mousedown', () =>
{
    let result;
    try
    {
        result = getWorldHit();
    }
    catch (e)
    {
        console.error('voxelpainter mousedown:', e);

        return;
    }
    if (!result) return;

    // entity 声明类型为 Entity，运行时是场景根 Object3D（children 增删走响应式数组）
    const target = logic(scene).entity as Object3D;

    // EventProxy 不直接暴露 shiftKey，改读全局 keydown 状态
    if (isShiftDown)
    {
        // shift+click：删除命中的体素（不可删除地面 plane）
        if (result.hitObject !== planeObj)
        {
            const idx = target.children!.indexOf(result.hitObject);
            if (idx >= 0) target.children!.splice(idx, 1);
        }
    }
    else
    {
        // click：放置新体素
        const newPos = { x: 0, y: 0, z: 0 };
        snapPosition(result.worldPos, result.worldNormal, newPos);
        const voxel: Object3D = {
            __type__: 'Object3D',
            name: 'voxel',
            position: newPos,
            mouseEnabled: true,
            components: [{
                __type__: 'MeshRenderer',
                geometry: { __type__: 'CubeGeometry', width: VOXEL, height: VOXEL, depth: VOXEL },
                material: voxelMaterial,
            }],
        };
        target.children!.push(voxel);
    }
});

// ---- 渲染循环 ----
function animate(): void
{
    webgpu.submit(viewLogic.submit);
    requestAnimationFrame(animate);
}

requestAnimationFrame(animate);
