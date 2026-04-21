fn getHDRColor(color: vec3<f32>, exposure: f32) -> vec3 < f32 > {
    // var newColor = color * (  1.0 / 255.0 ) ;
    return color * pow(2.4, exposure) ;
}

fn lambda2rgb(lambda : f32) -> vec3 < f32 > {
    let ultraviolet = 400.0;
    let infrared = 700.0;

    var a = (lambda - ultraviolet) / (infrared - ultraviolet);
    let c = 10.0;
    var b = vec3<f32>(a) - vec3<f32>(0.75, 0.5, 0.25);
    return max((1.0 - c * b * b), vec3<f32>(0.0));
}

fn CEToneMapping(color: vec3<f32>, adapted_lum: f32) -> vec3<f32>
{
    return 1.0 - exp(-adapted_lum * color);
}

fn ACESToneMapping(color: vec3<f32>, adapted_lum: f32) -> vec3<f32>
{
    let A = 2.51;
    let B = 0.03;
    let C = 2.43;
    let D = 0.59;
    let E = 0.14;

    var color2 = color * adapted_lum;
    color2 = (color2 * (A * color2 + B)) / (color2 * (C * color2 + D) + E);
    return color2;
}

fn gammaToLiner(color: vec4<f32>) -> vec4 < f32 > {
    let gammaCorrect = 2.4;
    var color2 = pow(color, vec4<f32>(gammaCorrect));
    return color2 ;
}

fn linerToGamma4(color: vec4<f32>) -> vec4 < f32 > {
    let gammaCorrect = 1.0 / 2.4;
    var color2 = pow(color, vec4<f32>(gammaCorrect));
    return color2 ;
}

fn linerToGamma3(color: vec3<f32>) -> vec3 < f32 > {
    let gammaCorrect = 1.0 / 2.4;
    var color2 = pow(color, vec3<f32>(gammaCorrect));
    return color2 ;
}

fn LinearToGammaSpace(linRGB0: vec3<f32>) -> vec3 < f32 > {
    var linRGB = max(linRGB0, vec3(0.0, 0.0, 0.0));
    linRGB.r = pow(linRGB.r, 0.416666667);
    linRGB.g = pow(linRGB.g, 0.416666667);
    linRGB.b = pow(linRGB.b, 0.416666667);
    return max(1.055 * linRGB - 0.055, vec3(0.0, 0.0, 0.0));
}

var<private>sRGB_2_LMS_MAT: mat3x3<f32> = mat3x3<f32>(
    17.8824, 43.5161, 4.1193,
    3.4557, 27.1554, 3.8671,
    0.02996, 0.18431, 1.4670,
);

var<private>LMS_2_sRGB_MAT: mat3x3<f32> = mat3x3<f32>(
    0.0809, -0.1305, 0.1167,
    -0.0102, 0.0540, -0.1136,
    -0.0003, -0.0041, 0.6935,
);

fn sRGB_2_LMS(RGB: vec3<f32>) -> vec3<f32>
{
    return sRGB_2_LMS_MAT * RGB;
}

fn LMS_2_sRGB(LMS: vec3<f32>) -> vec3<f32>
{
    return LMS_2_sRGB_MAT * LMS;
}

fn LinearToSrgbBranchless(lin: vec3<f32>) -> vec3<f32>
{
    var lin2 = max(vec3<f32>(6.10352e-5), lin);
    return min(lin2 * 12.92, pow(max(lin2, vec3<f32>(0.00313067)), vec3<f32>(1.0 / 2.4)) * vec3<f32>(1.055) - vec3<f32>(0.055));
}

fn sRGBToLinear(color : vec3<f32>) -> vec3<f32>
{
    let color2 = max(vec3<f32>(6.10352e-5), color);
    let c = 0.04045;
    if (color2.r > c && color2.g > c && color2.b > c) {
        return pow(color2 * (1.0 / 1.055) + 0.0521327, vec3<f32>(2.4));
    } else {
        return color2 * (1.0 / 12.92);
    }
}

struct UniformData {
    width: f32,
    height: f32,
    sunU: f32,
    sunV: f32,
    eyePos: f32,
    sunRadius: f32,         // = 500.0;
    sunRadiance: f32,       // = 20.0;
    mieG: f32,              // = 0.76;
    mieHeight: f32,         // = 1200;
    sunBrightness: f32,     // = 1.0;
    displaySun: f32,        // > 0.5: true
    skyColor: vec4<f32>,        // sky color
};

