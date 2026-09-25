// The linear-light input framebuffer
@group(0) @binding(0) var input  : texture_2d<f32>;

// The tonemapped, gamma-corrected output framebuffer
@group(0) @binding(1) var output : texture_storage_2d<{OUTPUT_FORMAT}, write>;

const TonemapExposure = 0.5;

const Gamma = 2.2;

override WorkgroupSizeX : u32;
override WorkgroupSizeY : u32;

@compute @workgroup_size(WorkgroupSizeX, WorkgroupSizeY)
fn main(@builtin(global_invocation_id) invocation_id: vec3<u32>) {
    let color = textureLoad(input, vec2<i32>(invocation_id.xy), 0).rgb;
    let tonemapped = reinhard_tonemap(color);
    textureStore(output, vec2<i32>(invocation_id.xy), vec4<f32>(tonemapped, 1.0));
}

fn reinhard_tonemap(linearColor: vec3<f32>) -> vec3<f32> {
    let color = linearColor * TonemapExposure;
    let mapped = color / (1.0 + color);
    return pow(mapped, vec3<f32>(1.0 / Gamma));
}
