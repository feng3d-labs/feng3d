struct Uniforms {
    modelMatrix: mat4x4f,
    modelViewMatrix: mat4x4f,
    projectionMatrix: mat4x4f,
    viewMatrix: mat4x4f,
    cameraPosition: vec3f,
    sunPosition: vec3f,
    rayleigh: f32,
    turbidity: f32,
    mieCoefficient: f32,
    up: vec3f,
    mieDirectionalG: f32,
};

@group(0) @binding(0) var<uniform> uniforms: Uniforms;

struct VertexInput {
    @location(0) position: vec3f,
}

struct VertexOutput {
    @builtin(position) position: vec4f,
    @location(0) vWorldPosition: vec3f,
    @location(1) vSunDirection: vec3f,
    @location(2) vSunfade: f32,
    @location(3) vBetaR: vec3f,
    @location(4) vBetaM: vec3f,
    @location(5) vSunE: f32,
}

const e: f32 = 2.71828182845904523536028747135266249775724709369995957;
const pi: f32 = 3.141592653589793238462643383279502884197169;
const lambda: vec3f = vec3f(680.0e-9, 550.0e-9, 450.0e-9);
const totalRayleigh: vec3f = vec3f(5.804542996261093e-6, 1.3562911419845635e-5, 3.0265902468824876e-5);
const v: f32 = 4.0;
const K: vec3f = vec3f(0.686, 0.678, 0.666);
const MieConst: vec3f = vec3f(1.8399918514433978e14, 2.7798023919660528e14, 4.0790479543861094e14);
const cutoffAngle: f32 = 1.6110731556870734;
const steepness: f32 = 1.5;
const EE: f32 = 1000.0;

fn sunIntensity(zenithAngleCos: f32) -> f32 {
    let clamped = clamp(zenithAngleCos, -1.0, 1.0);
    return EE * max(0.0, 1.0 - pow(e, -((cutoffAngle - acos(clamped)) / steepness)));
}

fn totalMie(T: f32) -> vec3f {
    let c = (0.2 * T) * 10.0e-18;
    return 0.434 * c * MieConst;
}

@vertex
fn main(input: VertexInput) -> VertexOutput {
    var output: VertexOutput;
    
    let worldPosition = uniforms.modelMatrix * vec4f(input.position, 1.0);
    output.vWorldPosition = worldPosition.xyz;
    output.position = uniforms.projectionMatrix * uniforms.modelViewMatrix * vec4f(input.position, 1.0);
    output.position.z = output.position.w;
    
    output.vSunDirection = normalize(uniforms.sunPosition);
    output.vSunE = sunIntensity(dot(output.vSunDirection, uniforms.up));
    output.vSunfade = 1.0 - clamp(1.0 - exp(uniforms.sunPosition.y / 450000.0), 0.0, 1.0);
    
    let rayleighCoefficient = uniforms.rayleigh - (1.0 * (1.0 - output.vSunfade));
    output.vBetaR = totalRayleigh * rayleighCoefficient;
    output.vBetaM = totalMie(uniforms.turbidity) * uniforms.mieCoefficient;
    
    return output;
}

