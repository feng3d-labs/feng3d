struct VaryingStruct {
    @builtin(position) gl_Position: vec4<f32>,
    @location(0) vWorldPosition: vec3<f32>,
    @location(1) vSunDirection: vec3<f32>,
    @location(2) vSunfade: f32,
    @location(3) vBetaR: vec3<f32>,
    @location(4) vBetaM: vec3<f32>,
    @location(5) vSunE: f32,
}
@binding(8) @group(0) var<uniform> cameraPosition : vec3<f32>;
@binding(4) @group(0) var<uniform> up : vec3<f32>;
@binding(9) @group(0) var<uniform> mieDirectionalG : f32;
const pi: f32 = 3.141592653589793;
const rayleighZenithLength: f32 = 8400.0;
const mieZenithLength: f32 = 1250.0;
const THREE_OVER_SIXTEENPI: f32 = 0.05968310365946075;
const ONE_OVER_FOURPI: f32 = 0.07957747154594767;
const sunAngularDiameterCos: f32 = 0.9999566769464484;

@fragment
fn main(v: VaryingStruct) -> @location(0) vec4<f32> {
    var direction = normalize(v.vWorldPosition - cameraPosition);
    var zenithAngle = acos(max(dot(up, direction), 0.0));
    var inverse = 1.0 / (cos(zenithAngle) + 0.15 * pow(93.885 - zenithAngle * 180.0 / pi, -1.253));
    var sR = rayleighZenithLength * inverse;
    var sM = mieZenithLength * inverse;
    var Fex = exp(-(v.vBetaR * sR + v.vBetaM * sM));
    var cosTheta = dot(direction, v.vSunDirection);
    var rPhase = THREE_OVER_SIXTEENPI * (1.0 + pow(cosTheta * 0.5 + 0.5, 2.0));
    var betaRTheta = v.vBetaR * rPhase;
    var g2 = pow(mieDirectionalG, 2.0);
    var hgDenom = pow(1.0 - 2.0 * mieDirectionalG * cosTheta + g2, 1.5);
    var mPhase = ONE_OVER_FOURPI * ((1.0 - g2) / hgDenom);
    var betaMTheta = v.vBetaM * mPhase;
    var betaSum = v.vBetaR + v.vBetaM;
    var betaThetaSum = betaRTheta + betaMTheta;
    var betaRatio = betaThetaSum / betaSum;
    var Lin = pow(betaRatio * v.vSunE * (1.0 - Fex), vec3<f32>(1.5));
    var FexPow = pow(betaRatio * v.vSunE * Fex, vec3<f32>(0.5));
    var upDotSun = dot(up, v.vSunDirection);
    var mixFactor = clamp(pow(1.0 - upDotSun, 5.0), 0.0, 1.0);
    var LinMixed = Lin * mix(vec3<f32>(1.0), FexPow, mixFactor);
    var theta = acos(direction.y);
    var phi = atan2(direction.z, direction.x);
    var uv = vec2<f32>(phi, theta) / (vec2<f32>(2.0 * pi, pi)) + vec2<f32>(0.5, 0.0);
    var L0 = vec3<f32>(0.1) * Fex;
    var sundisk = smoothstep(sunAngularDiameterCos, sunAngularDiameterCos + 0.00002, cosTheta);
    var L0WithSun = L0 + Fex * v.vSunE * 19000.0 * sundisk;
    var texColor = (LinMixed + L0WithSun) * 0.04 + vec3<f32>(0.0, 0.0003, 0.00075);
    var retColor = pow(texColor, vec3<f32>(1.0 / (1.2 + 1.2 * v.vSunfade)));
    return vec4<f32>(retColor, 1.0);
}
