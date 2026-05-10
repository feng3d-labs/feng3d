import { acos, atan, attribute, clamp, cos, dot, exp, float, fragment, gl_Position, mat4, max, mix, normalize, pow, return_, smoothstep, uniform, var_, varying, vec2, vec3, vec4, vertex } from '@feng3d/tsl';

// Vertex shader 的 attributes
const position = attribute('position', vec3());

// Vertex shader 的 uniforms
const modelMatrix = uniform('modelMatrix', mat4());
const modelViewMatrix = uniform('modelViewMatrix', mat4());
const projectionMatrix = uniform('projectionMatrix', mat4());
const sunPosition = uniform('sunPosition', vec3());
const rayleigh = uniform('rayleigh', float());
const turbidity = uniform('turbidity', float());
const mieCoefficient = uniform('mieCoefficient', float());
const up = uniform('up', vec3());

// Varying 变量
const vWorldPosition = varying('vWorldPosition', vec3());
const vSunDirection = varying('vSunDirection', vec3());
const vSunfade = varying('vSunfade', float());
const vBetaR = varying('vBetaR', vec3());
const vBetaM = varying('vBetaM', vec3());
const vSunE = varying('vSunE', float());

// Vertex shader constants
const totalRayleigh = var_('totalRayleigh', vec3(5.804542996261093E-6, 1.3562911419845635E-5, 3.0265902468824876E-5));
const MieConst = var_('MieConst', vec3(1.8399918514433978E14, 2.7798023919660528E14, 4.0790479543861094E14));
const cutoffAngle = var_('cutoffAngle', 1.6110731556870734);
const steepness = var_('steepness', 1.5);
const EE = var_('EE', 1000.0);

// Vertex shader 入口函数
export const vertexShader = vertex('main', () =>
{

    const worldPosition = var_('worldPosition', modelMatrix.multiply(vec4(position, 1.0)));
    vWorldPosition.assign(worldPosition.xyz);
    gl_Position.assign(projectionMatrix.multiply(modelViewMatrix).multiply(vec4(position, 1.0)));
    gl_Position.z.assign(gl_Position.w);

    vSunDirection.assign(normalize(sunPosition));
    const zenithAngleCos = var_('zenithAngleCos', dot(vSunDirection, up));
    const clamped = var_('clamped', clamp(zenithAngleCos, -1.0, 1.0));
    const acosClamped = var_('acosClamped', acos(clamped));
    vSunE.assign(EE.multiply(max(0.0, float(1.0).subtract(exp(float(-1.0).multiply(cutoffAngle.subtract(acosClamped).divide(steepness)))))));

    vSunfade.assign(float(1.0).subtract(clamp(float(1.0).subtract(exp(sunPosition.y.divide(float(450000.0)))), float(0.0), float(1.0))));
    const rayleighCoefficient = var_('rayleighCoefficient', rayleigh.subtract(float(1.0).multiply(float(1.0).subtract(vSunfade))));
    vBetaR.assign(totalRayleigh.multiply(rayleighCoefficient));

    const c = var_('c', float(0.2).multiply(turbidity).multiply(float(10E-18)));
    const totalMieValue = var_('totalMieValue', float(0.434).multiply(c).multiply(MieConst));
    vBetaM.assign(totalMieValue.multiply(mieCoefficient));
});

// Fragment shader 的 uniforms
const cameraPosition = uniform('cameraPosition', vec3());
const mieDirectionalG = uniform('mieDirectionalG', float());
const upFrag = uniform('up', vec3());

// Fragment shader constants
const pi = var_('pi', 3.141592653589793);
const rayleighZenithLength = var_('rayleighZenithLength', 8.4E3);
const mieZenithLength = var_('mieZenithLength', 1.25E3);
const sunAngularDiameterCos = var_('sunAngularDiameterCos', 0.9999566769464484);
const THREE_OVER_SIXTEENPI = var_('THREE_OVER_SIXTEENPI', 0.05968310365946075);
const ONE_OVER_FOURPI = var_('ONE_OVER_FOURPI', 0.07957747154594767);

// Fragment shader 入口函数
export const fragmentShader = fragment('main', () =>
{
    const direction = var_('direction', normalize(vWorldPosition.subtract(cameraPosition)));
    const zenithAngle = var_('zenithAngle', acos(max(dot(upFrag, direction), float(0.0))));
    const inverse = var_('inverse', float(1.0).divide(cos(zenithAngle).add(float(0.15).multiply(pow(float(93.885).subtract(zenithAngle.multiply(float(180.0)).divide(pi)), float(-1.253))))));
    const sR = var_('sR', rayleighZenithLength.multiply(inverse));
    const sM = var_('sM', mieZenithLength.multiply(inverse));
    const Fex = var_('Fex', exp(float(-1.0).multiply(vBetaR.multiply(sR).add(vBetaM.multiply(sM)))));
    const cosTheta = var_('cosTheta', dot(direction, vSunDirection));
    const rPhase = var_('rPhase', THREE_OVER_SIXTEENPI.multiply(float(1.0).add(pow(cosTheta.multiply(float(0.5)).add(float(0.5)), float(2.0)))));
    const betaRTheta = var_('betaRTheta', vBetaR.multiply(rPhase));
    const g2 = var_('g2', pow(mieDirectionalG, float(2.0)));
    const hgDenom = var_('hgDenom', pow(float(1.0).subtract(float(2.0).multiply(mieDirectionalG).multiply(cosTheta)).add(g2), float(1.5)));
    const mPhase = var_('mPhase', ONE_OVER_FOURPI.multiply(float(1.0).subtract(g2).divide(hgDenom)));
    const betaMTheta = var_('betaMTheta', vBetaM.multiply(mPhase));
    const betaSum = var_('betaSum', vBetaR.add(vBetaM));
    const betaThetaSum = var_('betaThetaSum', betaRTheta.add(betaMTheta));
    const betaRatio = var_('betaRatio', betaThetaSum.divide(betaSum));
    const Lin = var_('Lin', pow(betaRatio.multiply(vSunE).multiply(float(1.0).subtract(Fex)), vec3(1.5)));
    const FexPow = var_('FexPow', pow(betaRatio.multiply(vSunE).multiply(Fex), vec3(0.5)));
    const upDotSun = var_('upDotSun', dot(upFrag, vSunDirection));
    const mixFactor = var_('mixFactor', clamp(pow(float(1.0).subtract(upDotSun), float(5.0)), float(0.0), float(1.0)));
    const LinMixed = var_('LinMixed', Lin.multiply(mix(vec3(1.0), FexPow, mixFactor)));
    const theta = var_('theta', acos(direction.y));
    const phi = var_('phi', atan(direction.z, direction.x));
    const uv = var_('uv', vec2(phi, theta).divide(vec2(float(2.0).multiply(pi), pi)).add(vec2(0.5, 0.0)));
    const L0 = var_('L0', vec3(0.1).multiply(Fex));
    const sundisk = var_('sundisk', smoothstep(sunAngularDiameterCos, sunAngularDiameterCos.add(float(0.00002)), cosTheta));
    const L0WithSun = var_('L0WithSun', L0.add(Fex.multiply(vSunE.multiply(float(19000.0))).multiply(sundisk)));
    const texColor = var_('texColor', LinMixed.add(L0WithSun).multiply(float(0.04)).add(vec3(0.0, 0.0003, 0.00075)));
    const retColor = var_('retColor', pow(texColor, vec3(float(1.0).divide(float(1.2).add(float(1.2).multiply(vSunfade))))));
    return_(vec4(retColor, 1.0));
});
