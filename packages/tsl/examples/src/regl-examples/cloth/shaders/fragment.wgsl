@binding(2) @group(0) var texture_texture: texture_2d<f32>;
@binding(3) @group(0) var texture: sampler;

// 定义输入结构体
struct FragmentInput {
    @builtin(position) position: vec4<f32>,
    @location(0) vUv: vec2<f32>,
    @location(1) vNormal: vec3<f32>,
    @builtin(front_facing) gl_FrontFacing: bool
};

@fragment
fn main(
    input: FragmentInput
) -> @location(0) vec4<f32> {
    let tex = textureSample(texture_texture, texture, input.vUv * 1.0).xyz;
    let lightDir = normalize(vec3<f32>(0.4, 0.9, 0.3));
    
    var n = input.vNormal;
    
    // for the back faces we need to use the opposite normals.
    if (input.gl_FrontFacing == false) {
        n = -n;
    }
    
    let ambient = 0.3 * tex;
    let diffuse = 0.7 * tex * clamp(dot(n, lightDir), 0.0, 1.0);
    
    return vec4<f32>(ambient + diffuse, 1.0);
}