// Transform 结构体
struct Transform {
    P: mat4x4<f32>,
    MV: mat4x4<f32>,
    Mnormal: mat4x4<f32>
}

// PerDraw UBO - 与 bindingResources 的 key 对应
struct PerDraw {
    transform: Transform
}
@group(0) @binding(0) var<uniform> perDraw: PerDraw;

struct VertexInput {
    @location(0) position: vec3<f32>,
    @location(1) normal: vec3<f32>,
    @location(2) color: vec4<f32>
}

struct VertexOutput {
    @location(0) v_normal: vec3<f32>,
    @location(1) v_view: vec3<f32>,
    @location(2) v_color: vec4<f32>,
    @builtin(position) position: vec4<f32>
}

@vertex
fn main(input: VertexInput) -> VertexOutput {
    var output: VertexOutput;

    let pEC = perDraw.transform.MV * vec4<f32>(input.position, 1.0);

    output.v_normal = (perDraw.transform.Mnormal * vec4<f32>(input.normal, 0.0)).xyz;
    output.v_view = -pEC.xyz;
    output.v_color = input.color;
    output.position = perDraw.transform.P * pEC;

    let _pos_temp = output.position;
    output.position = vec4<f32>(_pos_temp.xy, (_pos_temp.z + 1.0) * 0.5, _pos_temp.w);
    
    return output;
}
