// Material 结构体
struct Material {
    ambient: vec3<f32>,
    diffuse: vec3<f32>,
    specular: vec3<f32>,
    shininess: f32
}

// PerScene UBO - 与 bindingResources 的 key 对应
struct PerScene {
    material: Material
}
@group(0) @binding(1) var<uniform> perScene: PerScene;

// Light 结构体
struct Light {
    position: vec3<f32>
}

// PerPass UBO - 与 bindingResources 的 key 对应
struct PerPass {
    light: Light
}
@group(0) @binding(2) var<uniform> perPass: PerPass;

struct FragmentInput {
    @location(0) v_normal: vec3<f32>,
    @location(1) v_view: vec3<f32>,
    @location(2) v_color: vec4<f32>
}

@fragment
fn main(input: FragmentInput) -> @location(0) vec4<f32> {
    let n = normalize(input.v_normal);
    let l = normalize(perPass.light.position + input.v_view);
    let v = normalize(input.v_view);

    let diffuse = max(dot(n, l), 0.0) * perScene.material.diffuse;
    let r = -reflect(l, n);
    let specular = pow(max(dot(r, v), 0.0), perScene.material.shininess) * perScene.material.specular;

    return vec4<f32>(perScene.material.ambient + diffuse + specular, 1.0);
}