@group(0) @binding(0) var<uniform> uniformBuffer: UniformData;
@group(0) @binding(1) var outTexture : texture_storage_2d<rgba16float, write>;

var<private> uv01: vec2<f32>;
var<private> fragCoord: vec2<i32>;
var<private> texSizeF32: vec2<f32>;

var<private> PI:f32 = 3.1415926535;
var<private> PI_2:f32 = 0.0;
var<private> EPSILON:f32 = 0.0000001;
var<private> SAMPLES_NUMS:i32 = 16;

var<private> transmittance:vec3<f32>;
var<private> insctrMie:vec3<f32>;
var<private> insctrRayleigh:vec3<f32>;

@compute @workgroup_size( 8 , 8 , 1 )
fn CsMain( @builtin(workgroup_id) workgroup_id : vec3<u32> , @builtin(global_invocation_id) globalInvocation_id : vec3<u32>)
{
    fragCoord = vec2<i32>(globalInvocation_id.xy);
    texSizeF32 = vec2<f32>( uniformBuffer.width, uniformBuffer.height);
    uv01 = vec2<f32>(globalInvocation_id.xy) / texSizeF32;
    uv01.y = 1.0 - uv01.y - EPSILON;
    PI_2 = PI * 2.0;
    textureStore(outTexture, fragCoord , mainImage(uv01));//vec4(uv01, 0.0, 1.0));
}

struct ScatteringParams
{
    sunRadius:f32,
    sunRadiance:f32,

    mieG:f32,
    mieHeight:f32,

    rayleighHeight:f32,

    waveLambdaMie:vec3<f32>,
    waveLambdaOzone:vec3<f32>,
    waveLambdaRayleigh:vec3<f32>,

    earthRadius:f32,
    earthAtmTopRadius:f32,
    earthCenter:vec3<f32>,
}

fn ComputeSphereNormal(coord:vec2<f32>, phiStart:f32, phiLength:f32, thetaStart:f32, thetaLength:f32) -> vec3<f32>
{
    var normal:vec3<f32>;
    normal.x = -sin(thetaStart + coord.y * thetaLength) * sin(phiStart + coord.x * phiLength);
    normal.y = -cos(thetaStart + coord.y * thetaLength);
    normal.z = -sin(thetaStart + coord.y * thetaLength) * cos(phiStart + coord.x * phiLength);
    return normalize(normal);
}

fn ComputeRaySphereIntersection(position:vec3<f32>, dir:vec3<f32>, center:vec3<f32>, radius:f32) -> vec2<f32>
{
    var origin:vec3<f32> = position - center;
    var B = dot(origin, dir);
    var C = dot(origin, origin) - radius * radius;
    var D = B * B - C;

    var minimaxIntersections:vec2<f32>;
    if (D < 0.0)
    {
        minimaxIntersections = vec2<f32>(-1.0, -1.0);
    }
    else
    {
        D = sqrt(D);
        minimaxIntersections = vec2<f32>(-B - D, -B + D);
    }

    return minimaxIntersections;
}

fn ComputeWaveLambdaRayleigh(lambda: vec3<f32>) -> vec3<f32>
{
    var n:f32 = 1.0003;
    var N:f32 = 2.545E25;
    var pn:f32 = 0.035;
    var n2:f32 = n * n;
    var pi3:f32 = PI * PI * PI;
    var rayleighConst:f32 = (8.0 * pi3 * pow(n2 - 1.0,2.0)) / (3.0 * N) * ((6.0 + 3.0 * pn) / (6.0 - 7.0 * pn));
    return vec3<f32>(rayleighConst) / (lambda * lambda * lambda * lambda);
}

fn ComputePhaseMie(theta: f32, g:f32) -> f32
{
    var g2 = g * g;
    return (1.0 - g2) / pow(1.0 + g2 - 2.0 * g * saturate(theta), 1.5) / (4.0 * PI);
}

fn ComputePhaseRayleigh(theta: f32) -> f32
{
    var theta2 = theta * theta;
    return (theta2 * 0.75 + 0.75) / (4.0 * PI);
}

fn ChapmanApproximation(X: f32, h: f32, cosZenith: f32) -> f32
{
    var c = sqrt(X + h);
    var c_exp_h = c * exp(-h);

    if (cosZenith >= 0.0)
    {
        return c_exp_h / (c * cosZenith + 1.0);
    }
    else
    {
        var x0 = sqrt(1.0 - cosZenith * cosZenith) * (X + h);
        var c0 = sqrt(x0);

        return 2.0 * c0 * exp(X - x0) - c_exp_h / (1.0 - c * cosZenith);
    }
}

