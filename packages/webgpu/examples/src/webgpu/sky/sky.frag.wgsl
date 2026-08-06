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
}

@group(0) @binding(0) var<uniform> uniforms: Uniforms;

struct FragmentInput {
    @location(0) vWorldPosition: vec3f,
    @location(1) vSunDirection: vec3f,
    @location(2) vSunfade: f32,
    @location(3) vBetaR: vec3f,
    @location(4) vBetaM: vec3f,
    @location(5) vSunE: f32,
}

const pi: f32 = 3.141592653589793238462643383279502884197169;
const n: f32 = 1.0003;
const N: f32 = 2.545e25;
const rayleighZenithLength: f32 = 8.4e3;
const mieZenithLength: f32 = 1.25e3;
const sunAngularDiameterCos: f32 = 0.999956676946448443553574619906976478926848692873900859324;
const THREE_OVER_SIXTEENPI: f32 = 0.05968310365946075;
const ONE_OVER_FOURPI: f32 = 0.07957747154594767;

fn rayleighPhase(cosTheta: f32) -> f32 {
    return THREE_OVER_SIXTEENPI * (1.0 + pow(cosTheta, 2.0));
}

fn hgPhase(cosTheta: f32, g: f32) -> f32 {
    let g2 = pow(g, 2.0);
    let inverse = 1.0 / pow(1.0 - 2.0 * g * cosTheta + g2, 1.5);
    return ONE_OVER_FOURPI * ((1.0 - g2) * inverse);
}

fn sRGBTransferOETF(value: vec3f) -> vec3f {
    let threshold = vec3f(0.0031308);
    let linear = value * 12.92;
    let nonlinear = pow(value, vec3f(0.41666)) * 1.055 - vec3f(0.055);
    return select(nonlinear, linear, value <= threshold);
}

fn linearToOutputTexel(value: vec4f) -> vec4f {
    return vec4f(sRGBTransferOETF(value.rgb), value.a);
}

@fragment
fn main(input: FragmentInput) -> @location(0) vec4f {
    let direction = normalize(input.vWorldPosition - uniforms.cameraPosition);
    let zenithAngle = acos(max(0.0, dot(uniforms.up, direction)));
    let inverse = 1.0 / (cos(zenithAngle) + 0.15 * pow(93.885 - ((zenithAngle * 180.0) / pi), -1.253));
    let sR = rayleighZenithLength * inverse;
    let sM = mieZenithLength * inverse;
    let Fex = exp(-(input.vBetaR * sR + input.vBetaM * sM));
    let cosTheta = dot(direction, input.vSunDirection);
    let rPhase = rayleighPhase(cosTheta * 0.5 + 0.5);
    let betaRTheta = input.vBetaR * rPhase;
    let mPhase = hgPhase(cosTheta, uniforms.mieDirectionalG);
    let betaMTheta = input.vBetaM * mPhase;
    var Lin = pow(input.vSunE * ((betaRTheta + betaMTheta) / (input.vBetaR + input.vBetaM)) * (1.0 - Fex), vec3f(1.5));
    Lin *= mix(vec3f(1.0), pow(input.vSunE * ((betaRTheta + betaMTheta) / (input.vBetaR + input.vBetaM)) * Fex, vec3f(1.0 / 2.0)), clamp(pow(1.0 - dot(uniforms.up, input.vSunDirection), 5.0), 0.0, 1.0));
    let theta = acos(direction.y);
    let phi = atan2(direction.z, direction.x);
    let uv = vec2f(phi, theta) / vec2f(2.0 * pi, pi) + vec2f(0.5, 0.0);
    var L0 = vec3f(0.1) * Fex;
    let sundisk = smoothstep(sunAngularDiameterCos, sunAngularDiameterCos + 0.00002, cosTheta);
    L0 += (input.vSunE * 19000.0 * Fex) * sundisk;
    let texColor = (Lin + L0) * 0.04 + vec3f(0.0, 0.0003, 0.00075);
    let retColor = pow(texColor, vec3f(1.0 / (1.2 + (1.2 * input.vSunfade))));
    var fragColor = vec4f(retColor, 1.0);
    fragColor = linearToOutputTexel(fragColor);
    return fragColor;
}

