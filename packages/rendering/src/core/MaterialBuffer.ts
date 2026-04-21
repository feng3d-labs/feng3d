/**
 * WGSL 着色器中的材质数据结构定义
 */
export const MATERIAL_DATA_WGSL = `
// 材质类型
const MATERIAL_TYPE_OPAQUE: u32 = 0u;
const MATERIAL_TYPE_TRANSPARENT: u32 = 1u;

// 材质数据结构（48字节）
struct MaterialData {
    baseColor: vec4f,       // 16 bytes
    metallic: f32,          // 4 bytes
    roughness: f32,         // 4 bytes
    emissive: vec3f,        // 12 bytes
    materialType: u32,      // 4 bytes
    _padding: u32,         // 4 bytes (padding)
};

// 材质缓冲
@group(0) @binding(1) var<storage, read> materials: array<MaterialData>;

// 从材质ID获取材质数据的辅助函数
fn getMaterial(materialId: u32) -> MaterialData {
    return materials[materialId];
}

// 判断是否为透明材质
fn isTransparent(material: MaterialData) -> bool {
    return material.materialType == MATERIAL_TYPE_TRANSPARENT;
}
`;
