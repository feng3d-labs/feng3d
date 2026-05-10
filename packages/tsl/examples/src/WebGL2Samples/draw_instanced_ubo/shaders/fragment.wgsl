// Material UBO - 与 bindingResources 的 key 对应
struct Material {
    Diffuse: array<vec4<f32>, 2>
}
@group(0) @binding(1) var<uniform> material: Material;

struct FragmentInput {
    @location(0) @interpolate(flat) instance: i32
}

@fragment
fn main(input: FragmentInput) -> @location(0) vec4<f32> {
    return material.Diffuse[input.instance % 2];
}
