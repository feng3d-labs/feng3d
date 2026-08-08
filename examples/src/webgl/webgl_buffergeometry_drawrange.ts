import { WebGPU } from '@feng3d/webgpu';
import { CustomGeometry, logic, Object3D, PointGeometry, PointMaterial, reactive, Scene, SegmentMaterial, View, ticker } from 'feng3d';

/**
 * 粒子连线网络（drawRange 演示）。
 *
 * 对照 three.js：examples/webgl_buffergeometry_drawrange.html
 *
 * 原示例：1000 个粒子在立方体内随机运动，距离小于阈值的粒子之间用半透明连线相连。
 * 核心 API 是 BufferGeometry.setDrawRange(0, n) 动态控制渲染的线段顶点数。
 *
 * feng3d 适配：
 * - three.js Points + PointsMaterial → PointGeometry + PointMaterial（声明式 points 列表）
 * - three.js LineSegments + LineBasicMaterial{vertexColors} → CustomGeometry + SegmentMaterial，
 *   用 a_position/a_color 直接喂顶点，line-list 拓扑
 * - setDrawRange(0, n) → GeometryLogic.drawRange = { vertexCount: n }（本示例新增的库功能）
 * - 连线顶点缓冲区预分配最大容量（Float32Array），每帧只更新前 N 个 + 改 drawRange，
 *   避免每帧重建数组（对应原示例 DynamicDrawUsage + needsUpdate 的优化）
 *
 * 简化：省略 GUI/Stats/BoxHelper；粒子运动+连线判定逻辑完整保留。
 */

const webgpuCanvas = document.getElementById('webgpu') as HTMLCanvasElement;
const webgpu = await new WebGPU().init();

// ---- 参数（对应原示例 effectController 默认值） ----
const MAX_PARTICLES = 1000;
const PARTICLE_COUNT = 500;
const R = 800;            // 立方体边长
const R_HALF = R / 2;
const MIN_DISTANCE = 150; // 连线距离阈值

// ---- 粒子状态（位置 + 速度） ----
const particlePositions = new Float32Array(MAX_PARTICLES * 3);
const particleVelocities: { x: number; y: number; z: number }[] = [];
for (let i = 0; i < MAX_PARTICLES; i++)
{
    particlePositions[i * 3] = Math.random() * R - R_HALF;
    particlePositions[i * 3 + 1] = Math.random() * R - R_HALF;
    particlePositions[i * 3 + 2] = Math.random() * R - R_HALF;
    particleVelocities.push({
        x: -1 + Math.random() * 2,
        y: -1 + Math.random() * 2,
        z: -1 + Math.random() * 2,
    });
}

// ---- 粒子点云（PointGeometry，声明式） ----
const points: PointGeometry['points'] = [];
for (let i = 0; i < PARTICLE_COUNT; i++)
{
    points.push({
        position: {
            x: particlePositions[i * 3],
            y: particlePositions[i * 3 + 1],
            z: particlePositions[i * 3 + 2],
        },
        color: { __type__: 'Color4', r: 1, g: 1, b: 1, a: 1 },
    });
}

// ---- 连线（CustomGeometry，预分配最大缓冲区 + drawRange 控制实际渲染量） ----
// 每条线段 2 个顶点，每顶点 position(3) + color(4)
const MAX_VERTICES = MAX_PARTICLES * 30; // 限制最大连线顶点数，避免 O(n²) 最坏情况爆内存
const linePositions = new Float32Array(MAX_VERTICES * 3);
const lineColors = new Float32Array(MAX_VERTICES * 4);
const lineGeo: CustomGeometry = { __type__: 'CustomGeometry' };
// 顶点数据通过响应式数据接口写入（logic 字段只读）
const lineGeoR = reactive(lineGeo);
// 用 Float32Array 直接作为属性数据（setAttr 会 new Float32Array(value) 复制，这里传 Array.from 一次初始化满缓冲）
lineGeoR.positions = Array.from(linePositions);
lineGeoR.colors = Array.from(lineColors);
// 初始不渲染任何线段
lineGeoR.drawRange = { vertexCount: 0 };

// 旋转节点
let groupRot: { readonly x: number; readonly y: number; readonly z: number };

