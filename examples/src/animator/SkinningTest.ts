import { WebGPU } from '@feng3d/webgpu';
import { findByName, logic, mat4FromPosition, mat4Identity, reactive, ticker, View } from 'feng3d';
import type { CustomGeometry, Matrix4x4, Object3D, Skeleton, SkinnedMeshRenderer } from 'feng3d';

/**
 * WGSL 蒙皮（issue #337）的可视化用例：一根由两根骨骼驱动的竖直条带。
 *
 * - 条带 y ∈ [0, 2]，下半段（y < 1）权重给 `bone0`，上半段给 `bone1`；
 * - `bone1` 是 `bone0` 的子节点，位于 y = 1（关节处）；
 * - `boneInverses` 是绑定姿态世界矩阵的逆（`bone0` 在原点 → 单位矩阵；`bone1` 在 (0,1,0) → 反向平移）。
 *
 * 两根骨骼各自绕 z 摆动：画面里应能同时看到"根部整体摆动"与"上半段折弯"两段不同的运动。
 * 这正是蒙皮生效的判据——未实现蒙皮时网格只会随节点 transform 刚性移动，不会在关节处折弯。
 *
 * 页面暴露 `window.__skinningTest.setBoneAngles(a0, a1)`（弧度），供 e2e 用确定角度截图对比。
 */

const SEGMENTS = 4;
const HALF_WIDTH = 0.25;
const SEGMENT_HEIGHT = 0.5;
/** bone1 相对 bone0 的高度（关节位置） */
const BONE_HEIGHT = 1;

/** 竖直条带几何 + 两根骨骼的蒙皮索引/权重 */
function buildSkinGeometry(): CustomGeometry
{
    const positions: number[] = [];
    const uvs: number[] = [];
    const colors: number[] = [];
    const skinIndices: number[] = [];
    const skinWeights: number[] = [];
    const indices: number[] = [];

    for (let i = 0; i <= SEGMENTS; i++)
    {
        const y = i * SEGMENT_HEIGHT;
        for (const x of [-HALF_WIDTH, HALF_WIDTH])
        {
            positions.push(x, y, 0);
            uvs.push(x < 0 ? 0 : 1, i / SEGMENTS);
            colors.push(0.95, 0.8, 0.45, 1);
            // 阶跃权重：y < 1 完全跟 bone0，y >= 1 完全跟 bone1（关节处弯折最明显）
            const bone = y < BONE_HEIGHT ? 0 : 1;
            skinIndices.push(bone, 0, 0, 0);
            skinWeights.push(1, 0, 0, 0);
        }
    }

    for (let i = 0; i < SEGMENTS; i++)
    {
        const a = i * 2;
        const b = a + 1;
        const c = a + 2;
        const d = a + 3;
        indices.push(a, b, c, b, d, c);
    }

    const geometry: CustomGeometry = { __type__: 'CustomGeometry' };
    const r_geometry = reactive(geometry);
    r_geometry.positions = positions;
    r_geometry.uvs = uvs;
    r_geometry.colors = colors;
    r_geometry.indices = indices;
    r_geometry.a_skinIndices = skinIndices;
    r_geometry.a_skinWeights = skinWeights;

    return geometry;
}

const webgpuCanvas = document.getElementById('webgpu') as HTMLCanvasElement;
const webgpu = await new WebGPU().init();

const identity: Matrix4x4 = { __type__: 'Matrix4x4', ...mat4Identity() };
/** bone1 绑定姿态世界矩阵 T(0, 1, 0) 的逆 */
const boneInverse1: Matrix4x4 = { __type__: 'Matrix4x4', ...mat4FromPosition(0, -BONE_HEIGHT, 0) };

const view: View = {
    __type__: 'View',
    canvas: webgpuCanvas,
    root: {
        __type__: 'Object3D',
        name: 'Untitled',
        components: [{
            __type__: 'Scene',
            background: { __type__: 'Color4', r: 0.1, g: 0.12, b: 0.16, a: 1.0 },
        }],
        children: [{
            __type__: 'Object3D',
            name: 'Main Camera',
            position: { x: 0, y: 1, z: 4.5 },
            components: [{ __type__: 'PerspectiveCamera' }],
        }, {
            __type__: 'Object3D',
            name: 'SkinnedStrip',
            components: [
                {
                    __type__: 'SkinnedMeshRenderer',
                    geometry: buildSkinGeometry(),
                    material: {
                        __type__: 'StandardMaterial',
                        uniforms: { u_diffuse: { __type__: 'Color4', r: 1, g: 0.85, b: 0.55, a: 1 } },
                        cullFace: 'none',
                    },
                } as SkinnedMeshRenderer,
                {
                    __type__: 'Skeleton',
                    boneNames: ['bone0', 'bone1'],
                    boneInverses: [identity, boneInverse1],
                } as Skeleton,
            ],
            // 骨骼放在蒙皮节点子树里：SkeletonLogic 按名字从 Skeleton 所在实体向下查找
            children: [{
                __type__: 'Object3D',
                name: 'bone0',
                children: [{
                    __type__: 'Object3D',
                    name: 'bone1',
                    position: { x: 0, y: BONE_HEIGHT, z: 0 },
                }],
            }],
        }],
    },
};
const viewLogic = logic(view);

const bone0 = findByName(view.root, 'bone0') as Object3D;
const bone1 = findByName(view.root, 'bone1') as Object3D;

/**
 * 设置两根骨骼绕 z 的角度（弧度）。
 *
 * 给 e2e 用：同一页面在两组合成角度下截图，网格的像素分布必须随之改变（否则蒙皮没生效）。
 */
function setBoneAngles(angle0: number, angle1: number): void
{
    reactive(bone0).rotation = { x: 0, y: 0, z: angle0 };
    reactive(bone1).rotation = { x: 0, y: 0, z: angle1 };
}

/** 手动模式：e2e 接管骨骼角度后不再被自动动画覆盖 */
let manual = false;

(window as unknown as { __skinningTest?: { setBoneAngles: typeof setBoneAngles; setManual: (value: boolean) => void } }).__skinningTest = {
    setBoneAngles,
    setManual: (value: boolean) => { manual = value; },
};

let frame = 0;
ticker.onframe(() =>
{
    frame++;
    if (!manual)
    {
        const t = frame / 60;
        setBoneAngles(Math.sin(t) * 0.5, Math.sin(t * 1.3) * 0.6);
    }

    webgpu.submit(viewLogic.submit);
});