fn GetOpticalDepthSchueler(h: f32, H: f32, earthRadius: f32, cosZenith: f32) -> f32
{
    return H * ChapmanApproximation(earthRadius / H, h / H, cosZenith);
}

fn GetTransmittance(setting: ScatteringParams, L:vec3<f32>, V: vec3<f32>) -> vec3<f32>
{
    var ch = GetOpticalDepthSchueler(L.y, setting.rayleighHeight, setting.earthRadius, V.y);
    return exp(-(setting.waveLambdaMie + setting.waveLambdaRayleigh) * ch);
}

fn ComputeOpticalDepth(setting: ScatteringParams, samplePoint: vec3<f32>, V: vec3<f32>, L: vec3<f32>, neg: f32) -> vec2<f32>
{
    var rl = length(samplePoint);
    var h = rl - setting.earthRadius;
    var r: vec3<f32> = samplePoint / rl;

    var cos_chi_sun = dot(r, L);
    var cos_chi_ray = dot(r, V * neg);

    var opticalDepthSun = GetOpticalDepthSchueler(h, setting.rayleighHeight, setting.earthRadius, cos_chi_sun);
    var opticalDepthCamera = GetOpticalDepthSchueler(h, setting.rayleighHeight, setting.earthRadius, cos_chi_ray) * neg;

    return vec2<f32>(opticalDepthSun, opticalDepthCamera);
}

fn AerialPerspective(setting:ScatteringParams, start: vec3<f32>, end: vec3<f32>, V: vec3<f32>, L: vec3<f32>, infinite:i32)
{
    var inf_neg:f32 = 1.0;
    if( infinite == 0){
        inf_neg = -1.0;
    }

    var sampleStep: vec3<f32> = (end - start) / f32(SAMPLES_NUMS);
    var samplePoint: vec3<f32> = end - sampleStep;
    var sampleLambda: vec3<f32> = setting.waveLambdaMie + setting.waveLambdaRayleigh + setting.waveLambdaOzone;

    var sampleLength:f32 = length(sampleStep);

    var scattering:vec3<f32> = vec3<f32>(0.0);
    var lastOpticalDepth:vec2<f32> = ComputeOpticalDepth(setting, end, V, L, inf_neg);

    for (var i:i32 = 1; i < SAMPLES_NUMS; i = i + 1)
    {
        var opticalDepth: vec2<f32> = ComputeOpticalDepth(setting, samplePoint, V, L, inf_neg);

        var segment_s: vec3<f32> = exp(-sampleLambda * (opticalDepth.x + lastOpticalDepth.x));
        var segment_t: vec3<f32> = exp(-sampleLambda * (opticalDepth.y - lastOpticalDepth.y));

        transmittance *= segment_t;

        scattering = scattering * segment_t;
        scattering += exp(-(length(samplePoint) - setting.earthRadius) / setting.rayleighHeight) * segment_s;

        lastOpticalDepth = opticalDepth;
        samplePoint = samplePoint - sampleStep;
    }

    insctrMie = scattering * setting.waveLambdaMie * sampleLength;
    insctrRayleigh = scattering * setting.waveLambdaRayleigh * sampleLength;
}

fn ComputeSkyboxChapman(setting: ScatteringParams, eye:vec3<f32>, V:vec3<f32>, L:vec3<f32>) -> f32
{
    var neg:i32 = 1;
    var outerIntersections: vec2<f32> = ComputeRaySphereIntersection(eye, V, setting.earthCenter, setting.earthAtmTopRadius);
    if (outerIntersections.y < 0.0){
        return 0.0;
    }
    var innerIntersections: vec2<f32> = ComputeRaySphereIntersection(eye, V, setting.earthCenter, setting.earthRadius);
    if (innerIntersections.x > 0.0)
    {
        neg = 0;
        outerIntersections.y = innerIntersections.x;
    }

    let eye0 = eye - setting.earthCenter;

    var start : vec3<f32> = eye0 + V * max(0.0, outerIntersections.x);
    var end : vec3<f32> = eye0 + V * outerIntersections.y;

    AerialPerspective(setting, start, end, V, L, neg);

    //bool intersectionTest = innerIntersections.x < 0.0 && innerIntersections.y < 0.0;
    //return intersectionTest ? 1.0 : 0.0;

    if(innerIntersections.x < 0.0 && innerIntersections.y < 0.0){
        return 1.0;
    }
    return 0.0;
}