const view: View = {
    __type__: 'View',
    canvas: webgpuCanvas,
    root: {
        __type__: 'Object3D',
        name: 'Untitled',
        components: [{
            __type__: 'Scene',
            background: { __type__: 'Color4', r: 0.05, g: 0.05, b: 0.05, a: 1 },
        }],
        children: [
            {
                __type__: 'Object3D', name: 'Main Camera', position: { x: 0, y: 0, z: 1750 },
                components: [
                    {
                        __type__: 'PerspectiveCamera', fov: 45,
                        aspect: webgpuCanvas.width / webgpuCanvas.height, near: 1, far: 4000,
                    },
                    { __type__: 'OrbitControls', target: { x: 0, y: 0, z: 0 } },
                ],
            },
            // 粒子 + 连线放在旋转组里
            {
                __type__: 'Object3D',
                name: 'group',
                rotation: groupRot = { x: 0, y: 0, z: 0 },
                children: [
                    // 粒子点云
                    {
                        __type__: 'Object3D', name: 'points',
                        components: [{
                            __type__: 'MeshRenderer',
                            geometry: { __type__: 'PointGeometry', points } as PointGeometry,
                            material: {
                                __type__: 'PointMaterial',
                                uniforms: {
                                    u_color: { __type__: 'Color4', r: 1, g: 1, b: 1, a: 1 },
                                    u_PointSize: 6,
                                },
                            } as PointMaterial,
                        }],
                    },
                    // 连线
                    {
                        __type__: 'Object3D', name: 'lines',
                        components: [{
                            __type__: 'MeshRenderer',
                            geometry: lineGeo,
                            material: { __type__: 'SegmentMaterial' } as SegmentMaterial,
                        }],
                    },
                ],
            },
        ],
    },
};

const viewLogic = logic(view);

// ---- animate（粒子运动 + 连线判定 + drawRange） ----
const startTime = Date.now();

ticker.onframe(() =>
{
    let vertexpos = 0; // 写入 linePositions 的浮点数计数（每顶点 3 个）
    let colorpos = 0;  // 写入 lineColors 的浮点数计数（每顶点 4 个）

    // 粒子运动 + 边界反弹
    for (let i = 0; i < PARTICLE_COUNT; i++)
    {
        const v = particleVelocities[i];
        particlePositions[i * 3] += v.x;
        particlePositions[i * 3 + 1] += v.y;
        particlePositions[i * 3 + 2] += v.z;

        if (particlePositions[i * 3 + 1] < -R_HALF || particlePositions[i * 3 + 1] > R_HALF) v.y = -v.y;
        if (particlePositions[i * 3] < -R_HALF || particlePositions[i * 3] > R_HALF) v.x = -v.x;
        if (particlePositions[i * 3 + 2] < -R_HALF || particlePositions[i * 3 + 2] > R_HALF) v.z = -v.z;
    }

    // 连线判定（O(n²)），结果直接写入预分配缓冲区的前部
    for (let i = 0; i < PARTICLE_COUNT && vertexpos < linePositions.length - 6; i++)
    {
        for (let j = i + 1; j < PARTICLE_COUNT && vertexpos < linePositions.length - 6; j++)
        {
            const dx = particlePositions[i * 3] - particlePositions[j * 3];
            const dy = particlePositions[i * 3 + 1] - particlePositions[j * 3 + 1];
            const dz = particlePositions[i * 3 + 2] - particlePositions[j * 3 + 2];
            const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

            if (dist < MIN_DISTANCE)
            {
                const alpha = 1.0 - dist / MIN_DISTANCE;

                linePositions[vertexpos++] = particlePositions[i * 3];
                linePositions[vertexpos++] = particlePositions[i * 3 + 1];
                linePositions[vertexpos++] = particlePositions[i * 3 + 2];
                linePositions[vertexpos++] = particlePositions[j * 3];
                linePositions[vertexpos++] = particlePositions[j * 3 + 1];
                linePositions[vertexpos++] = particlePositions[j * 3 + 2];

                // SegmentMaterial a_color 是 float32x4
                for (let k = 0; k < 2; k++)
                {
                    lineColors[colorpos++] = alpha;
                    lineColors[colorpos++] = alpha;
                    lineColors[colorpos++] = alpha;
                    lineColors[colorpos++] = alpha;
                }
            }
        }
    }

    // 通过 drawRange 限制实际渲染的顶点数（核心：不重建缓冲区描述符）
    // 每帧把实际写入的部分拷贝为新的 number[] 赋给 positions（新引用触发响应式失效重传）
    const lineVertexCount = vertexpos / 3;
    lineGeoR.drawRange = { vertexCount: lineVertexCount };
    lineGeoR.positions = Array.from(linePositions.subarray(0, vertexpos));
    lineGeoR.colors = Array.from(lineColors.subarray(0, colorpos));

    // 更新粒子位置（reactive 触发 PointGeometry 重算）
    for (let i = 0; i < PARTICLE_COUNT; i++)
    {
        reactive(points[i]).position = {
            x: particlePositions[i * 3],
            y: particlePositions[i * 3 + 1],
            z: particlePositions[i * 3 + 2],
        };
    }

    // 整组缓慢自转
    const time = (Date.now() - startTime) / 1000;
    reactive(groupRot).y = time * 0.1;

    webgpu.submit(viewLogic.submit);
});
