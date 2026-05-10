struct VaryingStruct {
    @builtin(position) gl_Position: vec4<f32>,
    @location(0) vWorldPosition: vec3<f32>,
    @location(1) vSunDirection: vec3<f32>,
    @location(2) vSunfade: f32,
    @location(3) vBetaR: vec3<f32>,
    @location(4) vBetaM: vec3<f32>,
    @location(5) vSunE: f32,
}
@binding(0) @group(0) var<uniform> modelMatrix : mat4x4<f32>;
@binding(1) @group(0) var<uniform> projectionMatrix : mat4x4<f32>;
@binding(2) @group(0) var<uniform> modelViewMatrix : mat4x4<f32>;
@binding(3) @group(0) var<uniform> sunPosition : vec3<f32>;
@binding(4) @group(0) var<uniform> up : vec3<f32>;
@binding(5) @group(0) var<uniform> rayleigh : f32;
@binding(6) @group(0) var<uniform> turbidity : f32;
@binding(7) @group(0) var<uniform> mieCoefficient : f32;
const EE: f32 = 1000.0;
const cutoffAngle: f32 = 1.6110731556870734;
const steepness: f32 = 1.5;
const totalRayleigh: vec3<f32> = vec3<f32>(0.000005804542996261093, 0.000013562911419845635, 0.000030265902468824876);
const MieConst: vec3<f32> = vec3<f32>(183999185144339.78, 277980239196605.28, 407904795438610.94);

@vertex
fn main(
    @location(0) position: vec3<f32>,
) -> VaryingStruct {
    var v: VaryingStruct;
    var worldPosition = modelMatrix * vec4<f32>(position, 1.0);
    v.vWorldPosition = worldPosition.xyz;
    v.gl_Position = projectionMatrix * modelViewMatrix * vec4<f32>(position, 1.0);
    v.gl_Position.z = v.gl_Position.w;
    v.vSunDirection = normalize(sunPosition);
    var zenithAngleCos = dot(v.vSunDirection, up);
    var clamped = clamp(zenithAngleCos, -1.0, 1.0);
    var acosClamped = acos(clamped);
    v.vSunE = EE * max(0.0, 1.0 - exp(-((cutoffAngle - acosClamped) / steepness)));
    v.vSunfade = 1.0 - clamp(1.0 - exp(sunPosition.y / 450000.0), 0.0, 1.0);
    var rayleighCoefficient = rayleigh - (1.0 * (1.0 - v.vSunfade));
    v.vBetaR = totalRayleigh * rayleighCoefficient;
    var c = 0.2 * turbidity * 1e-17;
    var totalMieValue = 0.434 * c * MieConst;
    v.vBetaM = totalMieValue * mieCoefficient;
    return v;
}
