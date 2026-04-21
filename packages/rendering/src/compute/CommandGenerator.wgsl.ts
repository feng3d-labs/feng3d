/**
 * GPU驱动渲染 - 命令生成计算着色器
 *
 * 功能：
 * 1. 遍历所有物体
 * 2. 执行视锥剔除
 * 3. 选择LOD级别
 * 4. 生成间接绘制命令
 * 5. 按材质类型分类存储命令
 */

export const code = `
// ============================================================================
// 常量定义
// ============================================================================

const WORKGROUP_SIZE: u32 = 64u;

// 材质类型常量
const MATERIAL_TYPE_OPAQUE: u32 = 0u;
const MATERIAL_TYPE_TRANSPARENT: u32 = 1u;

// ============================================================================
// 结构体定义
// ============================================================================

// LOD级别数据
struct LODLevel {
    indexCount: u32,
    indexOffset: u32,
};

// 物体数据结构（128字节）
struct ObjectData {
    worldMatrix: mat4x4f,           // 64 bytes
    boundsCenter: vec3f,            // 12 bytes
    boundsRadius: f32,              // 4 bytes
    materialId: u32,                // 4 bytes
    isTransparent: u32,             // 4 bytes
    _padding: vec2u,               // 8 bytes (padding)
    lods: array<LODLevel, 4>,       // 32 bytes (4 levels * 8 bytes)
};

// 材质数据结构（48字节）
struct MaterialData {
    baseColor: vec4f,       // 16 bytes
    metallic: f32,          // 4 bytes
    roughness: f32,         // 4 bytes
    emissive: vec3f,        // 12 bytes
    materialType: u32,      // 4 bytes
    _padding: u32,         // 4 bytes (padding)
};

// 间接绘制命令结构（20字节）
struct DrawIndexedIndirect {
    indexCount: u32,
    instanceCount: u32,
    firstIndex: u32,
    vertexOffset: i32,
    baseInstance: u32,
};

// 相机数据（144 字节）
struct CameraData {
    viewMatrix: mat4x4f,          // 64 bytes
    projectionMatrix: mat4x4f,    // 64 bytes
    _padding: vec4f,              // 16 bytes (padding to align to 16 bytes)
};

// 视锥体数据（6个平面）
struct Frustum {
    planes: array<vec4f, 6>,  // 每个平面: (normal, distance)
};

// 相机统一数据（包含相机数据和视锥体数据）
struct CameraUniform {
    data: CameraData,
    frustum: Frustum,
};

// ============================================================================
// 资源绑定
// ============================================================================

// 输入资源
@group(0) @binding(0) var<storage, read> objects: array<ObjectData>;
@group(0) @binding(1) var<storage, read> materials: array<MaterialData>;
@group(0) @binding(2) var<uniform> cameraUniform: CameraUniform;
@group(0) @binding(3) var<uniform> objectCount: u32;

// 输出资源 - 不透明物体（按材质分组，假设最多128种材质）
@group(0) @binding(4) var<storage, read_write> opaqueCmds: array<DrawIndexedIndirect>;
@group(0) @binding(5) var<storage, read_write> opaqueCounters: array<atomic<u32>>;

// 输出资源 - 透明物体
@group(0) @binding(6) var<storage, read_write> transparentCmds: array<DrawIndexedIndirect>;
@group(0) @binding(7) var<storage, read_write> transparentCounter: atomic<u32>;

// ============================================================================
// 视锥剔除
// ============================================================================

// 点与平面关系测试
fn pointPlaneDistance(point: vec3f, plane: vec4f) -> f32
{
    return dot(plane.xyz, point) + plane.w;
}

// 球体与视锥体相交测试
fn frustumIntersectSphere(boundsCenter: vec3f, boundsRadius: f32) -> bool
{
    // 检查球心到每个平面的距离
    for (var i: u32 = 0u; i < 6u; i++)
    {
        let dist = pointPlaneDistance(boundsCenter, cameraUniform.frustum.planes[i]);
        if (dist < -boundsRadius)
        {
            // 球体在平面外侧，完全不可见
            return false;
        }
    }
    return true;
}

// ============================================================================
// LOD选择
// ============================================================================

// 计算物体到相机的距离
fn distanceToCamera(boundsCenter: vec3f) -> f32
{
    // 从 viewMatrix 中提取相机位置
    // viewMatrix 的第 4 列是 -camera_position（在 view space 中）
    let cameraPos = -vec3f(cameraUniform.data.viewMatrix[3].xyz);
    return length(boundsCenter - cameraPos);
}

// 根据距离选择LOD级别
fn selectLOD(boundsCenter: vec3f, boundsRadius: f32) -> u32
{
    let dist = distanceToCamera(boundsCenter);

    // LOD距离阈值（可配置）
    const LOD_0_THRESHOLD: f32 = 50.0;   // 0-50m: LOD 0 (最高质量)
    const LOD_1_THRESHOLD: f32 = 100.0;  // 50-100m: LOD 1
    const LOD_2_THRESHOLD: f32 = 200.0;  // 100-200m: LOD 2
    // > 200m: LOD 3 (最低质量)

    // 考虑物体大小，使用相对距离
    let relativeDist = dist / max(boundsRadius, 1.0);

    if (relativeDist < LOD_0_THRESHOLD)
    {
        return 0u;
    }
    else if (relativeDist < LOD_1_THRESHOLD)
    {
        return 1u;
    }
    else if (relativeDist < LOD_2_THRESHOLD)
    {
        return 2u;
    }
    else
    {
        return 3u;
    }
}

// ============================================================================
// 主函数
// ============================================================================

@compute @workgroup_size(WORKGROUP_SIZE)
fn main(@builtin(global_invocation_id) globalId: vec3u)
{
    let objIdx = globalId.x;

    // 边界检查
    if (objIdx >= objectCount)
    {
        return;
    }

    let obj = objects[objIdx];

    // 视锥剔除
    if (!frustumIntersectSphere(obj.boundsCenter, obj.boundsRadius))
    {
        return;  // 物体不可见，跳过
    }

    // LOD选择
    let lodLevel = selectLOD(obj.boundsCenter, obj.boundsRadius);
    let lod = obj.lods[lodLevel];

    // 检查LOD级别是否有效
    if (lod.indexCount == 0u)
    {
        return;  // 无效的LOD，跳过
    }

    // 构建间接绘制命令
    var cmd: DrawIndexedIndirect;
    cmd.indexCount = lod.indexCount;
    cmd.instanceCount = 1u;
    cmd.firstIndex = lod.indexOffset;
    cmd.vertexOffset = 0i;
    cmd.baseInstance = objIdx;

    // 根据材质类型写入对应缓冲区
    let material = materials[obj.materialId];

    if (material.materialType == MATERIAL_TYPE_TRANSPARENT)
    {
        // 透明物体：写入透明命令缓冲区
        let idx = atomicAdd(&transparentCounter, 1u);
        transparentCmds[idx] = cmd;
    }
    else
    {
        // 不透明物体：按材质ID写入对应缓冲区
        // 这里简化为单一缓冲区，实际实现应该按材质分组
        let idx = atomicAdd(&opaqueCounters[0], 1u);
        opaqueCmds[idx] = cmd;
    }
}
` as const;
