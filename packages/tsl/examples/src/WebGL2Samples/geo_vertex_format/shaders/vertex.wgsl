// Uniforms
@group(0) @binding(0) var<uniform> u_model: mat4x4<f32>;
@group(0) @binding(1) var<uniform> u_modelInvTrans: mat4x4<f32>;
@group(0) @binding(2) var<uniform> u_viewProj: mat4x4<f32>;
@group(0) @binding(3) var<uniform> u_lightPosition: vec3<f32>;

// Vertex input
struct VertexInput {
    @location(1) a_position: vec3<f32>,
    @location(2) a_texCoord: vec2<f32>,
    @location(3) a_normal: vec3<f32>,
}

// Vertex output
struct VertexOutput {
    @builtin(position) position: vec4<f32>,
    @location(0) v_texCoord: vec2<f32>,
    @location(1) v_normal: vec3<f32>,
    @location(2) v_lightDirection: vec3<f32>,
}

@vertex
fn main(input: VertexInput) -> VertexOutput {
    var output: VertexOutput;
    
    // Compute world position
    var modelPosition: vec3<f32> = (u_model * vec4<f32>(input.a_position, 1.0)).xyz;
    
    // Compute light direction
    output.v_lightDirection = (u_viewProj * vec4<f32>(u_lightPosition - modelPosition, 1.0)).xyz;
    
    // Compute final position
    output.position = u_viewProj * vec4<f32>(modelPosition, 1.0);
    
    // Convert depth from [-1, 1] to [0, 1]
    output.position.z = (output.position.z + output.position.w) * 0.5;
    
    // Transform normal
    output.v_normal = (u_viewProj * u_modelInvTrans * vec4<f32>(input.a_normal, 0.0)).xyz;
    
    // Pass through texture coordinates
    output.v_texCoord = input.a_texCoord;
    
    return output;
}