fn ComputeSkyInscattering(setting: ScatteringParams, eye: vec3<f32>, V: vec3<f32>, L: vec3<f32>) -> vec4<f32>
{
    transmittance = vec3<f32>(1.0);
    insctrMie = vec3<f32>(0.0);
    insctrRayleigh = vec3<f32>(0.0);
    var intersectionTest:f32 = ComputeSkyboxChapman(setting, eye, V, L);

    var phaseTheta = dot(V, L);
    var phaseMie = ComputePhaseMie(phaseTheta, setting.mieG);
    var phaseRayleigh = ComputePhaseRayleigh(phaseTheta);
    var phaseNight = 1.0 - saturate(transmittance.x * EPSILON);

    var insctrTotalMie: vec3<f32> = insctrMie * phaseMie;
    var insctrTotalRayleigh: vec3<f32> = insctrRayleigh * phaseRayleigh;

    var sky: vec3<f32> = (insctrTotalMie + insctrTotalRayleigh) * setting.sunRadiance;
    if(uniformBuffer.displaySun > 0.5){
        var angle:f32 = saturate((1.0 - phaseTheta) * setting.sunRadius);
        var cosAngle:f32 = cos(angle * PI * 0.5);
        var edge:f32 = 0.0;
        if(angle >= 0.9){
        edge = smoothstep(0.9, 1.0, angle);
        }

        var limbDarkening: vec3<f32> = GetTransmittance(setting, -L, V);
        limbDarkening *= pow(vec3<f32>(cosAngle), vec3<f32>(0.420, 0.503, 0.652)) * mix(vec3<f32>(1.0), vec3<f32>(1.2,0.9,0.5), edge) * intersectionTest;
        sky += limbDarkening * uniformBuffer.sunBrightness; 
    }
    return vec4<f32>(sky, phaseNight * intersectionTest);
}

fn TonemapACES(x: vec3<f32>) -> vec3<f32>
{
    var A:f32 = 2.51f;
    var B:f32 = 0.03f;
    var C:f32 = 2.43f;
    var D:f32 = 0.59f;
    var E:f32 = 0.14f;
    return (x * (A * x + B)) / (x * (C * x + D) + E);
}

fn noise(uv:vec2<f32>) -> f32
{
    return fract(dot(sin(vec3<f32>(uv.xyx) * vec3<f32>(uv.xyy) * 1024.0), vec3<f32>(341896.483, 891618.637, 602649.7031)));
}

fn mainImage( uv:vec2<f32> ) -> vec4<f32>
{
    let eyePosition = uniformBuffer.eyePos;
    var sun = vec2<f32>(uniformBuffer.sunU, uniformBuffer.sunV);
    var V: vec3<f32> = ComputeSphereNormal(uv, 0.0, PI_2, 0.0, PI);
    var L: vec3<f32> = ComputeSphereNormal(vec2<f32>(sun.x, sun.y), 0.0, PI_2, 0.0, PI);

    var setting: ScatteringParams;
    setting.sunRadius = uniformBuffer.sunRadius;//500.0;
    setting.sunRadiance = uniformBuffer.sunRadiance;//20.0;
    setting.mieG = uniformBuffer.mieG;//0.76;
    setting.mieHeight = uniformBuffer.mieHeight;// 1200.0;
    setting.rayleighHeight = 8000.0;
    setting.earthRadius = 6360000.0;
    setting.earthAtmTopRadius = 6420000.0;
    setting.earthCenter = vec3<f32>(0, -setting.earthRadius, 0);
    setting.waveLambdaMie = vec3<f32>(0.0000002);

    // wavelength with 680nm, 550nm, 450nm
    setting.waveLambdaRayleigh = ComputeWaveLambdaRayleigh(vec3<f32>(0.000000680, 0.000000550, 0.000000450));

    // see https://www.shadertoy.com/view/MllBR2
    setting.waveLambdaOzone = vec3<f32>(1.36820899679147, 3.31405330400124, 0.13601728252538)* 0.0000006 * 2.504;

    var eye:vec3<f32> = vec3<f32>(0,eyePosition,0);
    var sky0:vec4<f32> = ComputeSkyInscattering(setting, eye, V, L);
    var sky = vec3<f32>(sky0.rgb);

    sky = TonemapACES(sky.rgb * 2.0);
    sky = pow(sky.rgb, vec3<f32>(1.0/1.2)); // gamma

    var fragColor:vec4<f32> = vec4<f32>((sky.rgb), 1.0);
    return fragColor;
}