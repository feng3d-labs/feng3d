precision mediump float;

varying vec3 v_worldPosition;

uniform int u_lightType;
uniform vec3 u_lightPosition;
uniform float u_shadowCameraNear;
uniform float u_shadowCameraFar;

// @see https://github.com/mrdoob/three.js/blob/dev/src/renderers/shaders/ShaderChunk/packing.glsl
const float PackUpscale = 256. / 255.; // fraction -> 0..1 (including 1)
const vec3 PackFactors = vec3( 256. * 256. * 256., 256. * 256.,  256. );
const float ShiftRight8 = 1. / 256.;
vec4 packDepthToRGBA( const in float v ) 
{
	vec4 r = vec4( fract( v * PackFactors ), v );
	r.yzw -= r.xyz * ShiftRight8; // tidy overflow
	return r * PackUpscale;
}

void main() {

    vec3 lightToPosition = (v_worldPosition - u_lightPosition);
    float dp = ( length( lightToPosition ) - u_shadowCameraNear ) / ( u_shadowCameraFar - u_shadowCameraNear ); // need to clamp?
    gl_FragColor = packDepthToRGBA( dp );
}