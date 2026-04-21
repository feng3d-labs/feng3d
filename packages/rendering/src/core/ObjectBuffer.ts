/**
 * WGSL 着色器中的物体数据结构定义
 */
export const OBJECT_DATA_WGSL = `
// 物体数据结构（128字节）
struct ObjectData {
    worldMatrix: mat4x4f,           // 64 bytes
    boundsCenter: vec3f,            // 12 bytes
    boundsRadius: f32,              // 4 bytes
    materialId: u32,                // 4 bytes
    isTransparent: u32,             // 4 bytes
    __padding: vec2u,               // 8 bytes (padding)
    lods: array<LODLevel, 4>,       // 32 bytes (4 levels * 8 bytes)
};

// LOD级别
struct LODLevel {
    indexCount: u32,
    indexOffset: u32,
};

// 物体缓冲
@group(0) @binding(0) var<storage, read> objects: array<ObjectData>;
`;
