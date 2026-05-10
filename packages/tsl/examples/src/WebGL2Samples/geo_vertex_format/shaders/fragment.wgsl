// Uniforms
@group(0) @binding(4) var s_tex2D_texture: texture_2d<f32>;
@group(0) @binding(5) var s_tex2D: sampler;
@group(0) @binding(6) var<uniform> u_ambient: f32;

// Fragment input
struct FragmentInput {
    @location(0) v_texCoord: vec2<f32>,
    @location(1) v_normal: vec3<f32>,
    @location(2) v_lightDirection: vec3<f32>,
}

@fragment
fn main(input: FragmentInput) -> @location(0) vec4<f32> {
    // Sample texture
    var color: vec4<f32> = textureSample(s_tex2D_texture, s_tex2D, input.v_texCoord);
    
    // Compute lighting
    var lightIntensity: f32 = dot(normalize(input.v_normal), normalize(input.v_lightDirection));
    
    // Clamp light intensity to [0, 1] and add ambient
    lightIntensity = clamp(lightIntensity, 0.0, 1.0) + u_ambient;
    
    // Apply lighting
    color = color * lightIntensity;
    
    return color;
}

